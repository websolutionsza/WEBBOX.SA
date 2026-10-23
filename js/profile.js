/**
 * WEB BOX SA — local profile
 * Lightweight, device-specific profile. No account, no upload.
 *
 * Storage layout:
 *   - localStorage : display name + selected preset character id
 *   - IndexedDB    : optional custom profile image (binary blob)
 *
 * Custom images NEVER leave the user's device. There is no upload,
 * no public storage bucket, no Supabase call.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;
  const api = WEBBOX.api;

  const LS_KEY = "webbox_profile_v1";
  const DB_NAME = "webbox-profile-db";
  const STORE = "images";
  const IMG_KEY = "custom-profile";
  const MAX_BYTES = 4 * 1024 * 1024; // 4 MiB
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  let characters = [];
  let profile = { name: "", characterId: "", hasCustomImage: false };

  /* ---------- IndexedDB helpers ---------- */
  function openDb() {
    return new Promise(function (resolve, reject) {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function (e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(e.target.error); };
      } catch (e) {
        reject(e);
      }
    });
  }

  function saveImageBlob(blob) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(blob, IMG_KEY);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function loadImageBlob() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(IMG_KEY);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function deleteImageBlob() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(IMG_KEY);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  /* ---------- State load / save ---------- */
  function loadProfile() {
    const stored = utils.lsGet(LS_KEY, null);
    if (stored && typeof stored === "object") {
      profile = {
        name: typeof stored.name === "string" ? stored.name : "",
        characterId: typeof stored.characterId === "string" ? stored.characterId : "",
        hasCustomImage: !!stored.hasCustomImage
      };
    }
  }

  function persistProfile() {
    utils.lsSet(LS_KEY, profile);
  }

  /* ---------- Rendering ---------- */
  function currentAvatarUrl() {
    if (profile.hasCustomImage) {
      return null; // rendered from blob URL below
    }
    const c = characters.find(function (ch) { return ch.id === profile.characterId; }) || characters[0];
    if (c && c.image) return c.image;
    if (!c) return utils.placeholderSvg({
      accent: "#E11D2A",
      glyph: "W",
      title: "WEB BOX profile"
    });
    return utils.placeholderSvg({
      accent: c.accent,
      glyph: c.glyph || c.name.slice(0, 1).toUpperCase(),
      title: c.name + " — preset character"
    });
  }

  function renderPreview(customBlobUrl) {
    const preview = utils.byId("profile-preview");
    if (!preview) return;
    utils.clear(preview);
    const avatar = utils.el("div", { class: "profile-avatar" });
    let imgSrc, imgAlt;
    if (profile.hasCustomImage && customBlobUrl) {
      imgSrc = customBlobUrl;
      imgAlt = "Your custom profile image";
    } else {
      imgSrc = currentAvatarUrl();
      imgAlt = "Selected preset character avatar";
    }
    const img = utils.el("img", {
      class: "profile-avatar__img",
      src: imgSrc,
      alt: imgAlt,
      width: 160,
      height: 160,
      loading: "eager",
      decoding: "async"
    });
    avatar.appendChild(img);
    preview.appendChild(avatar);

    const info = utils.el("div", { class: "profile-preview__info" });
    const name = utils.el("p", { class: "profile-preview__name" }, profile.name || "Guest player");
    info.appendChild(name);
    const ch = characters.find(function (c) { return c.id === profile.characterId; });
    info.appendChild(utils.el("p", { class: "profile-preview__sub" },
      profile.hasCustomImage
        ? "Custom profile image — stored on this device"
        : (ch ? "Preset: " + ch.name : "No preset character selected")));
    preview.appendChild(info);
  }

  function renderCharacterPicker() {
    const wrap = utils.byId("character-picker");
    if (!wrap) return;
    utils.clear(wrap);
    characters.forEach(function (c) {
      const card = utils.el("button", {
        type: "button",
        class: "character-card" + (c.id === profile.characterId ? " is-selected" : ""),
        "aria-pressed": c.id === profile.characterId ? "true" : "false"
      });
      const img = utils.el("img", {
        class: "character-card__img",
        src: c.image || utils.placeholderSvg({
          accent: c.accent,
            glyph: c.glyph || c.name.slice(0, 1).toUpperCase(),
            title: c.name + " — preset character",
            width: 300,
            height: 300
          }),
        alt: c.name + " preset",
        width: 120,
        height: 120,
        loading: "lazy",
        decoding: "async"
      });
      card.appendChild(img);
      card.appendChild(utils.el("span", { class: "character-card__name" }, c.name));
      card.addEventListener("click", function () {
        profile.characterId = c.id;
        profile.hasCustomImage = false;
        persistProfile();
        deleteImageBlob().then(function () {
          return refresh();
        }).then(function () {
          const status = utils.byId("profile-status");
          if (status) utils.setStatus(status, "Preset character selected.", "success");
        });
      });
      wrap.appendChild(card);
    });
  }

  function renderCustomImageControls() {
    const wrap = utils.byId("custom-image-controls");
    if (!wrap) return;
    wrap.innerHTML = "";

    const file = utils.el("input", {
      type: "file",
      id: "custom-image-input",
      accept: "image/png,image/jpeg,image/webp,image/gif",
      "aria-label": "Upload a custom profile image from your device"
    });
    file.addEventListener("change", function () {
      handleFile(file.files && file.files[0]);
      file.value = "";
    });
    wrap.appendChild(file);

    const buttons = utils.el("div", { class: "custom-image-buttons" });
    const choose = utils.el("button", {
      type: "button",
      class: "btn btn--secondary"
    }, "Choose image");
    choose.addEventListener("click", function () { file.click(); });
    buttons.appendChild(choose);

    if (profile.hasCustomImage) {
      const remove = utils.el("button", {
        type: "button",
        class: "btn btn--ghost"
      }, "Remove image");
      remove.addEventListener("click", function () {
        deleteImageBlob().then(function () {
          profile.hasCustomImage = false;
          persistProfile();
          return refresh();
        }).then(function () {
          const status = utils.byId("profile-status");
          if (status) utils.setStatus(status, "Custom image removed. Returning to preset.", "success");
        });
      });
      buttons.appendChild(remove);
    }
    wrap.appendChild(buttons);
  }

  /* ---------- File handling ---------- */
  function handleFile(file) {
    const status = utils.byId("profile-status");
    if (!file) {
      if (status) utils.setStatus(status, "No file selected.", "error");
      return;
    }
    if (ACCEPTED_TYPES.indexOf(file.type) === -1) {
      if (status) utils.setStatus(status,
        "Unsupported file type. Please choose a PNG, JPEG, WebP or GIF image.", "error");
      return;
    }
    if (file.size > MAX_BYTES) {
      if (status) utils.setStatus(status,
        "That image is too large. Maximum size is 4 MB.", "error");
      return;
    }
    // Save blob, then verify it can be decoded as an image
    saveImageBlob(file).then(function () {
      return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(); };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error("corrupt"));
        };
        img.src = url;
      });
    }).then(function () {
      profile.hasCustomImage = true;
      persistProfile();
      return refresh();
    }).then(function () {
      if (status) utils.setStatus(status, "Profile image updated. Stored only on this device.", "success");
    }).catch(function (err) {
      // Roll back — remove the saved blob since it is corrupt
      deleteImageBlob().then(function () {
        profile.hasCustomImage = false;
        persistProfile();
        return refresh();
      }).then(function () {
        if (status) {
          if (err && err.message === "corrupt") {
            utils.setStatus(status,
              "That image could not be read. Please choose a different file.", "error");
          } else {
            utils.setStatus(status,
              "We could not save that image. Please try again.", "error");
          }
        }
      });
    });
  }

  /* ---------- Name input ---------- */
  function wireNameInput() {
    const input = utils.byId("profile-name");
    if (!input) return;
    input.value = profile.name || "";
    input.addEventListener("input", function () {
      const v = input.value.slice(0, 40);
      profile.name = v;
      persistProfile();
      // Light update of the preview name only
      const nameEl = utils.qs(".profile-preview__name");
      if (nameEl) nameEl.textContent = v || "Guest player";
    });
  }

  /* ---------- Refresh full UI ---------- */
  function refresh() {
    let customBlobUrl = null;
    if (profile.hasCustomImage) {
      return loadImageBlob().then(function (blob) {
        if (blob) {
          customBlobUrl = URL.createObjectURL(blob);
        } else {
          // Stale flag — fall back to preset
          profile.hasCustomImage = false;
          persistProfile();
        }
        renderPreview(customBlobUrl);
        renderCharacterPicker();
        renderCustomImageControls();
      });
    } else {
      renderPreview(null);
      renderCharacterPicker();
      renderCustomImageControls();
      return Promise.resolve();
    }
  }

  /* ---------- Init ---------- */
  function init() {
    const root = utils.byId("profile-root");
    if (!root) return; // not on the profile page

    loadProfile();
    api.listCharacters().then(function (list) {
      characters = list || [];
      if (!profile.characterId && characters.length) {
        profile.characterId = characters[0].id;
      }
      wireNameInput();
      return refresh();
    }).catch(function () {
      const status = utils.byId("profile-status");
      if (status) utils.setStatus(status,
        "We could not load preset characters right now. Please refresh the page.", "error");
    });
  }

  WEBBOX.profile = { init: init };
})(window);
