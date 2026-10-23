// ============================================================================
// Cloudflare Pages Function — GET /api/games/:slug
// ============================================================================
// Returns a single published game from Supabase by slug, or 404 if not found.
//
// Uses the anon key (RLS-respecting). The browser NEVER holds service_role.
// Route: /api/games/[slug]  (Cloudflare binds :slug to context.params.slug)

export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = params.slug;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "Access-Control-Allow-Origin": "*"
  };

  if (!slug || typeof slug !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing slug" }),
      { status: 400, headers }
    );
  }

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
      "&slug=eq." + encodeURIComponent(slug) +
      "&limit=1";

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
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers }
      );
    }

    return new Response(JSON.stringify(transformGame(rows[0])), { headers });
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
