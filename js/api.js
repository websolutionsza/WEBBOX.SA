/**
 * WEB BOX SA — API / data-access module
 * =====================================
 *
 *  PHASE 2 (this file):  All functions fetch from same-origin
 *  Cloudflare Pages Functions, which read from Supabase using
 *  server-side credentials configured on Cloudflare.
 *
 * -----------------------------------------------------------------
 *  SECURITY MODEL
 * -----------------------------------------------------------------
 * The browser NEVER holds Supabase credentials. The Cloudflare
 * Pages Functions read using the anon key (RLS-respecting, public
 * read-only) and return JSON. Writes would go through the
 * service_role key inside the same Functions boundary — but no
 * write endpoints exist in this phase.
 *
 * -----------------------------------------------------------------
 *  ENDPOINTS EXPECTED
 * -----------------------------------------------------------------
 *   GET /api/games              → array of published games
 *   GET /api/games/:slug        → single published game (or 404)
 *   GET /api/characters         → array of published characters
 *
 * -----------------------------------------------------------------
 *  FUNCTION SIGNATURES
 * -----------------------------------------------------------------
 * Identical to Phase 1, so the UI does not need to be modified
 * when swapping mock data → live Supabase data. Each function
 * returns a Promise that resolves to the same shape the UI
 * already consumes.
 *
 * -----------------------------------------------------------------
 *  ERROR HANDLING
 * -----------------------------------------------------------------
 * On network failure or non-2xx response, the fetch helpers throw
 * an Error with a `status` property. The UI's catch blocks already
 * display a friendly error message to the user.
 */

(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});

  // Category list is intentionally hardcoded. The catalogue is curated,
  // so the set of categories changes rarely. If a category appears in
  // the games table but is not in this list, the games still render —
  // they simply are not filterable through the chip row.
  const CATEGORIES = [
    "All",
    "Action",
    "Adventure",
    "Puzzle",
    "Racing",
    "Strategy",
    "Platformer"
  ];

  /**
   * Fetch JSON from a same-origin endpoint.
   * Throws an Error with .status on non-2xx responses.
   */
  async function fetchJson(url, options) {
    const r = await fetch(
      url,
      Object.assign({ credentials: "same-origin" }, options || {})
    );
    if (!r.ok) {
      const err = new Error("Request failed: " + r.status);
      err.status = r.status;
      throw err;
    }
    return r.json();
  }

  const api = {
    /** Returns all published games (live Supabase data in phase 2). */
    async listGames() {
      return fetchJson("/api/games");
    },

    /** Returns a single game by slug, or null if not found. */
    async getGame(slug) {
      try {
        return await fetchJson("/api/games/" + encodeURIComponent(slug));
      } catch (e) {
        if (e && e.status === 404) return null;
        throw e;
      }
    },

    /** Returns the list of supported categories. */
    async listCategories() {
      return CATEGORIES;
    },

    /** Returns all published preset characters. */
    async listCharacters() {
      return fetchJson("/api/characters");
    },

    /** Returns a single preset character by id, or null. */
    async getCharacter(id) {
      const list = await this.listCharacters();
      return list.find(function (c) { return c.id === id; }) || null;
    }
  };

  WEBBOX.api = api;
})(window);
