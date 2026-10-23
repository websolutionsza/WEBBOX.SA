// ============================================================================
// Cloudflare Pages Function — GET /api/characters
// ============================================================================
// Returns all published preset characters from Supabase as a JSON array.
//
// Uses the anon key (RLS-respecting). The browser NEVER holds service_role.

export async function onRequestGet(context) {
  const { env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "Access-Control-Allow-Origin": "*"
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers }
    );
  }

  try {
    const url =
      env.SUPABASE_URL +
      "/rest/v1/characters" +
      "?select=id,name,accent,glyph,image,sort_order" +
      "&is_published=eq.true" +
      "&order=sort_order.asc";

    const r = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + env.SUPABASE_ANON_KEY
      }
    });

    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error" }),
        { status: 502, headers }
      );
    }

    const rows = await r.json();
    const characters = rows.map(transformCharacter);
    return new Response(JSON.stringify(characters), { headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers }
    );
  }
}

function transformCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    accent: row.accent,
    glyph: row.glyph,
    image: row.image || ""
  };
}
