// ============================================================================
// Cloudflare Pages Function — GET /api/games
// ============================================================================
// Returns all published games from Supabase as a JSON array.
//
// Uses the anon key (RLS-respecting) — the public can only read rows
// where is_published = true. The browser NEVER holds service_role.

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
      "/rest/v1/games" +
      "?select=slug,title,category,description,long_description,accent,image,gallery,destination,featured,sort_order" +
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
    const games = rows.map(transformGame);
    return new Response(JSON.stringify(games), { headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers }
    );
  }
}

function transformGame(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    longDescription: row.long_description,
    accent: row.accent,
    image: row.image || "",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    destination: row.destination || null,
    featured: !!row.featured
  };
}
