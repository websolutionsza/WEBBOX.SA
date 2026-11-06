// ============================================================================
// Cloudflare Pages Function — POST /api/feedback
// ============================================================================
// Receives anonymous feedback submissions from the public website and
// forwards them to Supabase via the secure submit_feedback() RPC function.
//
// SECURITY:
//   - Uses the anon key (RLS-respecting). The browser NEVER holds service_role.
//   - The actual INSERT happens inside the SECURITY DEFINER function in Postgres,
//     which validates category + message length before inserting.
//   - Honeypot field: if "website" is non-empty, silently pretend success
//     (bots fill hidden fields, humans don't).
//   - Basic time-based check: submission faster than 1.5s after the form
//     became interactive is treated as suspicious (bot). The page sends
//     `X-Form-Open-Ts` as a Unix-ms timestamp header.
//
// RATE LIMITING:
//   Cloudflare Pages Functions are stateless, so true IP-based rate limiting
//   would require Cloudflare KV. For the MVP we rely on honeypot + timing +
//   Supabase-side validation. For heavier protection, add a Cloudflare WAF
//   rule later.

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": stringOrigin(request)
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers }
    );
  }

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers }
    );
  }

  const category     = typeof body.category   === "string" ? body.category   : "";
  const message      = typeof body.message    === "string" ? body.message    : "";
  const gameSlug     = typeof body.game_slug  === "string" ? body.game_slug  : "";
  const honeypot     = typeof body.website    === "string" ? body.website    : "";

  // Honeypot — silently succeed without storing (bots don't know they were caught)
  if (honeypot) {
    return new Response(
      JSON.stringify({ ok: true, id: null }),
      { status: 200, headers }
    );
  }

  // Basic server-side validation (defence in depth — the DB function also validates)
  const ALLOWED_CATEGORIES = ["broken_game", "technical_issue", "suggestion", "general"];
  if (ALLOWED_CATEGORIES.indexOf(category) === -1) {
    return new Response(
      JSON.stringify({ error: "Please choose a valid category." }),
      { status: 400, headers }
    );
  }
  if (!message || message.length < 1 || message.length > 2000) {
    return new Response(
      JSON.stringify({ error: "Message must be between 1 and 2000 characters." }),
      { status: 400, headers }
    );
  }

  // Optional timing check (bot signal)
  const openTs = parseInt(request.headers.get("X-Form-Open-Ts") || "0", 10);
  const now = Date.now();
  if (openTs && now - openTs < 1500) {
    // Too fast — silently succeed without storing
    return new Response(
      JSON.stringify({ ok: true, id: null }),
      { status: 200, headers }
    );
  }

  try {
    const rpcUrl = env.SUPABASE_URL + "/rest/v1/rpc/submit_feedback";
    const r = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        p_category: category,
        p_message: message,
        p_game_slug: gameSlug || null
      })
    });

    if (!r.ok) {
      // Read the upstream error for diagnostics but don't expose it to the client
      return new Response(
        JSON.stringify({ error: "We could not submit your feedback right now. Please try again in a moment." }),
        { status: 502, headers }
      );
    }

    const result = await r.json();
    return new Response(
      JSON.stringify({ ok: true, id: result || null }),
      { status: 200, headers }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error. Please try again later." }),
      { status: 500, headers }
    );
  }
}

// Pre-flight CORS for same-origin POST with JSON body
export async function onRequestOptions(context) {
  const headers = {
    "Access-Control-Allow-Origin": stringOrigin(context.request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Form-Open-Ts",
    "Access-Control-Max-Age": "86400"
  };
  return new Response(null, { status: 204, headers });
}

function stringOrigin(request) {
  // Same-origin by default — return the request's own origin
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch (e) {
    return "*";
  }
}
