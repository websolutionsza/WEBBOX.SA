/**
 * WEB BOX SA — homepage library logic
 * Renders the featured row, the search field and the category-filtered
 * game grid against the local sample dataset.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;
  const api = WEBBOX.api;

  let allGames = [];
  let allCategories = [];
  let activeCategory = "All";
  let activeQuery = "";

  function imageFor(game, w, h) {
    if (game.image) return game.image;
    return utils.placeholderSvg({
      accent: game.accent || "#E11D2A",
      glyph: (game.title || "W").slice(0, 1).toUpperCase(),
      title: "Placeholder artwork — " + game.title,
      width: w || 1200,
      height: h || 800
    });
  }

  /* ---------- Build a single game card ---------- */
  function buildGameCard(game) {
    const card = utils.el("article", { class: "game-card" });

    const artLink = utils.el("a", {
      class: "game-card__link",
      href: "/pages/game.html?slug=" + encodeURIComponent(game.slug),
      "aria-label": "View " + game.title
    });

    const art = utils.el("div", { class: "game-card__art" });
    const img = utils.el("img", {
      class: "game-card__img",
      src: imageFor(game),
      alt: game.title + " — cover artwork",
      width: 600,
      height: 400,
      loading: "lazy",
      decoding: "async"
    });
    const onImgError = function () {
      // Replace broken remote image with on-theme placeholder, then detach
      const fallback = imageFor(game);
      if (img.src !== fallback) {
        img.src = fallback;
      }
      img.removeEventListener("error", onImgError);
    };
    img.addEventListener("error", onImgError);
    art.appendChild(img);

    const cat = utils.el("span", {
      class: "game-card__category",
      "aria-label": "Category: " + game.category
    }, game.category);
    art.appendChild(cat);

    artLink.appendChild(art);
    card.appendChild(artLink);

    const body = utils.el("div", { class: "game-card__body" });
    const title = utils.el("h3", { class: "game-card__title" });
    title.appendChild(utils.el("a", {
      class: "game-card__title-link",
      href: "/pages/game.html?slug=" + encodeURIComponent(game.slug)
    }, game.title));
    body.appendChild(title);

    const desc = utils.el("p", { class: "game-card__desc" }, game.description);
    body.appendChild(desc);

    const meta = utils.el("div", { class: "game-card__meta" });
    meta.appendChild(utils.el("span", { class: "game-card__meta-label" }, "Open in library"));
    body.appendChild(meta);

    card.appendChild(body);
    return card;
  }

  /* ---------- Build a featured card (larger layout) ---------- */
  function buildFeaturedCard(game, isHero) {
    const card = utils.el("article", {
      class: "featured-card" + (isHero ? " featured-card--hero" : "")
    });
    const link = utils.el("a", {
      class: "featured-card__link",
      href: "/pages/game.html?slug=" + encodeURIComponent(game.slug),
      "aria-label": "View " + game.title
    });
    const art = utils.el("div", { class: "featured-card__art" });
    const img = utils.el("img", {
      class: "featured-card__img",
      src: imageFor(game, isHero ? 1600 : 1000, isHero ? 900 : 600),
      alt: game.title + " — featured artwork",
      width: isHero ? 1600 : 1000,
      height: isHero ? 900 : 600,
      loading: "eager",
      decoding: "async"
    });
    img.addEventListener("error", function () {
      img.src = imageFor(game, isHero ? 1600 : 1000, isHero ? 900 : 600);
    });
    art.appendChild(img);
    link.appendChild(art);

    const overlay = utils.el("div", { class: "featured-card__overlay" });
    const cat = utils.el("span", { class: "featured-card__category" }, game.category);
    overlay.appendChild(cat);
    const title = utils.el("h3", { class: "featured-card__title" }, game.title);
    overlay.appendChild(title);
    const desc = utils.el("p", { class: "featured-card__desc" }, game.description);
    overlay.appendChild(desc);
    const cta = utils.el("span", { class: "featured-card__cta" }, "View details");
    overlay.appendChild(cta);
    link.appendChild(overlay);

    card.appendChild(link);
    return card;
  }

  /* ---------- Render featured row ---------- */
  function renderFeatured() {
    const wrap = utils.byId("featured-games");
    if (!wrap) return;
    const featured = allGames.filter(function (g) { return g.featured; });
    utils.clear(wrap);
    if (featured.length === 0) {
      wrap.classList.add("is-hidden");
      return;
    }
    // Layout: 1 hero + 2 secondary (when available)
    const hero = featured[0];
    const secondary = featured.slice(1, 3);

    const heroCard = buildFeaturedCard(hero, true);
    wrap.appendChild(heroCard);

    if (secondary.length) {
      const side = utils.el("div", { class: "featured-side" });
      secondary.forEach(function (g) {
        side.appendChild(buildFeaturedCard(g, false));
      });
      wrap.appendChild(side);
    }
  }

  /* ---------- Render category chips ---------- */
  function renderCategories() {
    const wrap = utils.byId("category-filters");
    if (!wrap) return;
    utils.clear(wrap);
    allCategories.forEach(function (cat) {
      const btn = utils.el("button", {
        type: "button",
        class: "chip" + (cat === activeCategory ? " is-active" : ""),
        "aria-pressed": cat === activeCategory ? "true" : "false"
      }, cat);
      btn.addEventListener("click", function () {
        activeCategory = cat;
        utils.qsa(".chip", wrap).forEach(function (c) {
          const on = c.textContent.trim() === cat;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        renderGrid();
      });
      wrap.appendChild(btn);
    });
  }

  /* ---------- Filter & render the grid ---------- */
  function filteredGames() {
    const q = utils.normalizeQuery(activeQuery);
    return allGames.filter(function (g) {
      if (activeCategory !== "All" && g.category !== activeCategory) return false;
      if (!q) return true;
      const hay = (
        g.title + " " + g.category + " " + g.description + " " + g.longDescription
      ).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderGrid() {
    const wrap = utils.byId("game-grid");
    const statusEl = utils.byId("library-status");
    const countEl = utils.byId("result-count");
    if (!wrap) return;

    const list = filteredGames();
    utils.clear(wrap);

    if (list.length === 0) {
      wrap.classList.add("is-hidden");
      if (statusEl) {
        utils.setStatus(
          statusEl,
          "No games match \"" + (activeQuery || activeCategory) + "\". Try a different search term or category.",
          "info"
        );
      }
      if (countEl) countEl.textContent = "0 games";
      return;
    }

    wrap.classList.remove("is-hidden");
    if (statusEl) utils.clearStatus(statusEl);
    if (countEl) {
      countEl.textContent = list.length + (list.length === 1 ? " game" : " games");
    }

    list.forEach(function (g) {
      wrap.appendChild(buildGameCard(g));
    });
  }

  /* ---------- Wire up the search field ---------- */
  function wireSearch() {
    const input = utils.byId("library-search");
    if (!input) return;
    const clearBtn = utils.byId("library-search-clear");
    const debounce = (function () {
      let t;
      return function (fn, ms) {
        clearTimeout(t);
        t = setTimeout(fn, ms || 120);
      };
    })();
    input.addEventListener("input", function () {
      activeQuery = input.value;
      debounce(renderGrid, 120);
      if (clearBtn) clearBtn.classList.toggle("is-visible", !!input.value);
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        activeQuery = "";
        if (clearBtn) clearBtn.classList.remove("is-visible");
        renderGrid();
        input.focus();
      });
    }
    // Submitting the form just refocuses the grid
    const form = utils.byId("library-search-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const target = utils.byId("library");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  /* ---------- Wire up the hero CTA ---------- */
  function wireHeroCta() {
    const btn = utils.byId("hero-cta");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const target = utils.byId("library");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    const grid = utils.byId("game-grid");
    if (!grid) return; // not on the homepage
    Promise.all([
      api.listGames(),
      api.listCategories()
    ]).then(function (results) {
      allGames = results[0] || [];
      allCategories = results[1] || [];
      renderFeatured();
      renderCategories();
      renderGrid();
      wireSearch();
      wireHeroCta();
    }).catch(function (err) {
      const statusEl = utils.byId("library-status");
      if (statusEl) {
        utils.setStatus(
          statusEl,
          "We could not load the game library right now. Please refresh the page.",
          "error"
        );
      }
    });
  }

  WEBBOX.library = { init: init };
})(window);
