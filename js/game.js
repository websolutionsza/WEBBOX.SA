/**
 * WEB BOX SA — game detail page logic
 * Loads a game by slug (URL param) and renders artwork, metadata
 * and a launch button that is disabled when no valid destination is
 * configured.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;
  const api = WEBBOX.api;

  function imageFor(game, w, h) {
    if (game.image) return game.image;
    return utils.placeholderSvg({
      accent: game.accent || "#E11D2A",
      glyph: (game.title || "W").slice(0, 1).toUpperCase(),
      title: "Placeholder artwork — " + game.title,
      width: w || 1600,
      height: h || 900
    });
  }

  function renderSkeleton(root) {
    root.innerHTML =
      '<div class="game-detail-skeleton" aria-hidden="true">' +
        '<div class="skeleton skeleton--art"></div>' +
        '<div class="skeleton skeleton--line"></div>' +
        '<div class="skeleton skeleton--line skeleton--short"></div>' +
        '<div class="skeleton skeleton--block"></div>' +
      "</div>";
  }

  function renderNotFound(root, slug) {
    root.innerHTML = "";
    const card = utils.el("div", { class: "state state--not-found" });
    card.appendChild(utils.el("h2", { class: "state__title" }, "Game not available"));
    card.appendChild(utils.el("p", { class: "state__text" },
      "The game you are looking for is not in the WEB BOX library right now."));
    if (slug) {
      card.appendChild(utils.el("p", { class: "state__meta" },
        "Reference: " + slug));
    }
    const back = utils.el("a", {
      class: "btn btn--primary",
      href: "/index.html#library"
    }, "Return to library");
    card.appendChild(back);
    root.appendChild(card);
  }

  function renderError(root) {
    root.innerHTML = "";
    const card = utils.el("div", { class: "state state--error" });
    card.appendChild(utils.el("h2", { class: "state__title" }, "Something went wrong"));
    card.appendChild(utils.el("p", { class: "state__text" },
      "We could not load this game right now. Please try again in a moment."));
    const back = utils.el("a", {
      class: "btn btn--primary",
      href: "/index.html#library"
    }, "Return to library");
    card.appendChild(back);
    root.appendChild(card);
  }

  function render(root, game) {
    root.innerHTML = "";

    const breadcrumb = utils.el("nav", {
      class: "breadcrumbs",
      "aria-label": "Breadcrumb"
    });
    const bList = utils.el("ol");
    bList.appendChild(utils.el("li", {}, [
      utils.el("a", { class: "crumb", href: "/index.html" }, "Library")
    ]));
    bList.appendChild(utils.el("li", { "aria-current": "page" }, game.title));
    breadcrumb.appendChild(bList);
    root.appendChild(breadcrumb);

    const layout = utils.el("div", { class: "game-detail" });

    // Artwork
    const art = utils.el("div", { class: "game-detail__art" });
    const img = utils.el("img", {
      class: "game-detail__img",
      src: imageFor(game),
      alt: game.title + " — main artwork",
      width: 1600,
      height: 900,
      loading: "eager",
      decoding: "async"
    });
    img.addEventListener("error", function () {
      img.src = imageFor(game);
    });
    art.appendChild(img);

    // Gallery (if provided)
    if (Array.isArray(game.gallery) && game.gallery.length > 0) {
      const gallery = utils.el("div", { class: "game-detail__gallery" });
      game.gallery.forEach(function (url, i) {
        const safe = utils.safeExternalUrl(url);
        if (!safe) return;
        const gImg = utils.el("img", {
          class: "game-detail__gallery-img",
          src: safe,
          alt: game.title + " — additional image " + (i + 1),
          width: 400,
          height: 300,
          loading: "lazy",
          decoding: "async"
        });
        gImg.addEventListener("error", function () {
          gImg.parentElement && gImg.parentElement.removeChild(gImg);
        });
        gallery.appendChild(gImg);
      });
      if (gallery.children.length > 0) {
        art.appendChild(gallery);
      }
    }

    layout.appendChild(art);

    // Body
    const body = utils.el("div", { class: "game-detail__body" });
    const cat = utils.el("span", { class: "game-detail__category" }, game.category);
    body.appendChild(cat);
    body.appendChild(utils.el("h1", { class: "game-detail__title" }, game.title));
    body.appendChild(utils.el("p", { class: "game-detail__desc" }, game.longDescription || game.description));

    // Metadata
    const meta = utils.el("dl", { class: "game-detail__meta" });
    meta.appendChild(utils.el("dt", {}, "Category"));
    meta.appendChild(utils.el("dd", {}, game.category));
    meta.appendChild(utils.el("dt", {}, "Library reference"));
    meta.appendChild(utils.el("dd", {}, game.slug));
    body.appendChild(meta);

    // Launch / visit
    const safe = utils.safeExternalUrl(game.destination);
    const statusEl = utils.el("p", { class: "is-hidden", id: "launch-status", role: "status" });

    if (safe) {
      const launch = utils.el("a", {
        class: "btn btn--primary btn--lg",
        href: safe,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": "Open " + game.title + " in a new tab"
      }, "Visit game");
      launch.addEventListener("click", function () {
        utils.setStatus(statusEl, "Opening " + game.title + " in a new tab.", "info");
      });
      body.appendChild(launch);
      body.appendChild(statusEl);
      body.appendChild(utils.el("p", { class: "game-detail__note" },
        "You are about to leave WEB BOX SA. The destination is operated by a third party."));
    } else {
      const launch = utils.el("button", {
        type: "button",
        class: "btn btn--primary btn--lg is-disabled",
        disabled: true,
        "aria-disabled": "true"
      }, "Destination not configured");
      body.appendChild(launch);
      body.appendChild(statusEl);
      body.appendChild(utils.el("p", { class: "game-detail__note" },
        "This sample library entry does not have a launch destination yet. " +
        "Launch destinations are validated before navigation is allowed."));
    }

    const back = utils.el("a", {
      class: "btn btn--ghost",
      href: "/index.html#library"
    }, "Back to library");
    body.appendChild(back);

    layout.appendChild(body);
    root.appendChild(layout);

    // Update document title & description
    document.title = game.title + " — WEB BOX";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content",
        (game.description || "WEB BOX library entry") + " — a game in the WEB BOX gaming library.");
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href",
        (WEBBOX.ASSETS.domain || "") + "/pages/game.html?slug=" + encodeURIComponent(game.slug));
    }
  }

  function init() {
    const root = utils.byId("game-root");
    if (!root) return; // not on game detail page

    const slug = utils.getQueryParam("slug");
    if (!slug) {
      renderNotFound(root, null);
      return;
    }

    renderSkeleton(root);
    api.getGame(slug).then(function (game) {
      if (!game) {
        renderNotFound(root, slug);
        return;
      }
      render(root, game);
    }).catch(function () {
      renderError(root);
    });
  }

  WEBBOX.gamePage = { init: init };
})(window);
