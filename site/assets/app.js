// أثر – المنطق المشترك: العميل، الاستدعاءات، الترويسة والتذييل، الإشعارات، الحماية.
(function () {
  const C = window.ATHAR;
  const sb = supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
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
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    arrow: '<path d="M15 6l-6 6 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>',
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
    invalid_link: "الرابط غير صالح أو منتهٍ. اطلب رابطاً جديداً من المدرسة.", rate_limited: "طلبات كثيرة من هذا الجهاز. حاول بعد قليل.", not_staff: "هذا الحساب غير مرتبط بسجل منسوب في النواة الرقمية.", core_inactive: "حسابك غير مفعّل في النواة الرقمية. راجع مدير النواة.",
    survey_not_closed: "تُنشأ الدراسة بعد إغلاق الاستبانة.", study_approved: "الدراسة معتمدة ولا تُعاد صياغتها.", insufficient_data: "عدد المشاركين أقل من الحد الأدنى لإنشاء دراسة.", survey_closed: "الاستبانة غير مفتوحة الآن.", already_submitted: "سبق أن شاركت في هذه الاستبانة.", not_draft: "لا يُعدَّل إلا على الاستبانة في وضع المسودة.",
    invalid_slug: "الرابط من 4 إلى 30 خانة: أحرف إنجليزية صغيرة وأرقام وشرطة.", slug_taken: "هذا الرابط مستخدم، اختر رابطاً آخر.", invalid_input: "تحقق من البيانات المدخلة.", student_no_taken: "رقم الطالب مسجّل مسبقاً.", staff_not_found: "لم يُعثر على المنسوب في النواة الرقمية. تحقق من الرقم الوظيفي.",
    core_already_linked: "هذا المنسوب لديه حساب في أثر مسبقاً.", core_unavailable: "تعذّر الاتصال بالنواة الرقمية الآن. حاول لاحقاً.", employee_no_required: "أدخل الرقم الوظيفي.",
    register_failed: "تعذّر إنشاء الحساب.", server_error: "حدث خطأ في الخادم. حاول مرة أخرى.", required_kind: "إشعارات حالة الحساب إلزامية.", role_required: "اختر دوراً واحداً على الأقل.",
    invalid_role: "الدور غير مناسب لنوع الحساب.", invalid_value: "القيمة غير صالحة.", network: "تعذّر الاتصال بالخادم.",
  };
  const msg = (e) => { const m = (e && (e.message || e.error || e)) + ""; for (const k in ERR) if (m.includes(k)) return ERR[k]; return ERR[e && e.error] || "تعذّر تنفيذ الطلب."; };
  const rpc = async (fn, args) => { const { data, error } = await sb.rpc("athar_" + fn, args || {}); if (error) throw error; return data; };
  const toast = (t, bad) => { const d = document.createElement("div"); d.className = "toast" + (bad ? " bad" : ""); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); };
  const $ = (s, r) => (r || document).querySelector(s);
    const TYPE_AR = { staff: "منسوب", student: "طالب", parent: "ولي أمر" };
  const STATUS_AR = { pending: ["بانتظار الاعتماد", "warn"], active: ["مفعّل", "ok"], suspended: ["موقوف", "bad"], rejected: ["مرفوض", "bad"] };
  const badge = (s) => { const [t, c] = STATUS_AR[s] || [s, ""]; return `<span class="badge ${c}">${esc(t)}</span>`; };

  const CORE_ICON = '<svg class="core-ic" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18a4ab"/><stop offset="1" stop-color="#0c6f82"/></linearGradient></defs><circle cx="80" cy="80" r="76" fill="#fff"/><g class="ci-ring"><circle cx="80" cy="80" r="62" fill="none" stroke="#4fa39a" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 10.8"/></g><circle cx="80" cy="80" r="42" fill="url(#cg)"/><text x="80" y="101" text-anchor="middle" font-family="Tajawal,Tahoma,Arial,sans-serif" font-size="70" font-weight="800" fill="#fff">ن</text><g class="ci-orb"><circle cx="80" cy="16" r="8" fill="#f0b34a"/><circle cx="24.6" cy="112" r="8" fill="#e0955a"/><circle cx="135.4" cy="112" r="8" fill="#4fa39a"/></g></svg>';
  const state = { me: null };
  async function loadMe() { const { data } = await sb.auth.getSession(); if (!data.session) return null; try { state.me = await rpc("me"); } catch (_) { try { state.me = await rpc("staff_session"); } catch (__) { state.me = null; } } return state.me; }
  const can = (p) => !!state.me && state.me.status === "active" && state.me.permissions.includes(p);

  // شعار أثر: موجات تتسع من نقطة ذهبية (الأثر ينتشر من فعل واحد)، داخل دائرة النواة المدارية نفسها
  const MARK = (id) => `<svg class="bm-ic" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18a4ab"/><stop offset="1" stop-color="#0c6f82"/></linearGradient></defs><circle cx="80" cy="80" r="76" fill="#fff"/><g class="ci-ring"><circle cx="80" cy="80" r="62" fill="none" stroke="#4fa39a" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 10.8"/></g><circle cx="80" cy="80" r="42" fill="url(#${id})"/><circle class="rp rp2" cx="80" cy="80" r="29" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4.5"/><circle class="rp rp1" cx="80" cy="80" r="18" fill="none" stroke="#fff" stroke-width="5"/><circle cx="80" cy="80" r="7.5" fill="#f0b34a"/><g class="ci-orb"><circle cx="80" cy="16" r="8" fill="#f0b34a"/><circle cx="24.6" cy="112" r="8" fill="#e0955a"/><circle cx="135.4" cy="112" r="8" fill="#4fa39a"/></g></svg>`;
  const brand = (href) => `<a class="bm" href="${href}">${MARK("lgh")}<span><b>أثر</b><small>${esc(C.schoolName)}</small></span></a>`;
  const headMoe = '<span class="moe hm"><b>وزارة التعليم</b><small>Ministry of Education</small></span>';
  const FOOTER = `<footer class="uf credit"><div class="wrap uf-in"><span class="uf-moe"><b>وزارة التعليم</b><small>Ministry of Education</small></span><div class="uf-mid"><b>مدرسة لبيد بن ربيعة المتوسطة</b><span>مدير المدرسة: خالد بن عبدالرحمن الباش</span><span>أثر · النواة الرقمية – 1448هـ</span></div><div class="uf-end"><div class="uf-card"><svg class="uf-mark" viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="21"/><circle class="ring" cx="24" cy="24" r="15"/><text class="t" x="24" y="31" text-anchor="middle">ع</text><circle class="dot" cx="39" cy="10" r="4.5"/></svg><span class="uf-txt"><small>أحد منتجات</small><b>مختبر الأفكار — عبدالعزيز المديني <i class="uf-ai">AI</i></b></span><span class="uf-sep" aria-hidden="true"></span><span class="uf-links"><a href="https://i3zalmadeni.netlify.app/me" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>تعرّف عليّ</a><a href="https://i3zalmadeni.netlify.app/projects" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>كيف بُني المشروع</a></span></div></div></div></footer>`;
  const PAGES = { "dashboard.html": ["مكتبي الإلكتروني", "grid", "استباناتك ودراساتك وما يخصك في أثر"], "survey.html": ["الاستبانة", "grid", "عبّئ الاستبانة المطلوبة"], "survey-results.html": ["نتائج الاستبانة", "grid", "النتائج المجمّعة"], "study.html": ["الدراسة", "grid", "تقرير الدراسة وتوصياتها"], "surveys-admin.html": ["إدارة الاستبانات", "edit", "إنشاء الاستبانات ونشرها وروابطها وإغلاقها"], "studies-admin.html": ["إدارة الدراسات", "chart", "نتائج الاستبانات الجارية والمغلقة والتقارير والتوصيات"], "admin.html": ["الإدارة", "shield", "الحسابات والصلاحيات وسجل العمليات والإعدادات"], "notifications.html": ["الإشعارات", "bell", "تنبيهات حسابك وطلباتك"] };
  const PUB_NAV = [["index.html", "الرئيسية", "home"], ["about.html", "عن أثر", "info"], ["help.html", "المساعدة", "help"]];
  const BELL = '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>';
  const svg = (p) => `<svg class="ub-i" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const shortName = (n) => { const w = String(n || "").trim().split(/\s+/); return w.length > 1 ? w[0] + " " + w[w.length - 1] : w[0] || ""; };
  async function chrome(active) {
    const me = state.me, app = !!me && !!PAGES[active];
    document.body.classList.toggle("pubsite", !app);
    if (!app) {
      $("#hdr").innerHTML = `<header><div class="wrap top">${brand("index.html")}<button class="navtoggle" aria-label="القائمة" aria-expanded="false" id="nt">${ico("menu")}</button>
        <nav id="nv">${PUB_NAV.map(([h, t, i]) => `<a href="${h}" class="${h === active ? "on" : ""}" ${h === active ? 'aria-current="page"' : ""}>${ico(i)}${t}</a>`).join("")}<a href="${me ? "dashboard.html" : "login.html"}" class="${active === "login.html" ? "on" : ""}">${ico("grid")}${me ? "لوحة التحكم" : "دخول المنسوبين"}</a></nav>${headMoe}</div></header>`;
      $("#nt").onclick = () => { const o = $("#nv").classList.toggle("open"); $("#nt").setAttribute("aria-expanded", o); };
    } else {
      const act = me.status === "active", sm = act && can("surveys:manage"), adm = act && ["accounts:view","roles:manage","audit:view","settings:manage","integration:view"].some(can);
      const TABKEY = { "survey.html": "dashboard.html", "survey-results.html": "studies-admin.html", "study.html": sm ? "studies-admin.html" : "dashboard.html", "notifications.html": "dashboard.html" }, on = TABKEY[active] || active;
      const tabs = [["dashboard.html"], ...(sm ? [["surveys-admin.html"], ["studies-admin.html"]] : []), ...(adm ? [["admin.html"]] : [])];
      const cur = PAGES[active], roles = me.roles.map((r) => r.name_ar).join("، ");
      $("#hdr").innerHTML = `<header class="dash"><div class="wrap top">${brand("dashboard.html")}<div class="idl"><a class="sitelink" href="index.html">الموقع الإلكتروني</a>${headMoe}</div></div><div class="strip" aria-hidden="true"></div>
        <div class="dnav"><div class="wrap dn"><button type="button" class="dmb" id="dmb" aria-expanded="false" aria-controls="dnavIn">${ico("menu")}<span class="dmb-t">القائمة</span></button>
        <div class="dnav-in" id="dnavIn">${tabs.map(([h]) => `<a href="${h}" class="${h === on ? "on" : ""}" ${h === on ? 'aria-current="page"' : ""}>${ico(PAGES[h][1])}${PAGES[h][0]}</a>`).join("")}</div>
        <div class="dwho">${ubBarHTML(me.display_name, "dashboard.html")}</div></div></div></header>
        <div class="pagebar"><div class="wrap pb"><div class="pb-t"><small>${esc(roles)}</small><h1>${cur[0]}</h1></div><p class="pb-d">${cur[2]}</p></div></div>`;
      const d = $(".dnav"), b = $("#dmb"); const set = (o) => { d.classList.toggle("open", o); b.setAttribute("aria-expanded", o); };
      b.onclick = (e) => { e.stopPropagation(); set(!d.classList.contains("open")); }; document.addEventListener("click", (e) => { if (!d.contains(e.target)) set(false); });
      const lo = $("#out"); lo.onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.replace("index.html"); };   // الخروج يعيد إلى رئيسية النظام
      // الجرس المنبثق وقائمة الأنظمة والصورة: من شريط المستخدم الموحّد نفسه
      const TONE = { account: "info", link: "warn", system: "info" };
      ubMount({ key: "athar", uid: me.id, client: sb, allUrl: "notifications.html", load: async () => {
        const L = await rpc("my_notifications", { p_limit: 40 });
        return L.map((n) => ({ id: "n" + n.id, title: n.title, body: n.body, t: n.created_at, read: n.status === "read", tone: TONE[n.kind] || "info", icon: "bell", href: n.link && /^[a-z-]+\.html(\?[\w=&-]+)?(#[a-z]+)?$/.test(n.link) ? n.link : "notifications.html" })); },
        markAll: async () => { await rpc("mark_notifications_read"); } });
      if (window.PK) { try { PK.fitNav($(".dnav-in")); PK.mountAnnouncements({ sb, system: "athar", page: active === "dashboard.html" ? "home" : "all", before: ".pagebar" }); } catch (_) {} }
    }
    $("#ftr").innerHTML = FOOTER;
  }
  // حماية الصفحة: types = أنواع الحسابات المسموحة؛ الحسابات غير المفعّلة تُعرض لها حالتها فقط
  async function guard(active, types) {
    await loadMe();
    await chrome(active);
    if (!state.me) { const { data } = await sb.auth.getSession(); if (data.session) await sb.auth.signOut(); location.replace("login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.hash)); return false; }
    return true;
  }
  function statusScreen(me) {
    const t = { pending: ["حسابك بانتظار الاعتماد", "تلقينا طلبك وسيراجعه المختصون. ستصلك إشعارات عند اتخاذ القرار.", "info"],
      suspended: ["حسابك موقوف", me.status_note || "راجع إدارة المدرسة.", "bad"], rejected: ["لم يُعتمد طلب التفعيل", me.status_note || "راجع إدارة المدرسة.", "bad"] }[me.status];
    return t ? `<div class="alert ${t[2]}"><b>${esc(t[0])}</b><div>${esc(t[1])}</div></div>` : "";
  }
  window.A = { sb, rpc, CORE_ICON, esc, fmt, msg, toast, $, ico, state, loadMe, can, chrome, guard, statusScreen, badge, TYPE_AR, STATUS_AR, C };
})();
