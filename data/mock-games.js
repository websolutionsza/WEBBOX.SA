/**
 * WEB BOX SA — MOCK GAMES DATA  (DEVELOPMENT ONLY)
 * =================================================
 *
 * ⚠️  These records are SAMPLE DATA used to drive the public website
 *     during development. They are NOT live database records and do
 *     NOT represent real, playable games.
 *
 *     Game titles are original invented names. No third-party game
 *     titles, trademarks or copyrighted artwork are claimed.
 *
 * -----------------------------------------------------------------
 *  HOW THIS WILL BE REPLACED BY THE SUPABASE CATALOGUE
 * -----------------------------------------------------------------
 * When the backend is ready, `js/api.js` will fetch games from
 * same-origin Cloudflare Pages Function endpoints (e.g.
 *   GET /api/games
 *   GET /api/games/:slug
 * ) that proxy Supabase server-side using secrets configured on
 * Cloudflare. The shape of the returned records should match the
 * fields below so the UI does not need to change.
 *
 * Field guide:
 *   slug         (string)  URL-safe identifier, unique
 *   title        (string)  Display name
 *   category     (string)  One of: Action / Adventure / Puzzle /
 *                          Racing / Strategy / Platformer
 *   description  (string)  Short description shown on cards
 *   longDescription (string) Longer description shown on detail page
 *   accent       (string)  Hex colour used by the SVG placeholder
 *                          generator when `image` is empty
 *   image        (string)  Main artwork URL (empty → placeholder)
 *   gallery      (string[]) Optional additional image URLs
 *   destination  (string|null)  External launch URL. null = the
 *                          launch button is disabled with the
 *                          message "Destination not configured".
 *   featured     (boolean) Shown in the featured row on the homepage
 *
 *  Replace this entire file with real catalogue records when the
 *  Supabase layer is ready.
 */

(function (global) {
  "use strict";

  const MOCK_GAMES = [
    {
      slug: "neon-drift",
      title: "Neon Drift",
      category: "Racing",
      description: "High-speed arcade racing through neon-lit city circuits.",
      longDescription:
        "Neon Drift is a sample arcade racing experience emphasising tight cornering and momentum. The library entry showcases artwork, category metadata and a description surface — the launch destination will be configured once the project catalogue is wired to the live backend.",
      accent: "#E11D2A",
      image: "",
      gallery: [],
      destination: null,
      featured: true
    },
    {
      slug: "shadow-protocol",
      title: "Shadow Protocol",
      category: "Action",
      description: "A tactical infiltration sandbox with reactive enemy AI.",
      longDescription:
        "Shadow Protocol is a sample action entry demonstrating how a stealth-leaning title would appear inside the WEB BOX library. The detail view accommodates a hero artwork, supporting gallery images and a launch destination.",
      accent: "#8A1C1C",
      image: "",
      gallery: [],
      destination: null,
      featured: true
    },
    {
      slug: "crystal-kingdoms",
      title: "Crystal Kingdoms",
      category: "Adventure",
      description: "Explore fractured realms built from crystalline islands.",
      longDescription:
        "Crystal Kingdoms is a sample adventure entry. The detail page layout supports longer descriptions and optional gallery imagery, ready for the future Supabase catalogue to populate.",
      accent: "#2A6F97",
      image: "",
      gallery: [],
      destination: null,
      featured: true
    },
    {
      slug: "void-runner",
      title: "Void Runner",
      category: "Action",
      description: "Survive collapsing platforms across a hostile void.",
      longDescription:
        "Void Runner is a sample action-platformer entry showing how a fast-paced title would be presented in the WEB BOX library. The card surfaces a short description and a clear path to its detail view.",
      accent: "#5A189A",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "quantum-maze",
      title: "Quantum Maze",
      category: "Puzzle",
      description: "Solve rooms that exist in two overlapping states.",
      longDescription:
        "Quantum Maze is a sample puzzle entry designed to demonstrate category filtering and search behaviour against a small, varied dataset. Its launch destination remains intentionally unconfigured.",
      accent: "#1F6E8C",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "aether-heights",
      title: "Aether Heights",
      category: "Platformer",
      description: "Climb impossible towers suspended in the aether.",
      longDescription:
        "Aether Heights is a sample platformer entry used to validate category filtering. The detail page is ready to accept a real artwork URL and launch destination once catalogue data is supplied.",
      accent: "#B5179E",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "citadel-echoes",
      title: "Citadel Echoes",
      category: "Strategy",
      description: "Rebuild a fallen citadel from fragmentary memories.",
      longDescription:
        "Citadel Echoes is a sample strategy entry. It demonstrates the variety of categories surfaced in the WEB BOX library filter set and is ready to be replaced with a real catalogue record.",
      accent: "#386641",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "pixel-forge",
      title: "Pixel Forge",
      category: "Strategy",
      description: "A sandbox builder where every voxel tells a story.",
      longDescription:
        "Pixel Forge is a sample entry showing how a creative sandbox title would appear. The detail page surface accepts an optional gallery and a launch destination.",
      accent: "#BC6C25",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "stellar-voyage",
      title: "Stellar Voyage",
      category: "Adventure",
      description: "Pilot a fragile ship across an unmapped starfield.",
      longDescription:
        "Stellar Voyage is a sample adventure entry. The library card surfaces a short description and a path to its detail view, both ready to be populated by the live catalogue later.",
      accent: "#3A0CA3",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "crimson-gauntlet",
      title: "Crimson Gauntlet",
      category: "Action",
      description: "A wave-survival arena with escalating threat tiers.",
      longDescription:
        "Crimson Gauntlet is a sample arena entry. It is used to validate that the library renders a varied set of cards across categories, and that search and filtering behave correctly.",
      accent: "#9D0208",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "lunar-outpost",
      title: "Lunar Outpost",
      category: "Strategy",
      description: "Manage a brittle colony on the edge of survival.",
      longDescription:
        "Lunar Outpost is a sample strategy entry. The detail view demonstrates how a management-leaning title would be presented inside WEB BOX once catalogue data is supplied.",
      accent: "#6A7E8C",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    },
    {
      slug: "mystic-grove",
      title: "Mystic Grove",
      category: "Puzzle",
      description: "Restore a sleeping forest one careful step at a time.",
      longDescription:
        "Mystic Grove is a sample puzzle entry used to round out the library dataset. It is intentionally a placeholder record and will be replaced by real catalogue data in a later phase.",
      accent: "#2D6A4F",
      image: "",
      gallery: [],
      destination: null,
      featured: false
    }
  ];

  const CATEGORIES = [
    "All",
    "Action",
    "Adventure",
    "Puzzle",
    "Racing",
    "Strategy",
    "Platformer"
  ];

  global.WEBBOX = global.WEBBOX || {};
  global.WEBBOX.MOCK_GAMES = MOCK_GAMES;
  global.WEBBOX.CATEGORIES = CATEGORIES;
})(window);
