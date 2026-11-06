// ============================================================================
// Cloudflare Pages Function — POST /api/indexnow
// ============================================================================
// Notifies IndexNow-participating search engines (Bing, Yandex, Naver,
// Seznam, Yep) that the site's public URLs have been updated and should
// be re-crawled.
//
// SECURITY:
//   - Requires a valid admin session (Bearer token verified against
//     Supabase Auth, and the user's email must match the admin allowlist).
//   - The INDEXNOW_KEY is read from Cloudflare env vars and is NEVER
//     exposed to the browser.
//   - Random visitors cannot trigger pings.
//
// INDEXNOW DOES NOT GUARANTEE INDEXING. It only tells participating
// search engines "these URLs changed, please consider re-crawling
// them." Indexing remains at each engine's discretion.

const ADMIN_EMAILS = ["findahustlesa@yahoo.com"];
const SITE_HOST = "webbox-sa.pages.dev";

// Public URLs to ping (matches sitemap.xml)
const PUBLIC_URLS = [
  "https://" + SITE_HOST + "/",
  "https://" + SITE_HOST + "/pages/about.html",
  "https://" + SITE_HOST + "/pages/support.html",
  "https://" + SITE_HOST + "/pages/profile.html",
  "https://" + SITE_HOST + "/pages/privacy.html",
  "https://" + SITE_HOST + "/pages/terms.html"
];

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  // 1. Verify the caller is an authenticated admin
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers }
    );
  }
  const token = auth.slice(7);

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers }
    );
  }

  // Verify the token with Supabase Auth
  let userEmail = null;
  try {
    const userRes = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + token
      }
    });
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers }
      );
    }
    const user = await userRes.json();
    userEmail = user && user.email ? user.email.toLowerCase() : null;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Auth verification failed" }),
      { status: 500, headers }
    );
  }

  if (!userEmail || ADMIN_EMAILS.indexOf(userEmail) === -1) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers }
    );
  }

  // 2. Check IndexNow key is configured
  if (!env.INDEXNOW_KEY) {
    return new Response(
      JSON.stringify({ error: "IndexNow key not configured on Cloudflare. Add INDEXNOW_KEY as an environment variable." }),
      { status: 500, headers }
    );
  }

  // 3. Ping IndexNow
  const keyLocation = "https://" + SITE_HOST + "/" + env.INDEXNOW_KEY + ".txt";
  try {
    const r = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: env.INDEXNOW_KEY,
        keyLocation: keyLocation,
        urlList: PUBLIC_URLS
      })
    });

    return new Response(
      JSON.stringify({
        ok: r.ok,
        status: r.status,
        urlsPinged: PUBLIC_URLS.length,
        keyLocation: keyLocation,
        enginesNotified: "Bing, Yandex, Naver, Seznam, Yep (IndexNow participants)"
      }),
      { status: 200, headers }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "IndexNow ping failed: " + (e && e.message ? e.message : "unknown error") }),
      { status: 502, headers }
    );
  }
}
