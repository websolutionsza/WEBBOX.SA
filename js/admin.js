/**
 * WEB BOX SA — private admin dashboard module
 * ----------------------------------------------
 * Handles:
 *   - fetching public Supabase config from /api/config
 *   - email + password login via Supabase Auth REST API
 *   - session persistence in sessionStorage (per-tab)
 *   - fetching feedback rows (RLS allows only the admin email)
 *   - updating feedback status (new → reviewed → resolved)
 *   - deleting spam / inappropriate submissions
 *   - logout
 *
 * NO supabase-js dependency — uses raw fetch() calls to Supabase's
 * REST API. The access token is stored in sessionStorage (cleared
 * when the tab closes). The anon key is public by design.
 *
 * SECURITY:
 *   - The RLS policies on the feedback table (Phase 5 SQL) enforce
 *     that only the admin email can SELECT/UPDATE/DELETE. Even if a
 *     non-admin creates an account, they see zero rows.
 *   - The access token never leaves the browser except as a Bearer
 *     header to the Supabase REST API.
 *   - No service-role key is used here. Ever.
 */
(function (global) {
  "use strict";

  const WEBBOX = (global.WEBBOX = global.WEBBOX || {});
  const utils = WEBBOX.utils;

  // Session keys
  const SK_ACCESS  = "webbox_admin_access";
  const SK_REFRESH = "webbox_admin_refresh";
  const SK_EMAIL   = "webbox_admin_email";

  // Allowed admin emails — must match the RLS policy in phase5_feedback.sql.
  // This is a UX guard only (the real enforcement is RLS at the DB level).
  const ADMIN_EMAILS = ["findahustlesa@yahoo.com"];

  let supabase = null;     // { url, anonKey }
  let currentFilter = "new";

  /* ---------- Config fetch ---------- */
  async function loadConfig() {
    if (supabase) return supabase;
    const r = await fetch("/api/config", { credentials: "same-origin" });
    if (!r.ok) throw new Error("Config unavailable");
    const data = await r.json();
    if (!data.supabaseUrl || !data.supabaseAnonKey) {
      throw new Error("Config incomplete");
    }
    supabase = { url: data.supabaseUrl, anonKey: data.supabaseAnonKey };
    return supabase;
  }

  /* ---------- Session helpers ---------- */
  function getSession() {
    try {
      const access = sessionStorage.getItem(SK_ACCESS);
      const email  = sessionStorage.getItem(SK_EMAIL);
      if (!access || !email) return null;
      return { access: access, email: email };
    } catch (e) { return null; }
  }

  function saveSession(access, refresh, email) {
    try {
      sessionStorage.setItem(SK_ACCESS, access);
      if (refresh) sessionStorage.setItem(SK_REFRESH, refresh);
      sessionStorage.setItem(SK_EMAIL, email);
    } catch (e) {}
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SK_ACCESS);
      sessionStorage.removeItem(SK_REFRESH);
      sessionStorage.removeItem(SK_EMAIL);
    } catch (e) {}
  }

  /* ---------- Supabase auth REST ---------- */
  async function signIn(email, password) {
    const cfg = await loadConfig();
    const r = await fetch(cfg.url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey
      },
      body: JSON.stringify({ email: email, password: password })
    });
    if (!r.ok) {
      let msg = "Sign-in failed.";
      try {
        const err = await r.json();
        if (err && err.error_description) msg = err.error_description;
        else if (err && err.msg) msg = err.msg;
        else if (r.status === 400) msg = "Invalid email or password.";
        else if (r.status === 429) msg = "Too many attempts. Please wait a minute and try again.";
      } catch (e) {}
      throw new Error(msg);
    }
    const data = await r.json();
    return {
      access: data.access_token,
      refresh: data.refresh_token,
      email: (data.user && data.user.email) || email
    };
  }

  /* ---------- Supabase feedback REST ---------- */
  async function fetchFeedback(accessToken, filter) {
    const cfg = await loadConfig();
    let url = cfg.url + "/rest/v1/feedback?select=id,category,message,game_slug,status,created_at&order=created_at.desc";
    if (filter && filter !== "all") {
      url += "&status=eq." + encodeURIComponent(filter);
    }
    const r = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + accessToken
      }
    });
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      throw new Error("Could not load feedback (HTTP " + r.status + ").");
    }
    return r.json();
  }

  async function updateStatus(accessToken, id, newStatus) {
    const cfg = await loadConfig();
    const r = await fetch(cfg.url + "/rest/v1/feedback?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!r.ok) {
      throw new Error("Could not update feedback status.");
    }
  }

  async function deleteFeedback(accessToken, id) {
    const cfg = await loadConfig();
    const r = await fetch(cfg.url + "/rest/v1/feedback?id=eq." + encodeURIComponent(id), {
      method: "DELETE",
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + accessToken,
        Prefer: "return=minimal"
      }
    });
    if (!r.ok) {
      throw new Error("Could not delete feedback.");
    }
  }

  /* ---------- Rendering ---------- */
  const CATEGORY_LABELS = {
    broken_game: "Broken game",
    technical_issue: "Technical issue",
    suggestion: "Suggestion",
    general: "General feedback"
  };

  const STATUS_LABELS = {
    new: "New",
    reviewed: "Reviewed",
    resolved: "Resolved"
  };

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return iso; }
  }

  function renderList(rows) {
    const wrap = utils.byId("admin-feedback-list");
    if (!wrap) return;
    utils.clear(wrap);

    if (!rows || rows.length === 0) {
      wrap.appendChild(utils.el("div", { class: "admin-empty" },
        "No feedback in this view."
      ));
      return;
    }

    rows.forEach(function (row) {
      const card = utils.el("article", { class: "admin-row admin-row--" + row.status });

      const head = utils.el("div", { class: "admin-row__head" });
      head.appendChild(utils.el("span", {
        class: "admin-row__cat admin-row__cat--" + row.category.replace(/_/g, "-")
      }, CATEGORY_LABELS[row.category] || row.category));

      if (row.game_slug) {
        head.appendChild(utils.el("span", { class: "admin-row__slug" },
          "Game: " + row.game_slug));
      }

      head.appendChild(utils.el("span", {
        class: "admin-row__status admin-row__status--" + row.status
      }, STATUS_LABELS[row.status] || row.status));

      head.appendChild(utils.el("time", {
        class: "admin-row__date",
        datetime: row.created_at
      }, formatDate(row.created_at)));

      card.appendChild(head);

      const msg = utils.el("p", { class: "admin-row__message" }, row.message);
      card.appendChild(msg);

      // Actions
      const actions = utils.el("div", { class: "admin-row__actions" });

      if (row.status !== "reviewed") {
        const btnReviewed = utils.el("button", {
          type: "button",
          class: "btn btn--secondary btn--sm",
          "data-action": "reviewed",
          "data-id": row.id
        }, "Mark reviewed");
        actions.appendChild(btnReviewed);
      }
      if (row.status !== "resolved") {
        const btnResolved = utils.el("button", {
          type: "button",
          class: "btn btn--secondary btn--sm",
          "data-action": "resolved",
          "data-id": row.id
        }, "Mark resolved");
        actions.appendChild(btnResolved);
      }
      const btnDelete = utils.el("button", {
        type: "button",
        class: "btn btn--ghost btn--sm admin-row__delete",
        "data-action": "delete",
        "data-id": row.id
      }, "Delete");
      actions.appendChild(btnDelete);

      card.appendChild(actions);
      wrap.appendChild(card);
    });
  }

  function renderStats(rows) {
    const counts = { new: 0, reviewed: 0, resolved: 0 };
    rows.forEach(function (r) {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    const setNum = function (id, v) {
      const el = utils.byId(id);
      if (el) el.textContent = String(v);
    };
    setNum("stat-new", counts.new);
    setNum("stat-reviewed", counts.reviewed);
    setNum("stat-resolved", counts.resolved);
    setNum("stat-total", rows.length);
  }

  /* ---------- View switching ---------- */
  function showLogin() {
    const login = utils.byId("admin-login");
    const dash  = utils.byId("admin-dashboard");
    if (login) login.classList.remove("is-hidden");
    if (dash)  dash.classList.add("is-hidden");
  }

  function showDashboard(email) {
    const login = utils.byId("admin-login");
    const dash  = utils.byId("admin-dashboard");
    if (login) login.classList.add("is-hidden");
    if (dash)  dash.classList.remove("is-hidden");
    const emailEl = utils.byId("admin-user-email");
    if (emailEl) emailEl.textContent = email;
    loadFeedback();
  }

  /* ---------- Actions ---------- */
  async function loadFeedback() {
    const session = getSession();
    if (!session) { showLogin(); return; }

    const status = utils.byId("admin-status");
    utils.setStatus(status, "Loading feedback…", "info");

    try {
      const rows = await fetchFeedback(session.access, currentFilter);
      utils.clearStatus(status);
      renderList(rows);
      // Stats always reflect ALL feedback, not the filtered view
      if (currentFilter !== "all") {
        const allRows = await fetchFeedback(session.access, "all");
        renderStats(allRows);
      } else {
        renderStats(rows);
      }
    } catch (e) {
      const msg = e && e.message ? e.message : "Could not load feedback.";
      if (msg.indexOf("session has expired") !== -1) {
        clearSession();
        showLogin();
        utils.setStatus(status, "Your session has expired. Please sign in again.", "error");
      } else {
        utils.setStatus(status, msg, "error");
      }
    }
  }

  async function handleRowAction(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    const session = getSession();
    if (!session) { showLogin(); return; }

    const status = utils.byId("admin-status");

    if (action === "delete") {
      if (!window.confirm("Delete this feedback permanently? This cannot be undone.")) {
        return;
      }
    }

    try {
      if (action === "delete") {
        await deleteFeedback(session.access, id);
        utils.setStatus(status, "Feedback deleted.", "success");
      } else {
        await updateStatus(session.access, id, action);
        utils.setStatus(status, "Marked as " + STATUS_LABELS[action] + ".", "success");
      }
      loadFeedback();
    } catch (e) {
      const msg = e && e.message ? e.message : "Action failed.";
      utils.setStatus(status, msg, "error");
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const emailEl = utils.byId("admin-email");
    const passEl  = utils.byId("admin-password");
    const btn = utils.byId("admin-login-btn");
    const status = utils.byId("admin-login-status");

    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";

    if (!email || !password) {
      utils.setStatus(status, "Please enter your email and password.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Signing in…";
    utils.setStatus(status, "Signing in…", "info");

    try {
      const session = await signIn(email, password);

      // UX guard: check the email is in the admin allowlist.
      // (The real enforcement is the RLS policy at the DB level.)
      if (ADMIN_EMAILS.indexOf(session.email.toLowerCase()) === -1) {
        clearSession();
        utils.setStatus(status,
          "This account is not authorised to access the admin dashboard.",
          "error");
        btn.disabled = false;
        btn.textContent = "Sign in";
        return;
      }

      saveSession(session.access, session.refresh, session.email);
      utils.clearStatus(status);
      btn.disabled = false;
      btn.textContent = "Sign in";
      emailEl.value = "";
      passEl.value = "";
      showDashboard(session.email);
    } catch (e) {
      const msg = e && e.message ? e.message : "Sign-in failed.";
      utils.setStatus(status, msg, "error");
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  }

  function handleLogout() {
    clearSession();
    showLogin();
  }

  async function handleIndexNow() {
    const session = getSession();
    if (!session) { showLogin(); return; }

    const status = utils.byId("admin-status");
    const btn = utils.byId("admin-indexnow");
    if (!btn) return;
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Notifying…";
    utils.setStatus(status, "Notifying participating search engines…", "info");
    try {
      const r = await fetch("/api/indexnow", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access },
        credentials: "same-origin"
      });
      let data = null;
      try { data = await r.json(); } catch (e) {}
      if (r.ok && data && data.ok) {
        utils.setStatus(status,
          "Notified participating search engines (Bing, Yandex, Naver, Seznam, Yep). " +
          data.urlsPinged + " URLs submitted. Indexing is at each engine's discretion.",
          "success");
      } else {
        // Build a useful error message showing the ACTUAL IndexNow status
        var msg;
        if (data && data.error) {
          msg = data.error;
        } else if (data && typeof data.indexnowStatus === "number") {
          msg = "IndexNow API returned HTTP " + data.indexnowStatus + ". " +
                "Check that the INDEXNOW_KEY env var on Cloudflare exactly matches " +
                "the key file at /" + (data.indexnowKey || "INDEXNOW_KEY") + ".txt";
        } else if (data && typeof data.status === "number" && data.status !== 200) {
          msg = "IndexNow API returned HTTP " + data.status + ".";
        } else {
          msg = "Ping failed (HTTP " + r.status + "). Check Cloudflare env var INDEXNOW_KEY.";
        }
        utils.setStatus(status, msg, "error");
      }
    } catch (e) {
      utils.setStatus(status, "Ping failed. Please try again later.", "error");
    }
    btn.disabled = false;
    btn.textContent = original;
  }

  function handleFilterChange() {
    const sel = utils.byId("admin-filter-status");
    if (!sel) return;
    currentFilter = sel.value;
    loadFeedback();
  }

  /* ---------- Init ---------- */
  function init() {
    const root = utils.byId("admin-login") || utils.byId("admin-dashboard");
    if (!root) return; // not on the admin page

    const loginForm = utils.byId("admin-login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);

    const logoutBtn = utils.byId("admin-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    const indexnowBtn = utils.byId("admin-indexnow");
    if (indexnowBtn) indexnowBtn.addEventListener("click", handleIndexNow);

    const refreshBtn = utils.byId("admin-refresh");
    if (refreshBtn) refreshBtn.addEventListener("click", loadFeedback);

    const filterSel = utils.byId("admin-filter-status");
    if (filterSel) filterSel.addEventListener("change", handleFilterChange);

    const list = utils.byId("admin-feedback-list");
    if (list) list.addEventListener("click", handleRowAction);

    // Check for existing session
    const session = getSession();
    if (session) {
      showDashboard(session.email);
    } else {
      showLogin();
    }
  }

  WEBBOX.admin = { init: init };
})(window);
