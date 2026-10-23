/**
 * WEB BOX SA — utilities module
 * Pure helper functions. No side effects at import time.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});

  const utils = {
    /* ---------- DOM helpers ---------- */
    byId(id) {
      return document.getElementById(id);
    },

    qs(sel, root) {
      return (root || document).querySelector(sel);
    },

    qsa(sel, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    },

    el(tag, attrs, children) {
      const node = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          if (k === "class") node.className = attrs[k];
          else if (k === "text") node.textContent = attrs[k];
          else if (k === "html") node.innerHTML = attrs[k]; // only for trusted static content
          else if (k.indexOf("data-") === 0 || k === "aria-" || k === "role" || k === "tabindex" || k === "href" || k === "src" || k === "alt" || k === "width" || k === "height" || k === "type" || k === "target" || k === "rel" || k === "loading" || k === "decoding" || k === "name" || k === "value" || k === "for" || k === "autocomplete" || k === "inputmode" || k === "placeholder" || k === "title" || k === "lang")
            node.setAttribute(k, attrs[k]);
          else node.setAttribute(k, attrs[k]);
        });
      }
      if (children) {
        if (!Array.isArray(children)) children = [children];
        children.forEach(function (c) {
          if (c == null) return;
          if (typeof c === "string" || typeof c === "number") {
            node.appendChild(document.createTextNode(String(c)));
          } else {
            node.appendChild(c);
          }
        });
      }
      return node;
    },

    clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
      return node;
    },

    /* ---------- String helpers ---------- */

    // Escape any text so untrusted data can be inserted safely via innerHTML
    // (used sparingly — most rendering uses textContent).
    escapeHtml(str) {
      return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    normalizeQuery(str) {
      return String(str == null ? "" : str)
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    },

    slugify(str) {
      return String(str == null ? "" : str)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    },

    /* ---------- URL validation ---------- */

    // Strict external-URL validator. Only allows http/https and mailto.
    // Returns a safe URL or null.
    safeExternalUrl(input) {
      if (!input || typeof input !== "string") return null;
      const s = input.trim();
      if (!s) return null;
      // Disallow any whitespace inside (defence against javascript: with newlines)
      if (/\s/.test(s)) return null;
      try {
        const u = new URL(s, window.location.origin);
        if (u.protocol === "http:" || u.protocol === "https:") return u.href;
        if (u.protocol === "mailto:") return u.href;
        return null;
      } catch (e) {
        return null;
      }
    },

    safeMailto(input) {
      if (!input || typeof input !== "string") return null;
      const s = input.trim();
      if (!s) return null;
      try {
        const u = new URL(s);
        return u.protocol === "mailto:" ? u.href : null;
      } catch (e) {
        return null;
      }
    },

    getQueryParam(name) {
      const params = new URLSearchParams(window.location.search);
      return params.get(name);
    },

    /* ---------- Status messages (accessible) ---------- */

    setStatus(target, message, kind) {
      if (!target) return;
      target.textContent = message || "";
      target.setAttribute("role", kind === "error" ? "alert" : "status");
      target.setAttribute("aria-live", "assertive");
      target.setAttribute("data-kind", kind || "info");
      target.classList.remove("is-hidden");
    },

    clearStatus(target) {
      if (!target) return;
      target.textContent = "";
      target.classList.add("is-hidden");
    },

    /* ---------- Reduced motion ---------- */

    prefersReducedMotion() {
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    },

    /* ---------- Local storage helpers ---------- */

    lsGet(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },

    lsSet(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    lsRemove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },

    /* ---------- SVG placeholder generator ----------
     * Used only when a game/character image URL is empty. The result is
     * a deterministic, on-theme placeholder SVG with the project's red
     * accent and the supplied glyph.
     */
    placeholderSvg(opts) {
      const o = opts || {};
      const accent = o.accent || "#E11D2A";
      const glyph = (o.glyph || "W").toString().slice(0, 2);
      const title = o.title || "Placeholder artwork";
      const w = o.width || 1200;
      const h = o.height || 800;
      const gradId = "g" + Math.abs(hashCode(accent + glyph)) % 100000;
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
        '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' +
        escapeAttr(title) + '">' +
        "<title>" + escapeAttr(title) + "</title>" +
        '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#13151A"/>' +
        '<stop offset="0.5" stop-color="#0E1014"/>' +
        '<stop offset="1" stop-color="#08090B"/>' +
        "</linearGradient>" +
        '<radialGradient id="r' + gradId + '" cx="0.5" cy="0.45" r="0.6">' +
        '<stop offset="0" stop-color="' + accent + '" stop-opacity="0.55"/>' +
        '<stop offset="0.55" stop-color="' + accent + '" stop-opacity="0.12"/>' +
        '<stop offset="1" stop-color="' + accent + '" stop-opacity="0"/>' +
        "</radialGradient></defs>" +
        '<rect width="100%" height="100%" fill="url(#' + gradId + ')"/>' +
        '<rect width="100%" height="100%" fill="url(#r' + gradId + ')"/>' +
        '<g stroke="' + accent + '" stroke-opacity="0.18" stroke-width="1">' +
        '<line x1="0" y1="' + (h * 0.78) + '" x2="' + w + '" y2="' + (h * 0.78) + '"/>' +
        '<line x1="0" y1="' + (h * 0.82) + '" x2="' + w + '" y2="' + (h * 0.82) + '"/>' +
        "</g>" +
        '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" ' +
        'font-family="Sora, Manrope, system-ui, sans-serif" font-size="' +
        Math.round(Math.min(w, h) * 0.34) + '" font-weight="700" ' +
        'fill="' + accent + '" fill-opacity="0.92" letter-spacing="-0.02em">' +
        escapeText(glyph) + "</text>" +
        '<text x="50%" y="' + Math.round(h * 0.85) + '" text-anchor="middle" ' +
        'font-family="Manrope, system-ui, sans-serif" font-size="' +
        Math.round(h * 0.04) + '" fill="#9AA0A6" fill-opacity="0.85" ' +
        'letter-spacing="0.18em">WEB BOX</text>' +
        "</svg>";
      return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    }
  };

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i) | 0;
    }
    return h;
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  utils.hashCode = hashCode;

  WEBBOX.utils = utils;
})(window);
