/**
 * WEB BOX SA — API / data-access module
 * =====================================
 *
 * ⚠️  PHASE 1 (this file):  All functions resolve from the LOCAL
 *     mock-data modules. No network requests are made.
 *
 * -----------------------------------------------------------------
 *  HOW THIS WILL BE REPLACED WHEN THE BACKEND IS READY
 * -----------------------------------------------------------------
 * Each function below should be rewritten to call a same-origin
 * Cloudflare Pages Function endpoint (e.g. `GET /api/games`) that
 * reads from Supabase server-side using secrets configured on
 * Cloudflare. The function signatures should remain unchanged so
 * the UI does not need to be modified.
 *
 * Example future implementation:
 *
 *   async function listGames() {
 *     const r = await fetch("/api/games", { credentials: "same-origin" });
 *     if (!r.ok) throw new Error("Failed to load games");
 *     return r.json();
 *   }
 *
 * Frontend code never holds Supabase credentials. All privileged
 * access lives behind the Cloudflare Pages Function boundary.
 *
 * -----------------------------------------------------------------
 *  SECURITY NOTE
 * -----------------------------------------------------------------
 * Treat every external `destination` URL returned by these records
 * as untrusted input. The UI must call `utils.safeExternalUrl(...)`
 * before rendering any launch link.
 */

(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const MOCK_GAMES = (WEBBOX.MOCK_GAMES || []).slice();
  const MOCK_CHARACTERS = (WEBBOX.MOCK_CHARACTERS || []).slice();
  const CATEGORIES = (WEBBOX.CATEGORIES || []).slice();

  // Simulate async retrieval so the UI already supports a future
  // promise-based API without a refactor.
  function asPromise(value) {
    return Promise.resolve(value);
  }

  const api = {
    /** Returns all games (sample data in phase 1). */
    listGames() {
      return asPromise(MOCK_GAMES);
    },

    /** Returns a single game by slug, or null. */
    getGame(slug) {
      const found = MOCK_GAMES.find(function (g) {
        return g.slug === slug;
      });
      return asPromise(found || null);
    },

    /** Returns the list of supported categories. */
    listCategories() {
      return asPromise(CATEGORIES);
    },

    /** Returns preset characters (sample data in phase 1). */
    listCharacters() {
      return asPromise(MOCK_CHARACTERS);
    },

    /** Returns a single preset character by id, or null. */
    getCharacter(id) {
      const found = MOCK_CHARACTERS.find(function (c) {
        return c.id === id;
      });
      return asPromise(found || null);
    }
  };

  WEBBOX.api = api;
})(window);
