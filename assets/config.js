/**
 * WEB BOX SA — Central asset & configuration module
 * ===================================================
 *
 * This file is the SINGLE source of truth for:
 *   - Brand logo URL / local path
 *   - All favicon sizes (16 / 32 / 48 / .ico)
 *   - Startup intro video
 *   - Creator profile destinations
 *   - WebSolutionsSA social destinations
 *   - Production domain (used for canonical URLs / OG URLs)
 *
 * -----------------------------------------------------------------
 *  HOW TO REPLACE PLACEHOLDER ASSETS WITH LOCAL FILES
 * -----------------------------------------------------------------
 * 1. Download each asset listed below into the matching folder
 *    under `/assets/...`.
 * 2. Set `USE_LOCAL_ASSETS = true`.
 * 3. The site will then resolve every asset from your own domain
 *    instead of the development URLs currently in use.
 *
 * -----------------------------------------------------------------
 *  ASSET REPLACE-CHECKLIST (files intentionally NOT committed yet)
 * -----------------------------------------------------------------
 *  [ ] assets/brand/web-box-logo-500.png   (current dev URL: GitHub raw)
 *  [ ] assets/favicon/favicon-16.png        (current dev URL: GitHub raw)
 *  [ ] assets/favicon/favicon-32.png        (current dev URL: GitHub raw)
 *  [ ] assets/favicon/favicon-48.png        (current dev URL: GitHub raw)
 *  [ ] assets/favicon/favicon.ico           (current dev URL: GitHub raw)
 *  [ ] assets/video/web-box-intro.mp4       (current dev URL: Cloudinary)
 *
 * -----------------------------------------------------------------
 *  INTENTIONALLY UNCONFIGURED DESTINATIONS
 * -----------------------------------------------------------------
 *  - TLHOMPO_TIKTOK_URL = null   →  TikTok icon is HIDDEN until supplied
 *
 * -----------------------------------------------------------------
 *  PRODUCTION DOMAIN
 * -----------------------------------------------------------------
 *  Update PRODUCTION_DOMAIN to your real Cloudflare Pages domain
 *  (or custom domain) before going live. This value is used to
 *  generate canonical URLs and OpenGraph URLs.
 */

(function (global) {
  "use strict";

  /* ----------------------------------------------------------------
   *  PRODUCTION DOMAIN  — replace before launch
   * ---------------------------------------------------------------- */
  const PRODUCTION_DOMAIN = "https://webboxsa.pages.dev"; // TODO: set final domain

  /* ----------------------------------------------------------------
   *  ASSET MODE  — flip to true once assets are downloaded locally
   * ---------------------------------------------------------------- */
  const USE_LOCAL_ASSETS = false;

  /* ----------------------------------------------------------------
   *  RAW ASSET DEFINITIONS
   *  Each asset has a `remote` URL (current dev source) and a
   *  `local` path (production target).
   * ---------------------------------------------------------------- */
  const RAW = {
    logo: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/500%20LOGO.png",
      local: "/assets/brand/web-box-logo-500.png",
      width: 500,
      height: 500,
      alt: "WEB BOX logo"
    },
    faviconIco: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/favicon.ico",
      local: "/assets/favicon/favicon.ico"
    },
    favicon16: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/favicon-16x16.png",
      local: "/assets/favicon/favicon-16.png"
    },
    favicon32: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/favicon-32x32.png",
      local: "/assets/favicon/favicon-32.png"
    },
    favicon48: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/favicon-48x48.png",
      local: "/assets/favicon/favicon-48.png"
    },
    introVideo: {
      remote: "https://res.cloudinary.com/dr5bfsfez/video/upload/v1792767609/WEB_BOX_start_up_animation_gz7mm3.mp4",
      local: "/assets/video/web-box-intro.mp4"
    }
  };

  /* Resolve helper — picks remote vs local based on flag */
  function resolve(asset) {
    return USE_LOCAL_ASSETS ? asset.local : asset.remote;
  }

  /* ----------------------------------------------------------------
   *  FINAL PUBLIC CONFIG
   * ---------------------------------------------------------------- */
  const ASSETS = {
    useLocal: USE_LOCAL_ASSETS,
    domain: PRODUCTION_DOMAIN,

    logo: {
      src: resolve(RAW.logo),
      localSrc: RAW.logo.local,
      remoteSrc: RAW.logo.remote,
      width: RAW.logo.width,
      height: RAW.logo.height,
      alt: RAW.logo.alt
    },

    favicons: [
      { rel: "icon", type: "image/x-icon", sizes: "any",
        src: resolve(RAW.faviconIco), localSrc: RAW.faviconIco.local },
      { rel: "icon", type: "image/png", sizes: "16x16",
        src: resolve(RAW.favicon16), localSrc: RAW.favicon16.local },
      { rel: "icon", type: "image/png", sizes: "32x32",
        src: resolve(RAW.favicon32), localSrc: RAW.favicon32.local },
      { rel: "icon", type: "image/png", sizes: "48x48",
        src: resolve(RAW.favicon48), localSrc: RAW.favicon48.local }
    ],

    appleTouchIcon: {
      src: resolve(RAW.favicon48), localSrc: RAW.favicon48.local
    },

    introVideo: {
      src: resolve(RAW.introVideo),
      localSrc: RAW.introVideo.local,
      remoteSrc: RAW.introVideo.remote,
      // Safety: if the video stalls, the static brand screen is shown
      // and we proceed into the website after this many ms.
      fallbackDurationMs: 7000
    }
  };

  /* ----------------------------------------------------------------
   *  CREATOR & SOCIAL DESTINATIONS
   *  — values are exactly as supplied by the project owner
   * ---------------------------------------------------------------- */
  const SOCIAL = {
    // WebSolutionsSA official channels
    websolutionsa: {
      website: "https://websolutionssa.pages.dev",
      instagram: "https://www.instagram.com/websolutions.sa?cplk=dnVjbmg0ZHc1bjhm&utm_source=qr",
      facebook: "https://www.facebook.com/websolutionsSA",
      whatsapp: "https://wa.me/message/ZGMHNCO5TVDHM1",
      email: "mailto:websolutionssa0@gmail.com"
    },

    // Tlhompo Meje personal destinations
    tlhompo: {
      instagram: "https://www.instagram.com/t_qua1?psln=MXV5aW01Mmd6Z3Nleg==",
      tiktok: null // ← INTENTIONALLY UNCONFIGURED — icon hidden until supplied
    }
  };

  /* ----------------------------------------------------------------
   *  PROJECTS BUILT BY TLHOMPO MEJE / WEBSOLUTIONSSA
   *  Each entry must have a real destination; if unknown, set to null
   *  and the card will render without a link.
   * ---------------------------------------------------------------- */
  const PROJECTS = [
    {
      key: "web-box-sa",
      name: "WEB BOX SA",
      role: "Gaming library platform",
      description: "A curated gaming discovery platform and library — the project this website belongs to.",
      url: null // self-referential; set to the live domain once deployed
    },
    {
      key: "websolutions",
      name: "WebSolutionsSA",
      role: "Development brand",
      description: "The web development brand behind WEB BOX SA, WebDrop Pro and PWA Resizer.",
      url: "https://websolutionssa.pages.dev"
    },
    {
      key: "webdrop",
      name: "WebDrop Pro",
      role: "Web project",
      description: "A web project by Tlhompo Meje under WebSolutionsSA.",
      url: null // TODO: replace with the official WebDrop Pro URL when supplied
    },
    {
      key: "pwa-resizer",
      name: "PWA Resizer",
      role: "Free utility project",
      description: "A free utility project by Tlhompo Meje — image resize tooling.",
      url: null // TODO: replace with the official PWA Resizer URL when supplied
    }
  ];

  /* ----------------------------------------------------------------
   *  SITE NAVIGATION (single source for header & footer)
   * ---------------------------------------------------------------- */
  const NAV = [
    { label: "Library", href: "/index.html", icon: "library" },
    { label: "Profile", href: "/pages/profile.html", icon: "profile" },
    { label: "Support", href: "/pages/support.html", icon: "support" },
    { label: "About",   href: "/pages/about.html",   icon: "about"   },
    { label: "Creator", href: "/pages/creator.html", icon: "creator" }
  ];

  const FOOTER_LINKS = [
    { label: "Library", href: "/index.html" },
    { label: "Profile", href: "/pages/profile.html" },
    { label: "Support", href: "/pages/support.html" },
    { label: "About WEB BOX", href: "/pages/about.html" },
    { label: "Tlhompo Meje", href: "/pages/creator.html" },
    { label: "Privacy Policy", href: "/pages/privacy.html" },
    { label: "Terms", href: "/pages/terms.html" }
  ];

  /* Expose */
  global.WEBBOX = global.WEBBOX || {};
  global.WEBBOX.ASSETS = ASSETS;
  global.WEBBOX.SOCIAL = SOCIAL;
  global.WEBBOX.PROJECTS = PROJECTS;
  global.WEBBOX.NAV = NAV;
  global.WEBBOX.FOOTER_LINKS = FOOTER_LINKS;
})(window);
