/**
 * WEB BOX SA — social & contact icons
 * Renders recognizable, original inline SVG icons for the official
 * WebSolutionsSA channels and Tlhompo Meje's personal destinations.
 *
 * Rules:
 *   - Never print raw URLs or usernames in the visible UI.
 *   - TikTok icon is HIDDEN until TLHOMPO_TIKTOK_URL is supplied.
 *   - Each icon has an accessible name, keyboard focus and a real
 *     destination with rel="noopener noreferrer" for external links.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;

  /* ---------- Original SVG icon paths ---------- */
  const ICONS = {
    website:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
    email:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7.5l8.5 6 8.5-6"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 7h2.5V4H14a3.5 3.5 0 0 0-3.5 3.5V10H8v3h2.5v7h3v-7H16l.5-3h-3V7.5a.5.5 0 0 1 .5-.5z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19l1-3a7 7 0 1 1 3 3z"/><path d="M9 9.5c0 2 2 4 4 4 .6 0 1.2-.5 1.4-1l.3-.7-1.6-.9-.6.6c-.5-.2-1-.6-1.4-1.1s-.7-.8-.9-1.3l.5-.5-.8-1.6-.7.3c-.5.2-.8.8-.8 1.4z"/></svg>',
    tiktok:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4v9.2a3.3 3.3 0 1 1-3-3.3"/><path d="M14 4c.6 2.4 2.4 4 4.5 4.2"/></svg>'
  };

  function buildLink(opts) {
    if (!opts || !opts.url) return null;
    const url = opts.mailto
      ? utils.safeMailto(opts.url)
      : utils.safeExternalUrl(opts.url);
    if (!url) return null;

    const a = utils.el("a", {
      class: "social-link",
      href: url,
      target: opts.mailto ? undefined : "_blank",
      rel: opts.mailto ? undefined : "noopener noreferrer",
      "aria-label": opts.label,
      title: opts.label
    });
    const ic = utils.el("span", {
      class: "social-link__icon",
      "aria-hidden": "true",
      html: ICONS[opts.icon] || ""
    });
    a.appendChild(ic);
    const lbl = utils.el("span", { class: "social-link__label" }, opts.label);
    a.appendChild(lbl);
    return a;
  }

  function renderWebSolutionsSA(targetId) {
    const target = utils.byId(targetId);
    if (!target) return;
    const s = (WEBBOX.SOCIAL && WEBBOX.SOCIAL.websolutionsa) || {};
    utils.clear(target);
    const links = [
      { icon: "website", label: "Website", url: s.website },
      { icon: "instagram", label: "Instagram", url: s.instagram },
      { icon: "facebook", label: "Facebook", url: s.facebook },
      { icon: "whatsapp", label: "WhatsApp", url: s.whatsapp },
      { icon: "email", label: "Email", url: s.email, mailto: true }
    ];
    links.forEach(function (l) {
      const node = buildLink(l);
      if (node) target.appendChild(node);
    });
  }

  function renderTlhompo(targetId) {
    const target = utils.byId(targetId);
    if (!target) return;
    const s = (WEBBOX.SOCIAL && WEBBOX.SOCIAL.tlhompo) || {};
    utils.clear(target);
    const links = [
      { icon: "instagram", label: "Instagram", url: s.instagram }
    ];
    // TikTok — only render when a real destination has been supplied
    if (s.tiktok) {
      links.push({ icon: "tiktok", label: "TikTok", url: s.tiktok });
    }
    links.forEach(function (l) {
      const node = buildLink(l);
      if (node) target.appendChild(node);
    });

    // If the TikTok destination is still unconfigured, surface a clear
    // inline note for maintainers (hidden in production UI).
    if (!s.tiktok) {
      const note = utils.el("p", { class: "social-placeholder-note" },
        "TikTok destination is intentionally unconfigured — icon is hidden until supplied.");
      target.appendChild(note);
    }
  }

  WEBBOX.social = {
    buildLink: buildLink,
    renderWebSolutionsSA: renderWebSolutionsSA,
    renderTlhompo: renderTlhompo
  };
})(window);
