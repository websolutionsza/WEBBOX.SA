// ============================================================================
// Cloudflare Pages Function — GET /api/config
// ============================================================================
// Returns PUBLIC configuration the browser needs to talk to Supabase Auth
// and the Supabase REST API directly.
//
// This endpoint only exposes values that are SAFE for the browser:
//   - SUPABASE_URL    (public — it's just a hostname)
//   - SUPABASE_ANON_KEY (public by design — protected by RLS policies)
//
// It NEVER exposes SUPABASE_SERVICE_ROLE_KEY. That key stays server-side
// only and is used exclusively inside other Pages Functions.
//
// The admin dashboard fetches this config on load to initialise the
// Supabase auth + REST client without hardcoding values in the repo.

export async function onRequestGet(context) {
  const { env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY
    }),
    { headers }
  );
}
