// أثر – المنطق المشترك: العميل، الاستدعاءات، الترويسة والتذييل، الإشعارات، الحماية.
(function () {
  const C = window.ATHAR;
  const sb = supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { storageKey: "athar-auth", persistSession: true, autoRefreshToken: true } });
  const ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
    family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c.6-3.4 2.9-5.2 5.5-5.2s4.9 1.8 5.5 5.2M14.5 20c.4-2.4 1.9-3.8 3.7-3.8s3.3 1.4 3.7 3.8"/>',
    school: '<path d="M3 10l9-6 9 6M5 10v10M19 10v10M2 20h20M9 20v-6h6v6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
    logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    arrow: '<path d="M15 6l-6 6 6 6"/>',
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (d) => d ? new Date(d).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const ERR = {
    forbidden: "ليست لديك صلاحية لهذا الإجراء.", self_action: "لا يمكنك تنفيذ هذا الإجراء على حسابك.", admin_protected: "هذا الحساب محمي ولا يعدّله إلا مدير النظام.",
    last_admin: "لا يمكن إيقاف آخر مدير نظام أو سحب دوره.", escalation: "لا يمكنك منح صلاحية لا تملكها.", not_found: "السجل غير موجود.",
    student_not_found: "لا يوجد طالب مسجّل بهذا الرقم. يجب أن يسجّل الطالب أولاً.", already_requested: "طلب الربط بهذا الطالب موجود مسبقاً.",
    invalid_credentials: "بيانات الدخول غير صحيحة.", locked: "تجاوزت عدد المحاولات المسموحة. حاول لاحقاً.", login_taken: "معرّف الدخول مستخدم، اختر معرّفاً آخر.",
    invalid_login_id: "معرّف الدخول: 3 إلى 40 خانة من أحرف إنجليزية صغيرة وأرقام و . _ - ويبدأ بحرف أو رقم.", weak_password: "كلمة المرور أقصر من الحد الأدنى.",
    invalid_input: "تحقق من البيانات المدخلة.", student_no_taken: "رقم الطالب مسجّل مسبقاً.", staff_not_found: "لم يُعثر على المنسوب في النواة الرقمية. تحقق من الرقم الوظيفي.",
    core_already_linked: "هذا المنسوب لديه حساب في أثر مسبقاً.", core_unavailable: "تعذّر الاتصال بالنواة الرقمية الآن. حاول لاحقاً.", employee_no_required: "أدخل الرقم الوظيفي.",
    register_failed: "تعذّر إنشاء الحساب.", server_error: "حدث خطأ في الخادم. حاول مرة أخرى.", required_kind: "إشعارات حالة الحساب إلزامية.", role_required: "اختر دوراً واحداً على الأقل.",
    invalid_role: "الدور غير مناسب لنوع الحساب.", invalid_value: "القيمة غير صالحة.", network: "تعذّر الاتصال بالخادم.",
  };
  const msg = (e) => { const m = (e && (e.message || e.error || e)) + ""; for (const k in ERR) if (m.includes(k)) return ERR[k]; return ERR[e && e.error] || "تعذّر تنفيذ الطلب."; };
  const rpc = async (fn, args) => { const { data, error } = await sb.rpc("athar_" + fn, args || {}); if (error) throw error; return data; };
  const api = async (action, body, token) => {
    let r; try { r = await fetch(C.functionUrl, { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseKey, ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ action, ...body }) }); } catch (_) { throw { error: "network" }; }
    const j = await r.json().catch(() => ({})); if (!r.ok) throw j; return j;
  };
  const toast = (t, bad) => { const d = document.createElement("div"); d.className = "toast" + (bad ? " bad" : ""); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); };
  const $ = (s, r) => (r || document).querySelector(s);
  const PORTAL = { staff: ["staff.html", "المنسوبون"], student: ["student.html", "الطلاب"], parent: ["parent.html", "أولياء الأمور"] };
  const TYPE_AR = { staff: "منسوب", student: "طالب", parent: "ولي أمر" };
  const STATUS_AR = { pending: ["بانتظار الاعتماد", "warn"], active: ["مفعّل", "ok"], suspended: ["موقوف", "bad"], rejected: ["مرفوض", "bad"] };
  const badge = (s) => { const [t, c] = STATUS_AR[s] || [s, ""]; return `<span class="badge ${c}">${esc(t)}</span>`; };

  const state = { me: null };
  async function loadMe() { const { data } = await sb.auth.getSession(); if (!data.session) return null; try { state.me = await rpc("me"); } catch (_) { state.me = null; } return state.me; }
  const can = (p) => !!state.me && state.me.status === "active" && state.me.permissions.includes(p);

  async function chrome(active) {
    const me = state.me, links = [["index.html", "الرئيسية", "home"], ["help.html", "المساعدة", "help"]];
    let right = "";
    if (me) {
      right = `<a href="dashboard.html" class="${active === "dashboard" ? "on" : ""}">${ico("grid")}لوحة التحكم</a>
        <a href="notifications.html" class="bell" aria-label="الإشعارات">${ico("bell")}${me.unread ? `<i>${me.unread}</i>` : ""}</a>
        <a href="profile.html" class="${active === "profile" ? "on" : ""}">${ico("user")}${esc(me.display_name)}</a>
        <button class="lnk" id="lo">${ico("logout")}خروج</button>`;
    } else right = `<a href="index.html#gates">${ico("user")}الدخول</a>`;
    const demo = me?.core_mode === "demo" ? '<div class="demo-banner">التكامل مع النواة الرقمية في الوضع التجريبي: البيانات المرجعية للمنسوبين تجريبية وليست من النواة.</div>' : "";
    $("#hdr").innerHTML = `<header><div class="wrap top"><a class="bm" href="index.html"><b>أثر</b><small>${esc(C.schoolName)}</small></a>
      <button class="navtoggle" aria-label="القائمة" id="nt">القائمة</button>
      <nav id="nv">${links.map(([h, t, i]) => `<a href="${h}" class="${active === h ? "on" : ""}">${ico(i)}${t}</a>`).join("")}${right}</nav>
      <span class="moe"><b>وزارة التعليم</b><small>المملكة العربية السعودية</small></span></div></header>${demo}`;
    $("#nt").onclick = () => $("#nv").classList.toggle("open");
    const lo = $("#lo"); if (lo) lo.onclick = async () => { await sb.auth.signOut(); location.replace("index.html"); };   // الخروج يعيد إلى رئيسية النظام
    $("#ftr").innerHTML = `<footer class="ft"><div class="wrap in"><span><b>أثر</b> · ${esc(C.schoolName)}</span><span>منظومة النواة الرقمية · 1448هـ</span></div></footer>`;
  }
  // حماية الصفحة: types = أنواع الحسابات المسموحة؛ الحسابات غير المفعّلة تُعرض لها حالتها فقط
  async function guard(active, types) {
    await loadMe();
    await chrome(active);
    if (!state.me) { location.replace("index.html#gates"); return false; }
    if (types && !types.includes(state.me.user_type)) { $("#app").innerHTML = '<div class="alert bad">هذه الصفحة غير متاحة لنوع حسابك.</div>'; return false; }
    return true;
  }
  function statusScreen(me) {
    const t = { pending: ["حسابك بانتظار الاعتماد", "تلقينا طلبك وسيراجعه المختصون. ستصلك إشعارات عند اتخاذ القرار.", "info"],
      suspended: ["حسابك موقوف", me.status_note || "راجع إدارة المدرسة.", "bad"], rejected: ["لم يُعتمد طلب التفعيل", me.status_note || "راجع إدارة المدرسة.", "bad"] }[me.status];
    return t ? `<div class="alert ${t[2]}"><b>${esc(t[0])}</b><div>${esc(t[1])}</div></div>` : "";
  }
  window.A = { sb, rpc, api, esc, fmt, msg, toast, $, ico, state, loadMe, can, chrome, guard, statusScreen, badge, PORTAL, TYPE_AR, STATUS_AR, C };
})();
