# WEB BOX SA — Standalone MVP

A free, independent browser game library. Browse a curated catalogue of
browser-playable games with search and category filters. No registration,
no payment, no subscriptions.

## Production

- **Live site:** <https://webbox-sa.pages.dev/>
- **Hosting:** Cloudflare Pages
- **Backend:** Supabase (PostgreSQL + Auth)
- **Architecture:** Vanilla HTML / CSS / JavaScript — no build pipeline

## What this release includes

### Public website
- Homepage with featured row + searchable library grid
- Game detail pages with availability badges + launch buttons
- Local profile (device-only, IndexedDB image storage)
- About, Support, Privacy, Terms pages
- Branded 404 page
- Cinematic startup intro (with skip + reduced-motion fallback)
- Opening availability disclaimer modal (one-time per browser)

### Feedback system (anonymous)
- Feedback form on `/pages/support.html` with 4 categories
- Character counter, validation, loading state, accessible status messages
- Honeypot + timing-based spam protection
- "Report this game" button on every game detail page (deep-links to the form
  with category + slug pre-filled)

### Private admin dashboard
- `/pages/admin.html` — not linked from public navigation
- Email + password login via Supabase Auth
- Feedback inbox with status management (new → reviewed → resolved)
- Delete spam / inappropriate submissions
- Stats: new / reviewed / resolved / total counts
- Filter + refresh
- "Notify search engines" button (pings IndexNow)

### API (Cloudflare Pages Functions)
- `GET /api/games` — all published, non-removed games
- `GET /api/games/:slug` — single game
- `GET /api/characters` — preset characters
- `GET /api/config` — public Supabase config (URL + anon key only)
- `POST /api/feedback` — anonymous feedback submission
- `POST /api/indexnow` — admin-only IndexNow ping

### Database (Supabase)
- `games` table — with `availability_status` field
  (`available` / `unavailable` / `removed` / `needs_verification`)
- `characters` table — preset characters
- `feedback` table — anonymous submissions with RLS
- `submit_feedback()` SECURITY DEFINER function — validated inserts
- RLS policies: anon can submit only; admin email can read/update/delete

### SEO
- Unique title + meta description per page
- Canonical URLs (all pointing to `https://webbox-sa.pages.dev/`)
- Open Graph + Twitter Card metadata
- JSON-LD structured data (WebSite on homepage, AboutPage on about)
- `sitemap.xml` — 6 public pages
- `robots.txt` — allows crawling, blocks `/pages/admin.html` + `/pages/creator.html`
- IndexNow key + verification file at root
- All cover images have on-theme SVG fallback when remote URLs fail

## Cloudflare Pages environment variables

All four must be present in Cloudflare Pages → Settings → Environment variables:

| Variable | Type | Purpose |
|---|---|---|
| `SUPABASE_URL` | Plaintext | Supabase project URL |
| `SUPABASE_ANON_KEY` | Plaintext or Secret | Public anon key (RLS-respecting) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Privileged key — server-side only |
| `INDEXNOW_KEY` | Plaintext | `3813f660-109f-4071-bed3-94309857443c` |

## File structure

```
WEBBOX.SA/
├── index.html                          Homepage + library
├── 404.html                            Branded 404
├── 3813f660-...txt                     IndexNow verification file
├── _redirects                          Cloudflare Pages redirects
├── robots.txt
├── sitemap.xml
├── styles.css                          Global stylesheet
├── README.md                           This file
├── 500 LOGO.png                        Brand logo
├── favicon.ico + favicon-*.png         Favicons
├── assets/
│   └── config.js                       Central config (domain, assets, nav)
├── data/
│   ├── mock-games.js                   Legacy sample data (not used live)
│   └── mock-characters.js              Legacy sample data (not used live)
├── functions/
│   └── api/
│       ├── games.js                    GET /api/games
│       ├── games/[slug].js             GET /api/games/:slug
│       ├── characters.js               GET /api/characters
│       ├── config.js                   GET /api/config (public)
│       ├── feedback.js                 POST /api/feedback
│       └── indexnow.js                 POST /api/indexnow (admin)
├── js/
│   ├── utils.js                        Helpers (URL validation, DOM, SVG placeholder)
│   ├── api.js                          Data-access layer (fetch from /api/*)
│   ├── nav.js                          Header / footer / mobile menu
│   ├── intro.js                        Cinematic startup intro
│   ├── disclaimer.js                   Opening availability modal
│   ├── library.js                      Homepage library logic
│   ├── game.js                         Game detail page logic
│   ├── profile.js                      Local profile (IndexedDB)
│   ├── feedback.js                     Feedback form handler
│   ├── admin.js                        Admin dashboard (auth + feedback CRUD)
│   └── main.js                         Shared bootstrap (favicons, nav, intro, disclaimer)
├── pages/
│   ├── about.html
│   ├── admin.html                      Private (noindex, not in nav)
│   ├── creator.html                    Redirect stub → /pages/about.html (noindex)
│   ├── game.html
│   ├── privacy.html
│   ├── profile.html
│   ├── support.html                    Contains the feedback form
│   └── terms.html
└── supabase/
    ├── phase3_availability_status.sql  Migration: adds availability_status column
    ├── phase5_feedback.sql             Migration: creates feedback table + RLS
    └── games-review-checklist.csv      51-row checklist for reviewing game availability
```

## Deployment

This project has no build step. Deploy by pushing to GitHub (Cloudflare Pages
auto-deploys) or by uploading the zip contents via the Cloudflare dashboard.

### To deploy this release

1. Download `webbox-sa-final.zip`
2. Unzip it locally
3. Replace the ENTIRE contents of your GitHub repo with the unzipped files
   (delete old files first, then copy in the new ones — preserves folder
   structure: `assets/`, `data/`, `functions/`, `js/`, `pages/`, `supabase/`)
4. Commit and push to GitHub
5. Cloudflare Pages auto-deploys within ~30 seconds
6. Verify: visit `https://webbox-sa.pages.dev/api/config` — should return JSON

### Post-deploy verification

Run these checks after the deploy succeeds:

- `https://webbox-sa.pages.dev/` loads with the styled homepage
- `https://webbox-sa.pages.dev/api/config` returns JSON with `supabaseUrl` + `supabaseAnonKey`
- `https://webbox-sa.pages.dev/api/feedback` (POST with empty body) returns 400
- `https://webbox-sa.pages.dev/pages/admin.html` loads the login form
- `https://webbox-sa.pages.dev/3813f660-109f-4071-bed3-94309857443c.txt` returns the key text
- The opening disclaimer modal appears once, then doesn't reappear on refresh
- The footer says "Maintained by the WEB BOX SA team" with no personal names

## Admin access

- URL: `https://webbox-sa.pages.dev/pages/admin.html`
- Email: `findahustlesa@yahoo.com`
- Password: the one you set when creating the user in Supabase → Authentication → Users

## Game availability management

All 51 existing games are currently marked `needs_verification` (their launch
buttons are disabled). To make a game playable:

1. Sign in to Supabase → Table Editor → `games`
2. Find the game's row
3. Change `availability_status` to `available` (launch button enables)
   or `unavailable` (shows "Unavailable" badge, launch disabled)
   or `removed` (completely hidden from the public library)
4. Changes appear on the live site within ~60 seconds (edge cache TTL)

Use `supabase/games-review-checklist.csv` as a worksheet to review each game's
authorization status before marking it `available`.

## Security model

- The browser NEVER holds `SUPABASE_SERVICE_ROLE_KEY`. All privileged operations
  happen server-side in Cloudflare Pages Functions.
- The anon key is public by design — protected by RLS policies, not by secrecy.
- Feedback table RLS: anon can only call `submit_feedback()` (validated INSERT);
  admin email can SELECT / UPDATE / DELETE.
- Admin dashboard URL is not linked publicly, but URL secrecy is NOT the security
  boundary — the RLS policies enforce access at the database level.
- All external game `destination` URLs are validated via `utils.safeExternalUrl`
  (only `http(s):` and `mailto:` allowed) before being rendered as links.
- Custom profile images stay in the browser's IndexedDB — never uploaded.
- No cookies, analytics, or tracking are used by default.

## Limitations

- IndexNow does not guarantee indexing — it only notifies participating search
  engines (Bing, Yandex, Naver, Seznam, Yep) that URLs changed.
- Game availability depends on third-party sources. Some entries may become
  unavailable at any time.
- The admin email allowlist is hardcoded in `js/admin.js` and in the RLS policy
  SQL. To change the admin email, update both.
- Rate limiting on the feedback endpoint is basic (honeypot + timing). For
  heavier protection, add a Cloudflare WAF rule.
- The `data/mock-games.js` and `data/mock-characters.js` files are legacy
  sample data from Phase 1. They are no longer used by the live site (which
  fetches from Supabase) but are kept for reference. Safe to delete.
