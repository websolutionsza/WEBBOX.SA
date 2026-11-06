/**
 * WEB BOX SA — Opening disclaimer modal
 * ----------------------------------------------
 * Shows a one-time availability notice to visitors on their first
 * visit (per localStorage acknowledgement). The notice:
 *
 *   - matches the existing dark + red visual identity
 *   - is responsive and accessible (role=dialog, aria-modal, focus
 *     trap, Escape to close, restore focus on close)
 *   - prevents background interaction while open
 *   - does not re-display after acknowledgement in the same browser
 *   - uses a VERSIONED storage key so the notice can be re-shown
 *     in future by bumping DISCLAIMER_VERSION
 *   - waits for the cinematic intro (if present on the page) to
 *     finish before appearing, so the two overlays never collide
 *
 * The notice text is intentionally not a legal claim — it simply
 * informs visitors that some entries may be unavailable.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});

  // Bump this version to re-show the notice to all visitors after
  // the wording changes. Existing visitors who acknowledged v1 will
  // see the notice again when this becomes v2, and so on.
  const DISCLAIMER_VERSION = "v1";
  const STORAGE_KEY = "webbox_disclaimer_ack_" + DISCLAIMER_VERSION;

  const TITLE_TEXT = "Important notice";
  const MESSAGE_TEXT =
    "Some entries in our game library may be unavailable because their " +
    "original links have been removed or taken down following copyright " +
    "complaints. Game availability depends on third-party sources, which " +
    "we do not control. We cannot guarantee that every entry will remain " +
    "accessible. WEB BOX SA is completely free to use. Thank you for visiting.";
  const BUTTON_TEXT = "Continue to WEB BOX";

  function isAcknowledged() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      // localStorage unavailable (e.g. private browsing) — don't block
      return true;
    }
  }

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "disclaimer-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "disclaimer-title");
    overlay.setAttribute("aria-describedby", "disclaimer-message");

    const dialog = document.createElement("div");
    dialog.className = "disclaimer-dialog";

    const title = document.createElement("h2");
    title.id = "disclaimer-title";
    title.className = "disclaimer-title";
    title.textContent = TITLE_TEXT;

    const message = document.createElement("p");
    message.id = "disclaimer-message";
    message.className = "disclaimer-message";
    message.textContent = MESSAGE_TEXT;

    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "btn btn--primary btn--lg disclaimer-continue";
    continueBtn.textContent = BUTTON_TEXT;

    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(continueBtn);
    overlay.appendChild(dialog);

    return { overlay: overlay, dialog: dialog, continueBtn: continueBtn };
  }

  function show() {
    if (isAcknowledged()) return;
    if (document.querySelector(".disclaimer-overlay")) return; // already shown

    const built = buildModal();
    const overlay = built.overlay;
    const dialog = built.dialog;
    const continueBtn = built.continueBtn;

    const previouslyFocused = document.activeElement;

    // Lock body scroll + prevent background interaction
    document.body.classList.add("disclaimer-active");

    function close() {
      overlay.classList.add("is-leaving");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.classList.remove("disclaimer-active");
        if (previouslyFocused && previouslyFocused.focus) {
          try { previouslyFocused.focus(); } catch (e) {}
        }
      }, 220);
      acknowledge();
      document.removeEventListener("keydown", onKeydown);
    }

    // Focus trap inside the dialog
    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialog.querySelectorAll(
        "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    continueBtn.addEventListener("click", close);
    document.addEventListener("keydown", onKeydown);

    document.body.appendChild(overlay);

    // Trigger the fade-in transition, then focus the continue button
    requestAnimationFrame(function () {
      overlay.classList.add("is-visible");
      setTimeout(function () { continueBtn.focus(); }, 60);
    });
  }

  // If the page has the cinematic intro overlay, wait for it to
  // dismiss before showing the disclaimer — otherwise the two
  // overlays would collide. Falls back to showing immediately on
  // pages without the intro.
  function waitForIntroThenShow() {
    const intro = document.getElementById("intro-overlay");
    if (!intro) {
      show();
      return;
    }
    const state = intro.getAttribute("data-state");
    if (state === "hidden" || state === "leaving") {
      // Intro already dismissed (or never shown this session) — show now
      // Small delay so the intro's leaving transition completes first
      setTimeout(show, 300);
      return;
    }
    // Intro is currently active — poll until it dismisses
    let elapsed = 0;
    const tick = 200;
    const maxWait = 12000;
    const check = setInterval(function () {
      elapsed += tick;
      const s = intro.getAttribute("data-state");
      if (s === "hidden" || s === "leaving" || elapsed >= maxWait) {
        clearInterval(check);
        setTimeout(show, 300);
      }
    }, tick);
  }

  function init() {
    if (isAcknowledged()) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", waitForIntroThenShow);
    } else {
      waitForIntroThenShow();
    }
  }

  WEBBOX.disclaimer = { init: init };
})(window);
