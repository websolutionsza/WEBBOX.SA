/**
 * WEB BOX SA — cinematic startup intro
 * ----------------------------------------------
 * Plays the supplied intro video ONCE per browser session, with:
 *   - a visible skip control
 *   - reduced-motion respect (no autoplay, falls back to brand screen)
 *   - graceful fallback to the static brand screen if the video is
 *     missing or fails to load
 *   - a hard safety timer (introVideo.fallbackDurationMs) so the
 *     experience can never get stuck
 * After the video ends (or is skipped, or the safety timer elapses),
 * the overlay is dismissed and the underlying page is revealed.
 *
 * The user MUST be able to interact with the site if JS fails to
 * run, so the overlay element's default state in HTML is
 * `data-state="hidden"`. JS upgrades it to `data-state="loading"`
 * only when it is safe to show.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;

  const SESSION_KEY = "webbox_intro_seen";
  const MAX_DURATION_MS = 7000;

  function shouldShow() {
    if (utils.prefersReducedMotion()) return false;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
    } catch (e) {
      // sessionStorage unavailable; skip to be safe
      return false;
    }
    return true;
  }

  function markSeen() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
  }

  function hideOverlay(overlay, video) {
    if (!overlay) return;
    overlay.setAttribute("data-state", "leaving");
    if (video) {
      try { video.pause(); } catch (e) {}
    }
    // Allow CSS transition to run, then remove from tab order
    setTimeout(function () {
      overlay.setAttribute("data-state", "hidden");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.pointerEvents = "none";
      // Return focus to body
      document.body.classList.remove("intro-active");
      const main = document.getElementById("main");
      if (main) {
        const firstHeading = main.querySelector("h1, h2");
        if (firstHeading) {
          firstHeading.setAttribute("tabindex", "-1");
          firstHeading.focus({ preventScroll: true });
        }
      }
    }, 280);
  }

  function showStaticBrand(overlay) {
    const staticScreen = overlay.querySelector("[data-brand-screen]");
    if (staticScreen) {
      staticScreen.setAttribute("data-state", "visible");
    }
  }

  function hideStaticBrand(overlay) {
    const staticScreen = overlay.querySelector("[data-brand-screen]");
    if (staticScreen) {
      staticScreen.setAttribute("data-state", "hidden");
    }
  }

  function init() {
    const overlay = utils.byId("intro-overlay");
    if (!overlay) return;

    // If the user has already seen the intro this session, never show again
    if (!shouldShow()) {
      overlay.setAttribute("data-state", "hidden");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.pointerEvents = "none";
      return;
    }

    // Lock scroll + mark active
    document.body.classList.add("intro-active");
    overlay.setAttribute("data-state", "loading");
    overlay.setAttribute("aria-hidden", "false");

    const video = overlay.querySelector("video");
    const skipBtn = overlay.querySelector("[data-intro-skip]");
    let finished = false;

    function finish(reason) {
      if (finished) return;
      finished = true;
      markSeen();
      hideOverlay(overlay, video);
    }

    // Safety timer — never let the user get stuck
    const safety = setTimeout(function () {
      finish("safety");
    }, Math.min(MAX_DURATION_MS, (WEBBOX.ASSETS.introVideo && WEBBOX.ASSETS.introVideo.fallbackDurationMs) || MAX_DURATION_MS));

    if (skipBtn) {
      skipBtn.addEventListener("click", function () {
        clearTimeout(safety);
        finish("skip");
      });
    }

    // Keyboard: Esc or Enter/Space on skip
    document.addEventListener("keydown", function (e) {
      if (finished) return;
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if (e.key !== "Enter" && e.key !== " " && document.activeElement && document.activeElement !== skipBtn && skipBtn && !skipBtn.contains(document.activeElement)) {
          // Only Esc applies globally; Enter/Space needs to be on the skip button
          if (e.key !== "Escape") return;
        }
        e.preventDefault();
        clearTimeout(safety);
        finish("key");
      }
    });

    if (!video) {
      // No video tag — fall back to static brand and proceed
      showStaticBrand(overlay);
      setTimeout(function () {
        clearTimeout(safety);
        finish("no-video");
      }, 1400);
      return;
    }

    // Try to load the supplied video
    const src = (WEBBOX.ASSETS.introVideo && WEBBOX.ASSETS.introVideo.src) || "";
    if (!src) {
      // No source — show static brand and proceed
      showStaticBrand(overlay);
      setTimeout(function () {
        clearTimeout(safety);
        finish("no-src");
      }, 1400);
      return;
    }

    video.src = src;

    let videoReady = false;

    video.addEventListener("loadeddata", function () {
      videoReady = true;
      hideStaticBrand(overlay);
      // Attempt to play (browsers require muted autoplay)
      video.muted = true;
      video.play().catch(function () {
        // Autoplay blocked — show static brand briefly and finish
        showStaticBrand(overlay);
        setTimeout(function () {
          clearTimeout(safety);
          finish("autoplay-blocked");
        }, 1400);
      });
    });

    video.addEventListener("ended", function () {
      clearTimeout(safety);
      finish("ended");
    });

    video.addEventListener("error", function () {
      // Video failed — show static brand and proceed
      showStaticBrand(overlay);
      setTimeout(function () {
        clearTimeout(safety);
        finish("video-error");
      }, 1400);
    });

    // If after 1.6s the video hasn't signalled loadeddata, show static brand
    setTimeout(function () {
      if (!videoReady) {
        showStaticBrand(overlay);
      }
    }, 1600);
  }

  WEBBOX.intro = { init: init };
})(window);
