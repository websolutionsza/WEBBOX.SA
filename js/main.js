/**
 * WEB BOX SA — shared page bootstrap
 * Builds header / footer / mobile menu on every page, injects favicon
 * links from the central config, and starts the intro animation if
 * appropriate.
 *
 * Required script load order on every HTML page:
 *   <script src="/assets/config.js" defer></script>
 *   <script src="/data/mock-games.js" defer></script>
 *   <script src="/data/mock-characters.js" defer></script>
 *   <script src="/js/utils.js" defer></script>
 *   <script src="/js/api.js" defer></script>
 *   <script src="/js/nav.js" defer></script>
 *   <script src="/js/intro.js" defer></script>
 *   <script src="/js/main.js" defer></script>
 *   … + page-specific scripts as needed
 */
(function () {
  "use strict";

  function injectFavicons() {
    const head = document.head;
    if (!head || !window.WEBBOX || !window.WEBBOX.ASSETS) return;

    // Strip any placeholder favicon <link> nodes (we replace at runtime)
    const existing = document.querySelectorAll(
      'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], meta[name="theme-color"]'
    );
    existing.forEach(function (n) { n.parentNode && n.parentNode.removeChild(n); });

    // Favicons
    (window.WEBBOX.ASSETS.favicons || []).forEach(function (f) {
      const link = document.createElement("link");
      link.rel = f.rel;
      if (f.type) link.type = f.type;
      if (f.sizes) link.sizes = f.sizes;
      link.href = f.src;
      head.appendChild(link);
    });

    // Apple touch icon
    const appleIcon = window.WEBBOX.ASSETS.appleTouchIcon;
    if (appleIcon) {
      const link = document.createElement("link");
      link.rel = "apple-touch-icon";
      link.href = appleIcon.src;
      head.appendChild(link);
    }

    // Theme color
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#0A0B0D";
    head.appendChild(meta);
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function init() {
    injectFavicons();
    if (window.WEBBOX && window.WEBBOX.nav) {
      window.WEBBOX.nav.buildHeader();
      window.WEBBOX.nav.buildFooter();
      window.WEBBOX.nav.buildMobileMenu();
    }
    setCurrentYear();

    // Pause background video when page is hidden (defensive — we don't use
    // background video, but if a future background video is added this
    // already enforces the rule)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        document.querySelectorAll("video[data-bg-video]").forEach(function (v) {
          v.pause();
        });
      }
    });

    if (window.WEBBOX && window.WEBBOX.intro) {
      window.WEBBOX.intro.init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
