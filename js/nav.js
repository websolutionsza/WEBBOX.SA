/**
 * WEB BOX SA — header, footer & mobile navigation
 * Builds the site chrome on every page.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;

  /* ---------- SVG icon library (custom, no Lucide) ---------- */
  const ICONS = {
    library:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="10.5" y="6" width="6" height="14" rx="1" transform="rotate(-6 13.5 13)"/><path d="M19 4.5l1.7 14.2"/></svg>',
    profile:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>',
    support:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><path d="M5.5 8.5l-1 1.5"/><path d="M5.5 15.5l-1-1.5"/><path d="M18.5 8.5l1 1.5"/><path d="M18.5 15.5l1-1.5"/><circle cx="12" cy="12" r="4.5"/></svg>',
    about:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none"/></svg>',
    creator:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16"/><path d="M6.5 6.5l1.2-2.5h8.6l1.2 2.5"/><rect x="4" y="6.5" width="16" height="13" rx="2"/><circle cx="12" cy="13" r="3.2"/></svg>',
    menu:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></svg>',
    arrowLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>'
  };

  function icon(name) {
    return ICONS[name] || "";
  }

  /* ---------- Build the desktop header ---------- */
  function buildHeader() {
    const header = utils.byId("site-header");
    if (!header) return;

    const nav = WEBBOX.NAV || [];
    const currentPage = normalizePath(window.location.pathname);

    const brand = utils.el("a", {
      class: "brand",
      href: "/index.html",
      "aria-label": "WEB BOX home"
    });
    const logoWrap = utils.el("span", { class: "brand-logo" });
    const logo = utils.el("img", {
      class: "brand-logo__img",
      src: WEBBOX.ASSETS.logo.src,
      alt: WEBBOX.ASSETS.logo.alt,
      width: WEBBOX.ASSETS.logo.width,
      height: WEBBOX.ASSETS.logo.height,
      loading: "eager",
      decoding: "async"
    });
    logoWrap.appendChild(logo);
    const brandText = utils.el("span", { class: "brand-text" }, [
      utils.el("span", { class: "brand-name" }, "WEB BOX"),
      utils.el("span", { class: "brand-sub" }, "by WebSolutionsSA")
    ]);
    brand.appendChild(logoWrap);
    brand.appendChild(brandText);

    const desktopNav = utils.el("nav", {
      class: "nav-desktop",
      "aria-label": "Primary"
    });
    const list = utils.el("ul", { class: "nav-desktop__list" });
    nav.forEach(function (item) {
      const li = utils.el("li", { class: "nav-desktop__item" });
      const a = utils.el("a", {
        class: "nav-link",
        href: item.href,
        "data-icon": item.icon
      });
      const ic = utils.el("span", {
        class: "nav-link__icon",
        "aria-hidden": "true",
        html: icon(item.icon)
      });
      a.appendChild(ic);
      a.appendChild(document.createTextNode(item.label));
      if (isCurrent(currentPage, item.href)) {
        a.setAttribute("aria-current", "page");
        a.classList.add("is-current");
      }
      li.appendChild(a);
      list.appendChild(li);
    });
    desktopNav.appendChild(list);

    const menuBtn = utils.el("button", {
      class: "menu-toggle",
      type: "button",
      "aria-label": "Open menu",
      "aria-controls": "mobile-menu",
      "aria-expanded": "false"
    });
    menuBtn.innerHTML = icon("menu");
    menuBtn.addEventListener("click", toggleMenu);

    header.appendChild(brand);
    header.appendChild(desktopNav);
    header.appendChild(menuBtn);
  }

  /* ---------- Build the mobile menu (separate overlay) ---------- */
  function buildMobileMenu() {
    const menu = utils.byId("mobile-menu");
    if (!menu) return;

    const nav = WEBBOX.NAV || [];
    const currentPage = normalizePath(window.location.pathname);

    const bar = utils.el("div", { class: "mobile-menu__bar" });
    const title = utils.el("span", { class: "mobile-menu__title" }, "Menu");
    const closeBtn = utils.el("button", {
      class: "menu-toggle is-close",
      type: "button",
      "aria-label": "Close menu",
      "aria-controls": "mobile-menu",
      "aria-expanded": "true"
    });
    closeBtn.innerHTML = icon("close");
    closeBtn.addEventListener("click", closeMenu);
    bar.appendChild(title);
    bar.appendChild(closeBtn);
    menu.appendChild(bar);

    const list = utils.el("ul", { class: "mobile-menu__list" });
    nav.forEach(function (item) {
      const li = utils.el("li");
      const a = utils.el("a", {
        class: "mobile-menu__link",
        href: item.href
      });
      const ic = utils.el("span", {
        class: "mobile-menu__icon",
        "aria-hidden": "true",
        html: icon(item.icon)
      });
      a.appendChild(ic);
      a.appendChild(document.createTextNode(item.label));
      if (isCurrent(currentPage, item.href)) {
        a.setAttribute("aria-current", "page");
        a.classList.add("is-current");
      }
      a.addEventListener("click", closeMenu);
      li.appendChild(a);
      list.appendChild(li);
    });
    menu.appendChild(list);

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        const toggle = utils.qs(".menu-toggle");
        if (toggle) toggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("is-open")) return;
      const target = e.target;
      if (menu.contains(target)) return;
      const toggle = utils.qs(".menu-toggle:not(.is-close)");
      if (toggle && toggle.contains(target)) return;
      closeMenu();
    });

    // Close on resize past mobile breakpoint
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && menu.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  function openMenu() {
    const menu = utils.byId("mobile-menu");
    if (!menu) return;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    const toggle = utils.qs(".menu-toggle:not(.is-close)");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }
    // Focus first link
    const first = utils.qs(".mobile-menu__link", menu);
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function closeMenu() {
    const menu = utils.byId("mobile-menu");
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    const toggle = utils.qs(".menu-toggle:not(.is-close)");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
  }

  function toggleMenu() {
    const menu = utils.byId("mobile-menu");
    if (!menu) return;
    if (menu.classList.contains("is-open")) closeMenu();
    else openMenu();
  }

  /* ---------- Build the footer ---------- */
  function buildFooter() {
    const footer = utils.byId("site-footer");
    if (!footer) return;

    const inner = utils.el("div", { class: "footer-inner" });

    const colBrand = utils.el("div", { class: "footer-col footer-col--brand" });
    const brand = utils.el("div", { class: "footer-brand" });
    const brandLogo = utils.el("img", {
      class: "footer-logo",
      src: WEBBOX.ASSETS.logo.src,
      alt: "",
      width: 96,
      height: 96,
      loading: "lazy",
      decoding: "async"
    });
    const brandText = utils.el("div", { class: "footer-brand-text" }, [
      utils.el("span", { class: "footer-brand-name" }, "WEB BOX"),
      utils.el("span", { class: "footer-brand-sub" }, "A gaming platform by WebSolutionsSA")
    ]);
    brand.appendChild(brandLogo);
    brand.appendChild(brandText);
    colBrand.appendChild(brand);

    const credit = utils.el("p", { class: "footer-credit" }, [
      document.createTextNode("Created by "),
      utils.el("a", { class: "footer-link", href: "/pages/creator.html" }, "Tlhompo Meje"),
      document.createTextNode(" · "),
      utils.el("a", {
        class: "footer-link",
        href: (WEBBOX.SOCIAL && WEBBOX.SOCIAL.websolutionsa.website) || "#",
        target: "_blank",
        rel: "noopener noreferrer"
      }, "WebSolutionsSA")
    ]);
    colBrand.appendChild(credit);
    inner.appendChild(colBrand);

    const colNav = utils.el("div", { class: "footer-col footer-col--nav" });
    colNav.appendChild(utils.el("h2", { class: "footer-heading" }, "Navigate"));
    const navList = utils.el("ul", { class: "footer-nav" });
    (WEBBOX.FOOTER_LINKS || []).forEach(function (item) {
      const li = utils.el("li");
      li.appendChild(utils.el("a", { class: "footer-link", href: item.href }, item.label));
      navList.appendChild(li);
    });
    colNav.appendChild(navList);
    inner.appendChild(colNav);

    const colLegal = utils.el("div", { class: "footer-col footer-col--legal" });
    colLegal.appendChild(utils.el("h2", { class: "footer-heading" }, "Legal"));
    const legalList = utils.el("ul", { class: "footer-nav" });
    [
      { label: "Privacy Policy", href: "/pages/privacy.html" },
      { label: "Terms of Use", href: "/pages/terms.html" }
    ].forEach(function (item) {
      const li = utils.el("li");
      li.appendChild(utils.el("a", { class: "footer-link", href: item.href }, item.label));
      legalList.appendChild(li);
    });
    colLegal.appendChild(legalList);

    const year = new Date().getFullYear();
    colLegal.appendChild(
      utils.el("p", { class: "footer-copy" }, "© " + year + " WEB BOX SA — WebSolutionsSA. All rights reserved.")
    );

    inner.appendChild(colLegal);
    footer.appendChild(inner);
  }

  /* ---------- Path helpers ---------- */
  function normalizePath(p) {
    if (!p) return "/";
    if (p === "/" || p === "/index.html") return "/";
    // strip trailing slash
    return p.replace(/\/$/, "");
  }

  function isCurrent(current, href) {
    if (!href) return false;
    if (href === "/index.html") return current === "/";
    return current === href;
  }

  /* ---------- Public API ---------- */
  WEBBOX.nav = {
    buildHeader: buildHeader,
    buildFooter: buildFooter,
    buildMobileMenu: buildMobileMenu,
    openMenu: openMenu,
    closeMenu: closeMenu,
    icon: icon
  };
})(window);
