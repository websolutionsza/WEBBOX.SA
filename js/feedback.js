/**
 * WEB BOX SA — anonymous feedback form module
 * ----------------------------------------------
 * Renders the interactive behaviour for the feedback form on the
 * Support page. Handles:
 *   - pre-filling category + game_slug from URL params (deep-linking
 *     from the "Report this game" button on game detail pages)
 *   - character counter
 *   - client-side validation
 *   - honeypot (server also checks)
 *   - submission time tracking (server also checks)
 *   - loading state
 *   - accessible success + error messages
 *
 * The form posts to /api/feedback (a Cloudflare Pages Function) which
 * forwards to Supabase's submit_feedback() RPC. No name, email or
 * account is required.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;

  const MAX_MESSAGE = 2000;
  const FORM_OPEN_TS = Date.now();

  function init() {
    const form = utils.byId("feedback-form");
    if (!form) return; // not on the support page

    const statusEl = utils.byId("feedback-status");
    const submitBtn = utils.byId("feedback-submit");
    const messageEl = utils.byId("feedback-message");
    const charCountEl = utils.byId("feedback-char-count");
    const gameSlugEl = utils.byId("feedback-game-slug");

    // Pre-fill from URL params (deep-linking from game detail "Report this game")
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashParams = new URLSearchParams(window.location.search);
    const presetCategory = hashParams.get("category") || params.get("category");
    const presetSlug = hashParams.get("slug") || params.get("slug");

    if (presetCategory) {
      const radio = form.querySelector('input[name="category"][value="' + presetCategory + '"]');
      if (radio) {
        radio.checked = true;
        radio.focus({ preventScroll: true });
      }
    }
    if (presetSlug && gameSlugEl) {
      gameSlugEl.value = presetSlug;
    }

    // Character counter
    function updateCount() {
      if (!charCountEl || !messageEl) return;
      const len = messageEl.value.length;
      charCountEl.textContent = String(len);
      charCountEl.parentElement.classList.toggle("is-over", len > MAX_MESSAGE);
    }
    if (messageEl) {
      messageEl.addEventListener("input", updateCount);
      updateCount();
    }

    // Submit handler
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Gather values
      const categoryRadio = form.querySelector('input[name="category"]:checked');
      const category = categoryRadio ? categoryRadio.value : "";
      const message = messageEl ? messageEl.value.trim() : "";
      const gameSlug = gameSlugEl ? gameSlugEl.value.trim() : "";
      const honeypot = form.querySelector("#hp-website");
      const honeypotVal = honeypot ? honeypot.value : "";

      // Validate
      if (!category) {
        utils.setStatus(statusEl, "Please choose a category.", "error");
        const firstRadio = form.querySelector('input[name="category"]');
        if (firstRadio) firstRadio.focus();
        return;
      }
      if (!message) {
        utils.setStatus(statusEl, "Please enter your feedback message.", "error");
        if (messageEl) messageEl.focus();
        return;
      }
      if (message.length > MAX_MESSAGE) {
        utils.setStatus(statusEl, "Your message is too long. Maximum is " + MAX_MESSAGE + " characters.", "error");
        if (messageEl) messageEl.focus();
        return;
      }

      // Set loading state
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Submitting…";
      utils.setStatus(statusEl, "Submitting your feedback…", "info");

      try {
        const r = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Form-Open-Ts": String(FORM_OPEN_TS)
          },
          body: JSON.stringify({
            category: category,
            message: message,
            game_slug: gameSlug || null,
            website: honeypotVal // honeypot
          }),
          credentials: "same-origin"
        });

        let data = null;
        try { data = await r.json(); } catch (e) {}
        if (!r.ok || !data || data.ok !== true) {
          const msg = (data && data.error) || "Submission failed. Please try again.";
          utils.setStatus(statusEl, msg, "error");
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          submitBtn.textContent = originalText;
          return;
        }

        // Success
        utils.setStatus(
          statusEl,
          "Thank you! Your feedback has been submitted successfully.",
          "success"
        );
        form.reset();
        if (charCountEl) charCountEl.textContent = "0";
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = originalText;

        // Move focus to the status message for screen readers
        if (statusEl) {
          statusEl.setAttribute("tabindex", "-1");
          statusEl.focus({ preventScroll: true });
        }
      } catch (err) {
        utils.setStatus(
          statusEl,
          "We could not submit your feedback right now. Please try again in a moment.",
          "error"
        );
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = originalText;
      }
    });
  }

  WEBBOX.feedback = { init: init };
})(window);
