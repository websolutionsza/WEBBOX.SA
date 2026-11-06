/**
 * WEB BOX SA — MOCK CHARACTERS DATA  (DEVELOPMENT ONLY)
 * =====================================================
 *
 * ⚠️  These records are SAMPLE DATA used to drive the local profile
 *     experience during development. They are NOT live database
 *     records.
 *
 *     Character names are original invented names.
 *
 * -----------------------------------------------------------------
 *  HOW THIS WILL BE REPLACED BY SUPABASE
 * -----------------------------------------------------------------
 * When the backend is ready, `js/api.js` will fetch preset characters
 * from a same-origin Cloudflare Pages Function endpoint that proxies
 * Supabase server-side. The returned records should match the fields
 * below so the profile UI does not need to change.
 *
 * Field guide:
 *   id        (string)  Stable identifier, unique
 *   name      (string)  Display name
 *   accent    (string)  Hex colour used by the placeholder SVG
 *   glyph     (string)  Short label / initial rendered in placeholder
 *   image     (string)  Optional artwork URL (empty → placeholder)
 *
 *  Replace this entire file with real catalogue records when the
 *  Supabase layer is ready.
 */

(function (global) {
  "use strict";

  const MOCK_CHARACTERS = [
    { id: "warden",   name: "Warden",   accent: "#E11D2A", glyph: "W", image: "" },
    { id: "oracle",   name: "Oracle",   accent: "#2A6F97", glyph: "O", image: "" },
    { id: "nomad",    name: "Nomad",    accent: "#BC6C25", glyph: "N", image: "" },
    { id: "sentinel", name: "Sentinel", accent: "#386641", glyph: "S", image: "" },
    { id: "echo",     name: "Echo",     accent: "#5A189A", glyph: "E", image: "" },
    { id: "drift",    name: "Drift",    accent: "#B5179E", glyph: "D", image: "" }
  ];

  global.WEBBOX = global.WEBBOX || {};
  global.WEBBOX.MOCK_CHARACTERS = MOCK_CHARACTERS;
})(window);
