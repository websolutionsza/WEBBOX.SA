/**
 * WEB BOX SA — Central asset & configuration module
 * ===================================================
 *
 * This file is the SINGLE source of truth for:
 *   - Brand logo URL / local path
 *   - All favicon sizes (16 / 32 / 48 / .ico)
 *   - Startup intro video
 *   - Production domain (used for canonical URLs / OG URLs)
 *   - Game availability status vocabulary
 *   - Site navigation
 *
 * WEB BOX SA is an independent, standalone project. No personal
 * branding, social links, or third-party project references are
 * stored here.
 *
 * -----------------------------------------------------------------
 *  HOW TO REPLACE PLACEHOLDER ASSETS WITH LOCAL FILES
 * -----------------------------------------------------------------
 * 1. Download each asset listed below into the matching folder
 *    under `/assets/...`.
 * 2. Set `USE_LOCAL_ASSETS = true`.
 * 3. The site will then resolve every asset from your own domain
 *    instead of the development URLs currently in use.
 */

(function (global) {
  "use strict";

  /* ----------------------------------------------------------------
   *  PRODUCTION DOMAIN
   * ---------------------------------------------------------------- */
  const PRODUCTION_DOMAIN = "https://webbox-sa.pages.dev";

  /* ----------------------------------------------------------------
   *  ASSET MODE  — flip to true once assets are downloaded locally
   * ---------------------------------------------------------------- */
  const USE_LOCAL_ASSETS = false;

  /* ----------------------------------------------------------------
   *  RAW ASSET DEFINITIONS
   * ---------------------------------------------------------------- */
  const RAW = {
    logo: {
      remote: "https://raw.githubusercontent.com/websolutionsza/WEBBOX.SA/refs/heads/main/500%20LOGO.png",
      local: "/assets/brand/web-box-logo-500.png",
      width: 500,
      height: 500,
      alt: "WEB BOX SA logo"
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
      fallbackDurationMs: 7000
    }
  };

  /* ----------------------------------------------------------------
   *  GAME AVAILABILITY STATUS VOCABULARY
   *  Used by the games table (availability_status column) and
   *  rendered as badges on the library cards / detail page.
   * ---------------------------------------------------------------- */
  const AVAILABILITY = {
    // Internal status values — must match the CHECK constraint
    // on the games.availability_status column in Supabase.
    statuses: ["available", "unavailable", "removed", "needs_verification"],

    // Display labels + badge tones for the UI
    labels: {
      available:            { text: "Available",      tone: "success" },
      unavailable:          { text: "Unavailable",    tone: "warning" },
      removed:              { text: "Removed",        tone: "danger"  },
      needs_verification:   { text: "Pending review", tone: "info"    }
    },

    // Statuses that should NOT appear in the public library at all
    // (filtered out by the API before returning).
    hiddenFromList: ["removed"],

    // Statuses that disable the launch button on the detail page
    // even if a destination URL is set.
    noLaunch: ["unavailable", "removed", "needs_verification"]
  };

  /* ----------------------------------------------------------------
   *  SITE NAVIGATION (single source for header & footer)
   *  The standalone WEB BOX SA has no creator page in the nav.
   * ---------------------------------------------------------------- */
  const NAV = [
    { label: "Library", href: "/index.html",         icon: "library" },
    { label: "Profile", href: "/pages/profile.html", icon: "profile" },
    { label: "Support", href: "/pages/support.html", icon: "support" },
    { label: "About",   href: "/pages/about.html",   icon: "about"   }
  ];

  const FOOTER_LINKS = [
    { label: "Library",        href: "/index.html" },
    { label: "Profile",        href: "/pages/profile.html" },
    { label: "Support",        href: "/pages/support.html" },
    { label: "About WEB BOX",  href: "/pages/about.html" },
    { label: "Privacy Policy", href: "/pages/privacy.html" },
    { label: "Terms",          href: "/pages/terms.html" }
  ];

  /* Expose */
  global.WEBBOX = global.WEBBOX || {};
  global.WEBBOX.ASSETS = ASSETS;
  global.WEBBOX.AVAILABILITY = AVAILABILITY;
  global.WEBBOX.NAV = NAV;
  global.WEBBOX.FOOTER_LINKS = FOOTER_LINKS;
})(window);
