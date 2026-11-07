// ============================================================================
// Cloudflare Pages Function — POST /api/indexnow
// ============================================================================
// Notifies IndexNow-participating search engines (Bing, Yandex, Naver,
// Seznam, Yep) that the site's public URLs have been updated.
// Requires admin authentication.

const ADMIN_EMAILS = ["findahustlesa@yahoo.com"];
const SITE_HOST = "webbox-sa.pages.dev";

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

  if (!env.INDEXNOW_KEY) {
    return new Response(
      JSON.stringify({ error: "IndexNow key not configured on Cloudflare." }),
      { status: 500, headers }
    );
  }

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
        keyLocation: keyLocation
      }),
      { status: 200, headers }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "IndexNow ping failed" }),
      { status: 502, headers }
    );
  }
}
