/* شريط المستخدم الموحّد (منسوخ من digital-core/site/assets/chrome.js دون تعديل سوى إضافة «أثر» إلى قائمة الأنظمة وحذف CSS المضمّن في athar.css) */
// ===== شريط المستخدم الموحّد لمنظومة النواة الرقمية: الإشعارات، ثم صورة المستخدم واسمه الأول والأخير، ثم الخروج =====
// النسخة نفسها في كل الأنظمة. كل نظام يمرّر مصدر إشعاراته ورابط «مشاهدة الكل» إن وُجدت صفحة للإشعارات.
// زر الخروج يحمل المعرّف out، فيعمل معه معالج الخروج الموجود في كل نظام دون تغيير.
const UB_SVG = {
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  apps: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>', building: '<path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
  logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
  check: '<path d="M4 12l5 5L20 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', alert: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', inbox: '<path d="M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>', file: '<path d="M14 3H6v18h12V7zM14 3v4h4"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
};
const ubIco = (n) => `<svg class="ub-i" viewBox="0 0 24 24" aria-hidden="true">${UB_SVG[n] || UB_SVG.bell}</svg>`;
const ubEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// الاسم الأول والأخير: يُبقي الأسماء المركبة («عبد الله»، «آل الشيخ») متصلة
function ubShortName(n) {
  const w = String(n || "").trim().split(/\s+/).filter(Boolean); if (w.length <= 2) return w.join(" ");
  if (w.length === 3 && /^ال/.test(w[1])) return w.join(" "); // اسم حساب وصفي مثل «مدير النواة الرقمية»
  const pre = ["عبد", "أبو", "ابو", "أبا", "ابا"], mid = ["آل", "ال", "أبو", "ابو", "بن", "بنت", "عبد"];
  let first = w[0], i = 1; if (pre.includes(first) && w.length > 2) { first += " " + w[1]; i = 2; }
  let last = w[w.length - 1]; if (w.length - 2 >= i && ["آل", "ال", "أبو", "ابو", "عبد"].includes(w[w.length - 2])) last = w[w.length - 2] + " " + last;
  return mid.includes(last) ? first : first + " " + last;
}
// أنظمة النواة الرقمية: [المسار على الموقع، الاسم، الأيقونة، الوصف]. كلها على أصل واحد فالدخول مشترك،
// والرابط يفتح «مكتبي الإلكتروني» في لوحة تحكم النظام مباشرة
const UB_SYS = [
  ["digital-core/dashboard.html", "النواة الرقمية", "layers", "الهوية الموحدة والسجلات"],
  ["self-evaluation/admin.html", "التقويم المدرسي الذكي", "check", "المؤشرات والشواهد والتقييم"],
  ["smart-plans/#dashboard", "الخطط الذكية", "cal", "الخطط والبرامج وتوثيقها"],
  ["teachers-community/#/home", "مجتمع لبيد المهني", "users", "النمو المهني والمجتمعات"],
  ["indibati/dashboard.html", "انضباطي", "clock", "الحضور والغياب والتأخر"],
  ["qiyami/dashboard.html", "قيمي", "star", "النقاط والأوسمة والسلوك"],
  ["facility-booking/dashboard.html", "احجز مرفق", "building", "حجز المرافق والقاعات"],
  ["athar/dashboard.html", "أثر", "chart", "قياس الأثر وإدارة الاستبانات"],
  ["report/desk.html", "مرآة | الملف الشامل", "eye", "الملف الشامل للمتعلم والمعلم"],
];
const ubSysHTML = () => { const cur = location.pathname.split("/").filter(Boolean)[0] || "";
  return UB_SYS.map(([p, n, i, d]) => { const on = p.split("/")[0] === cur;
    return `<a class="ub-sys${on ? " on" : ""}" href="/${p}"${on ? ' aria-current="page"' : ""}><span class="ub-ic">${ubIco(i)}</span><span class="ub-tx"><b>${ubEsc(n)}</b><small>${on ? "أنت هنا" : ubEsc(d)}</small></span></a>`; }).join(""); };
// HTML الشريط. home: رابط صفحة المستخدم (ملفه أو حسابه) عند النقر على صورته واسمه
function ubBarHTML(name, home) {
  return `<div class="ub"><div class="ub-n"><button type="button" class="ub-bell ub-swb" id="ubS" aria-label="التنقل بين لوحات تحكم الأنظمة" title="أنظمة النواة الرقمية" aria-expanded="false" aria-haspopup="true" aria-controls="ubSP">${ubIco("apps")}</button>
    <div class="ub-p ub-sp" id="ubSP" role="dialog" aria-label="أنظمة النواة الرقمية" hidden><div class="ub-ph"><b>انتقل إلى لوحة تحكم نظام آخر</b></div><div class="ub-sg">${ubSysHTML()}</div></div></div>
    <a class="ub-bell ub-lb${location.pathname.indexOf("lbeed.html") > -1 ? " on" : ""}" id="ubLb" href="/digital-core/lbeed.html" data-tip="يحدث في لبيد" aria-label="يحدث في لبيد" title="يحدث في لبيد"${location.pathname.indexOf("lbeed.html") > -1 ? ' aria-current="page"' : ""}><svg class="ub-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg><span class="ub-lbd" aria-hidden="true"></span></a>
    <div class="ub-n"><button type="button" class="ub-bell" id="ubB" aria-label="الإشعارات" aria-expanded="false" aria-haspopup="true" aria-controls="ubP">${ubIco("bell")}<span class="ub-c" id="ubC" hidden></span></button>
    <div class="ub-p" id="ubP" role="dialog" aria-label="الإشعارات" hidden><div class="ub-ph"><b>الإشعارات</b><button type="button" id="ubR">تحديد الكل كمقروء</button></div><div class="ub-l" id="ubL"><p class="ub-empty">جارٍ التحميل…</p></div><a class="ub-all" id="ubA" href="#" hidden>مشاهدة الكل</a></div></div>
    <a class="ub-u" href="${ubEsc(home || "#")}" title="${ubEsc(name)}"><span class="ub-av" id="ubAv" aria-hidden="true">${ubEsc(String(name || "").trim().charAt(0))}</span><span class="ub-nm">${ubEsc(ubShortName(name))}</span></a>
    <button type="button" class="ub-out" id="out">${ubIco("logout")}<span>خروج</span></button></div>`;
}
// تشغيل الشريط بعد إدراجه (يجوز استدعاؤه بعد كل إعادة رسم للشريط). o: { key, uid, load: async () => [عناصر], allUrl, markAll: async () => {} }
// العنصر: { id, title, body, href, icon, tone: ok|warn|bad|info, t: وقت (اختياري), read: (اختياري؛ وإلا يُحفظ المقروء في هذا المتصفح),
//   tag: وسم قصير (اختياري), group: عنوان تجميع للعناصر بلا وقت في الصفحة (اختياري),
//   acts: أزرار إجراء HTML يبنيها النظام نفسه (اختياري، تظهر في الصفحة فقط) }
const UB = { o: null, N: [], at: 0, seen: new Set(), photo: undefined, pages: [] };
const ubKey = () => "ub-seen-" + ((UB.o && UB.o.key) || "x") + "-" + ((UB.o && UB.o.uid) || "");
const ubSave = () => { try { localStorage.setItem(ubKey(), JSON.stringify([...UB.seen].slice(-400))); } catch (_) {} };
const ubUnread = (x) => (x.read != null ? !x.read : !UB.seen.has(String(x.id)));
const ubFmt = (t) => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleString("ar-SA-u-ca-gregory-nu-latn", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }); };
const ubTx = (x, link) => `<span class="ub-tx">${x.tag ? `<em class="ub-tag">${ubEsc(x.tag)}</em>` : ""}<b>${link && x.href ? `<a href="${ubEsc(x.href)}">${ubEsc(x.title)}</a>` : ubEsc(x.title)}</b>${x.body ? `<small>${ubEsc(x.body)}</small>` : ""}${x.t ? `<time>${ubEsc(ubFmt(x.t))}</time>` : ""}</span>`;
const ubDot = (x) => (ubUnread(x) ? '<span class="ub-dot" aria-label="غير مقروء"></span>' : "");
// عنصر بإجراءات (في الصفحة) يُرسم كتلة لا رابطاً، كي لا تتداخل الأزرار مع الرابط
const ubItem = (x, i, cls, page) => (page && x.acts)
  ? `<div class="${cls} ubg-act ${ubEsc(x.tone || "info")}${ubUnread(x) ? " new" : ""}" data-ubi="${i}"><span class="ub-ic">${ubIco(x.icon || "bell")}</span><div class="ubg-body">${ubTx(x, true)}<div class="ubg-acts">${x.acts}</div></div>${ubDot(x)}</div>`
  : `<a class="${cls} ${ubEsc(x.tone || "info")}${ubUnread(x) ? " new" : ""}" href="${ubEsc(x.href || "#")}" data-ubi="${i}"><span class="ub-ic">${ubIco(x.icon || "bell")}</span>${ubTx(x)}${ubDot(x)}</a>`;
function ubPaint() {
  const $u = (s) => document.getElementById(s), C = $u("ubC"), B = $u("ubB"), L = $u("ubL");
  const n = UB.N.filter(ubUnread).length;
  if (C) { C.hidden = !n; C.textContent = n > 9 ? "9+" : String(n); }
  if (B) B.setAttribute("aria-label", n ? `الإشعارات، ${n} غير مقروء` : "الإشعارات");
  if (L) L.innerHTML = UB.N.length ? UB.N.slice(0, 12).map((x, i) => ubItem(x, i, "ub-it")).join("") : '<p class="ub-empty">لا إشعارات حالياً.</p>';
  UB.pages.forEach((f) => f());
}
async function ubLoad() {
  if (!UB.o) return; try { UB.N = (await UB.o.load()) || []; } catch (e) { console.error(e); UB.N = []; }
  const tv = (x) => +new Date(x.t || 0) || 0;
  UB.N.sort((a, b) => (ubUnread(b) - ubUnread(a)) || (tv(b) - tv(a))); UB.at = Date.now(); UB.loaded = true; ubPaint();
}
async function ubMarkAll() { UB.N.forEach((x) => UB.seen.add(String(x.id))); ubSave(); if (UB.o && UB.o.markAll) { try { await UB.o.markAll(); } catch (_) {} } UB.N = UB.N.map((x) => (x.read != null ? { ...x, read: true } : x)); ubPaint(); }
const ubClose = () => { [["ubP", "ubB"], ["ubSP", "ubS"]].forEach(([p, b]) => { const P = document.getElementById(p), B = document.getElementById(b); if (P) P.hidden = true; if (B) B.setAttribute("aria-expanded", "false"); }); };
function ubMount(o) {
  const $u = (s) => document.getElementById(s), B = $u("ubB"), P = $u("ubP"), A = $u("ubA");
  const first = !UB.o || UB.o.key !== o.key || UB.o.uid !== o.uid;
  UB.o = o; if (first) { try { UB.seen = new Set(JSON.parse(localStorage.getItem(ubKey()) || "[]")); } catch (_) { UB.seen = new Set(); } }
  if (!B) return;
  // الصورة: من سجل النواة (دالة core_my_photo)، وإلا يبقى أول حرف من الاسم. تُجلب مرة واحدة
  const cli = o.client || (typeof sb !== "undefined" ? sb : null);
  const put = (url) => { if (!url) return; const im = new Image(); im.alt = ""; im.onload = () => { const d = $u("ubAv"); if (d && !d.querySelector("img")) { d.textContent = ""; d.appendChild(im); } }; im.src = url; };
  if (UB.photo !== undefined) put(UB.photo);
  else if (cli) { UB.photo = null; Promise.resolve(cli.rpc("core_my_photo")).then(async (r) => {
    const ph = r && r.data; if (!ph || !ph.path) return; let url = null;
    if (ph.public) url = `${APP_CONFIG.supabaseUrl}/storage/v1/object/public/${ph.bucket}/${ph.path.split("/").map(encodeURIComponent).join("/")}`;
    else { try { const s = await cli.storage.from(ph.bucket).createSignedUrl(ph.path, 3600); url = s && s.data && s.data.signedUrl; } catch (_) {} }
    UB.photo = url; put(url);
  }).catch(() => {}); }
  if (A && o.allUrl) { A.href = o.allUrl; A.hidden = false; }
  const SW = $u("ubS"), SP = $u("ubSP");
  if (SW && SP) { SW.onclick = (e) => { e.stopPropagation(); const open = SP.hidden; ubClose(); SP.hidden = !open; SW.setAttribute("aria-expanded", String(open)); };
    SP.onclick = (e) => e.stopPropagation(); }
  B.onclick = (e) => { e.stopPropagation(); const open = P.hidden; if (open) ubClose(); P.hidden = !open; B.setAttribute("aria-expanded", String(open)); if (open && Date.now() - UB.at > 60000) ubLoad(); };
  $u("ubR").onclick = (e) => { e.stopPropagation(); ubMarkAll(); };
  P.onclick = (e) => { e.stopPropagation(); const a = e.target.closest("[data-ubi]"); if (a) { const x = UB.N[+a.dataset.ubi]; if (x) { UB.seen.add(String(x.id)); ubSave(); } ubClose(); } else if (e.target.closest("#ubA")) ubClose(); };
  if (!window.__ubDoc) { window.__ubDoc = true;
    document.addEventListener("click", ubClose);
    document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; const op = [["ubP", "ubB"], ["ubSP", "ubS"]].find(([p]) => { const x = document.getElementById(p); return x && !x.hidden; });
      if (op) { ubClose(); const b = document.getElementById(op[1]); if (b) b.focus(); } }); }
  if (first || !UB.loaded) ubLoad(); else ubPaint();
}
// ===== صفحة الإشعارات الموحّدة التصميم (المصدر نفسه والمقروء نفسه في الجرس) =====
const UB_TONE = { all: "الكل", bad: "عاجل", warn: "يحتاج متابعة", info: "للعلم", ok: "منجز" };
function ubPage(host, sys) {
  if (!host) return; let F = "all", T = "all", Q = "";
  host.innerHTML = `<section class="ubg"><div class="ubg-h"><span class="ubg-i" aria-hidden="true">${ubIco("bell")}</span><div class="ubg-t"><h2>الإشعارات</h2><p>كل ما يخصك في ${ubEsc(sys || "هذا النظام")}: ما ينتظر إجراءك، ونتائج طلباتك، والمستجدات. المقروء هنا مقروء في الجرس أيضاً.</p></div>
    <button type="button" class="ubg-mark" id="ubgR">${ubIco("check")}<span>تحديد الكل كمقروء</span></button></div>
    <div class="ubg-k" id="ubgK"></div>
    <div class="ubg-f"><div class="ubg-seg" role="radiogroup" aria-label="عرض">${[["all", "الكل"], ["new", "غير المقروء"]].map(([k, n]) => `<button type="button" role="radio" data-ubf="${k}">${n}</button>`).join("")}</div>
      <div class="ubg-seg" role="radiogroup" aria-label="النوع">${Object.entries(UB_TONE).map(([k, n]) => `<button type="button" role="radio" data-ubt="${k}">${n}</button>`).join("")}</div>
      <label class="ubg-q">${ubIco("search")}<input type="search" id="ubgQ" placeholder="بحث في الإشعارات" aria-label="بحث في الإشعارات"></label></div>
    <div class="ubg-l" id="ubgL" aria-live="polite"><p class="ub-empty">جارٍ التحميل…</p></div></section>`;
  const day = (x) => { const t = x.t; if (!t) return x.group || "يحتاج إجراءً الآن"; const d = new Date(t), k = (x) => x.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }), now = new Date();
    if (isNaN(d)) return "أخرى"; const dd = k(d), td = k(now), yd = k(new Date(now - 864e5)); if (dd > td) return "قادم"; if (dd === td) return "اليوم"; if (dd === yd) return "أمس";
    return now - d < 7 * 864e5 ? "هذا الأسبوع" : "أقدم"; };
  const draw = () => {
    const L = document.getElementById("ubgL"); if (!L) { UB.pages = UB.pages.filter((f) => f !== draw); return; }
    const all = UB.N, un = all.filter(ubUnread).length, cnt = (t) => all.filter((x) => (x.tone || "info") === t).length;
    document.getElementById("ubgK").innerHTML = [["الكل", all.length, "a"], ["غير مقروء", un, "n"], ["عاجل", cnt("bad"), "bad"], ["يحتاج متابعة", cnt("warn"), "warn"]].map(([n, v, c]) => `<div class="ubg-kp ${c}"><b>${v}</b><span>${n}</span></div>`).join("");
    host.querySelectorAll("[data-ubf]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.ubf === F)));
    host.querySelectorAll("[data-ubt]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.ubt === T)));
    if (!UB.loaded) return;
    const q = Q.trim(), list = all.map((x, i) => [x, i]).filter(([x]) => (F === "all" || ubUnread(x)) && (T === "all" || (x.tone || "info") === T) && (!q || (x.title + " " + (x.body || "")).includes(q)));
    if (!list.length) { L.innerHTML = `<div class="ubg-empty">${ubIco("bell")}<b>${all.length ? "لا إشعارات مطابقة" : "لا إشعارات حالياً"}</b><span>${all.length ? "غيّر التصفية لعرض غيرها." : "ستظهر هنا مستجدات النظام وما ينتظر إجراءك."}</span></div>`; return; }
    const G = new Map(); list.forEach((p) => { const g = day(p[0]); if (!G.has(g)) G.set(g, []); G.get(g).push(p); });
    L.innerHTML = [...G].map(([g, ps]) => `<h3 class="ubg-d">${ubEsc(g)} <span>${ps.length}</span></h3><div class="ubg-c">${ps.map(([x, i]) => ubItem(x, i, "ubg-it", true)).join("")}</div>`).join("");
  };
  UB.pages = UB.pages.filter((f) => document.body.contains(host) && f !== draw); UB.pages.push(draw);
  host.addEventListener("click", (e) => {
    const f = e.target.closest("[data-ubf]"), t = e.target.closest("[data-ubt]"), a = e.target.closest("[data-ubi]");
    if (f) { F = f.dataset.ubf; draw(); } else if (t) { T = t.dataset.ubt; draw(); }
    else if (a) { const x = UB.N[+a.dataset.ubi]; if (x) { UB.seen.add(String(x.id)); ubSave(); ubPaint(); } }
    else if (e.target.closest("#ubgR")) ubMarkAll();
  });
  host.querySelector("#ubgQ").addEventListener("input", (e) => { Q = e.target.value; draw(); });
  draw(); if (!UB.loaded || Date.now() - UB.at > 30000) ubLoad();
}
// تحديث الاسم بعد الدخول (للأنظمة التي تبني الشريط قبل معرفة المستخدم)
function ubSetName(name, home) {
  const u = document.querySelector(".ub-u"); if (!u) return; u.title = name || ""; if (home) u.href = home;
  const n = u.querySelector(".ub-nm"); if (n) n.textContent = ubShortName(name);
  const av = document.getElementById("ubAv"); if (av && !av.querySelector("img")) av.textContent = String(name || "").trim().charAt(0);
}
