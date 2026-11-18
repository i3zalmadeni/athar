// إدارة الاستبانات: إنشاء ونشر وروابط وإغلاق. الإظهار بحسب الصلاحية للتجربة فقط؛ التحقق الفعلي في دوال الخادم.
(async () => {
  if (!(await A.guard("surveys-admin.html", ["staff"]))) return;
  const { esc, rpc, $, fmt, can, msg, toast } = A;
const AUD = { student: "المتعلم", teacher: "المعلم", administrative: "الهيئة الإدارية", supervisor: "الجهة المشرفة", parent: "ولي الأمر" }, PUB = ["student", "parent", "supervisor"];
const act = async (fn, ok) => { try { await fn(); toast(ok || "تم"); return true; } catch (x) { toast(msg(x), true); return false; } };
const modal = (html) => { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="md">${html}</div>`; o.onclick = (e) => { if (e.target === o) o.remove(); }; document.body.appendChild(o); return o; };
const table = (heads, rows) => `<div class="tw"><table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}" class="empty">لا توجد سجلات.</td></tr>`}</tbody></table></div>`;
const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast("نُسخ"); } catch (_) { prompt("انسخ", t); } };
const dir = () => location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");

  if (!can("surveys:manage")) { $("#app").innerHTML = '<div class="alert bad">ليست لديك صلاحية إدارة الاستبانات.</div>'; return; }
  const ST = { draft: ["مسودة", ""], open: ["مفتوحة", "ok"], closed: ["مغلقة", "info"] };
  const PH = { agree: ["موافقة", ["لا أوافق بشدة", "لا أوافق", "أوافق", "أوافق بشدة"]], freq: ["تكرار", ["نادراً", "أحياناً", "غالباً", "دائماً"]], sat: ["رضا", ["غير راضٍ", "راضٍ إلى حد ما", "راضٍ", "راضٍ جداً"]], qual: ["جودة", ["ضعيف", "مقبول", "جيد", "ممتاز"]] };
  const DOM = { process: "العملية التربوية", environment: "البيئة المدرسية", leadership: "الإدارة والقيادة" };
  const shortLink = (x) => dir() + "s/" + x.token, staffLink = (x) => dir() + "survey.html?id=" + x.id;

  // حالة الفرز والبحث تُحفظ في الرابط ليسهل الرجوع إليها
  const F = { a: (location.hash.slice(1).split("&")[0] || "all"), s: "all", q: "" }; if (F.a !== "all" && !AUD[F.a]) F.a = "all";
  let L = [], open_ = null; const cache = {};
  const AICON = { student: "users", teacher: "school", administrative: "shield", supervisor: "info", parent: "user" };
  const pct = (x) => { const t = x.target_count; return t ? Math.min(100, Math.round(100 * x.responses / t)) : null; };
  const card = (x) => { const p = pct(x), pub = PUB.includes(x.audience), isOpen = open_ === x.id;
    return `<article class="scard ${x.status} ${isOpen ? "ex" : ""}" data-id="${x.id}"><div class="sc-h" data-t="${x.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
      <span class="sc-i">${A.ico(AICON[x.audience])}</span><div class="sc-m"><b>${esc(x.title)}</b><small>${AUD[x.audience]} · ${x.questions} أسئلة</small></div><span class="badge ${ST[x.status][1]}">${ST[x.status][0]}</span></div>
      <div class="sc-s"><div><b>${x.responses}</b><span>استجابة${x.target_count ? " من " + x.target_count : ""}</span></div>${p !== null ? `<div class="prog" aria-label="${p}%"><i style="width:${p}%"></i></div><em>${p}%</em>` : ""}</div>
      ${pub && x.token && x.status !== "closed" ? `<div class="sc-l"><code dir="ltr">${esc(dir().replace(/^https?:\/\//, ""))}s/${esc(x.token)}</code><button class="btn sm sec" data-cp="${x.id}">نسخ</button></div>` : ""}
      <div class="sc-a">${x.status === "draft" ? `<button class="btn sm" data-o="${x.id}">فتح للتعبئة</button><button class="btn sm sec" data-e="${x.id}">تعديل</button>` : ""}${x.status !== "closed" ? `<button class="btn sm sec" data-p="${x.id}">نشر ومشاركة</button>` : ""}${x.status === "open" ? `<button class="btn sm bad" data-c="${x.id}">إغلاق</button>` : ""}${x.status !== "draft" ? `<a class="btn sm sec" href="studies-admin.html">النتائج والدراسة</a>` : ""}${x.status === "draft" ? `<button class="btn sm bad" data-x="${x.id}">حذف</button>` : ""}</div>
      ${isOpen ? `<div class="sc-q" id="q-${x.id}"><span class="spin"></span></div>` : ""}</article>`; };
  function paint() {
    const base = L.filter((x) => (F.s === "all" || x.status === F.s) && (!F.q || (x.title + AUD[x.audience]).includes(F.q))), rows = base.filter((x) => F.a === "all" || x.audience === F.a);
    const cnt = (a) => L.filter((x) => (a === "all" || x.audience === a) && (F.s === "all" || x.status === F.s) && (!F.q || (x.title + AUD[x.audience]).includes(F.q))).length;
    const sc = (st) => L.filter((x) => st === "all" || x.status === st).length;
    $("#lst").innerHTML = `<div class="seg" role="tablist" aria-label="الفئة">${["all", ...Object.keys(AUD)].map((a) => `<button role="tab" aria-selected="${F.a === a}" data-a="${a}" class="${F.a === a ? "on" : ""}">${a === "all" ? "كل الفئات" : AUD[a]}<span>${cnt(a)}</span></button>`).join("")}</div>
      <div class="bar"><input id="q" type="search" placeholder="بحث في الاستبانات" value="${esc(F.q)}" style="flex:1;min-width:180px"><div class="chips">${[["all", "الكل"], ["draft", "مسودة"], ["open", "مفتوحة"], ["closed", "مغلقة"]].map(([k, n]) => `<button data-s="${k}" class="${F.s === k ? "on" : ""}">${n} <span>${sc(k)}</span></button>`).join("")}</div></div>
      ${rows.length ? `<div class="sgrid">${rows.map(card).join("")}</div>` : `<div class="empty">لا توجد استبانات مطابقة. ${F.a !== "all" ? `<button class="btn sm" id="nn">إنشاء استبانة ${AUD[F.a]}</button>` : ""}</div>`}`;
    document.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { F.a = b.dataset.a; history.replaceState(null, "", "#" + F.a); paint(); });
    document.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { F.s = b.dataset.s; paint(); });
    const q = $("#q"); q.oninput = () => { F.q = q.value.trim(); const pos = q.selectionStart; paint(); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); };
    const nn = $("#nn"); if (nn) nn.onclick = () => builder(null, F.a);
    const by = (id) => L.find((x) => x.id === id);
    document.querySelectorAll("[data-t]").forEach((h) => { const go = async () => { const id = h.dataset.t; open_ = open_ === id ? null : id; paint(); if (open_) preview(open_); }; h.onclick = go; h.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }; });
    document.querySelectorAll(".sc-a,.sc-l").forEach((e) => e.onclick = (ev) => ev.stopPropagation());
    document.querySelectorAll("[data-cp]").forEach((b) => b.onclick = () => copy(shortLink(by(b.dataset.cp))));
    document.querySelectorAll("[data-e]").forEach((b) => b.onclick = () => builder(b.dataset.e));
    document.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => share(by(b.dataset.p)));
    document.querySelectorAll("[data-o]").forEach((b) => b.onclick = async () => { if (confirm("تُفتح الاستبانة للتعبئة" + (PUB.includes(by(b.dataset.o).audience) ? "" : " ويُشعَر المعنيون من المنسوبين") + ". متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.o, p_status: "open" }), "فُتحت الاستبانة")) { await load(); const x = by(b.dataset.o); if (x) share(x); } });
    document.querySelectorAll("[data-c]").forEach((b) => b.onclick = async () => { if (confirm("بعد الإغلاق لا تقبل إجابات ويتوقف الرابط. متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.c, p_status: "closed" }), "أُغلقت الاستبانة")) load(); });
    document.querySelectorAll("[data-x]").forEach((b) => b.onclick = async () => { if (confirm("حذف المسودة نهائياً؟") && await act(() => rpc("admin_delete_survey", { p_id: b.dataset.x }))) { open_ = null; load(); } });
  }
  async function preview(id) { const box = () => document.getElementById("q-" + id); try { const d = cache[id] || (cache[id] = await rpc("admin_get_survey", { p_id: id })); const el = box(); if (!el) return;
    el.innerHTML = d.questions.map((q, i) => `<div class="pq"><b>${i + 1}. ${esc(q.prompt)}</b><div class="hint">${DOM[q.domain] || ""}</div><div class="pq-o">${(q.options || []).map((t, k) => `<span>${k + 1} ${esc(t)}</span>`).join("")}</div></div>`).join("") +
      (PUB.includes(d.audience) && d.status !== "draft" ? `<div class="acts"><button class="btn sm sec" data-r="${id}">بيانات المشاركين</button></div>` : "");
    const r = el.querySelector("[data-r]"); if (r) r.onclick = async () => { try { const x = await rpc("admin_respondents", { p_id: id });
      const o = modal(`<h3>بيانات المشاركين الاختيارية</h3><p class="hint">${x.total} مشاركاً، منهم ${x.with_contact.length} أدخلوا بيانات تواصل.</p>${table(["الاسم", "البريد", "الجوال"], x.with_contact.map((c) => `<tr><td>${esc(c.name || "—")}</td><td dir="ltr">${esc(c.email || "—")}</td><td dir="ltr">${esc(c.phone || "—")}</td></tr>`).join(""))}<div class="acts mt"><button class="btn sec" id="cx">إغلاق</button></div>`);
      o.querySelector("#cx").onclick = () => o.remove(); } catch (e) { toast(msg(e), true); } }; } catch (e) { const el = box(); if (el) el.innerHTML = `<div class="alert bad">${esc(msg(e))}</div>`; } }
  async function load() {
    try { L = await rpc("admin_surveys"); } catch (x) { $("#app").innerHTML = `<div class="alert bad">${esc(msg(x))}</div>`; return; }
    for (const k in cache) delete cache[k];
    if (!$("#lst")) { $("#app").innerHTML = `<div id="sum"></div><div id="lst"></div>`; }
    const n = (f) => L.filter(f).length;
    $("#sum").innerHTML = `<div class="grid"><div class="stat"><b>${L.length}</b><span>استبانات</span></div><div class="stat"><b>${n((x) => x.status === "open")}</b><span>مفتوحة الآن</span></div><div class="stat"><b>${n((x) => x.status === "draft")}</b><span>مسودات</span></div><div class="stat"><b>${L.reduce((a, x) => a + x.responses, 0)}</b><span>إجمالي الاستجابات</span></div></div><div class="bar"><button class="btn" id="ns">استبانة جديدة</button></div>`;
    $("#ns").onclick = () => builder(null, F.a !== "all" ? F.a : null);
    paint();
  }

  // نشر ومشاركة: رابط مختصر قابل للتحديد + إرسال بواتساب ورسالة وبريد
  function share(x) {
    const pub = PUB.includes(x.audience), msgText = (u) => `نرجو التكرم بتعبئة «${x.title}» عبر الرابط: ${u}`;
    if (!pub) { const u = staffLink(x);
      const o = modal(`<h3>نشر الاستبانة</h3><p>استبانة ${AUD[x.audience]} تظهر تلقائياً في «مكتبي الإلكتروني» لكل من فئتهم ${AUD[x.audience]} في النواة، ويصلهم إشعار عند الفتح. التعبئة بحساب النواة.</p>
        <label>رابط مباشر (يطلب الدخول)</label><input readonly dir="ltr" value="${esc(u)}"><div class="acts mt"><button class="btn" id="cp">نسخ الرابط</button><button class="btn sec" id="cx">إغلاق</button></div>`);
      o.querySelector("#cp").onclick = () => copy(u); o.querySelector("#cx").onclick = () => o.remove(); return; }
    const draw = (cur) => { const u = cur.token ? shortLink(cur) : "", live = cur.status === "open";
      o.querySelector(".md").innerHTML = `<h3>نشر ومشاركة: ${esc(cur.title)}</h3>
        ${live ? '<div class="alert ok">الاستبانة مفتوحة، والرابط يعمل الآن.</div>' : '<div class="alert info">الاستبانة مسودة: يعمل الرابط بعد «فتح للتعبئة».</div>'}
        <label>الرابط المختصر</label>${u ? `<input readonly dir="ltr" id="lk" value="${esc(u)}">` : '<p class="hint">يُنشأ تلقائياً عند الفتح، أو حدّد رابطك الآن.</p>'}
        <label for="sl">تحديد آخر الرابط (اختياري)</label><div class="bar"><input id="sl" dir="ltr" maxlength="30" placeholder="مثال: parents-1447" value="${esc(cur.token || "")}" style="flex:1"><button class="btn sm sec" id="ss">حفظ الرابط</button></div>
        <p class="hint">4 إلى 30 خانة: أحرف إنجليزية صغيرة وأرقام وشرطة. الرابط الافتراضي عشوائي من 8 خانات؛ والرابط الذي تحدده أسهل في التذكّر لكنه أسهل في التخمين، ولا يضر ذلك لأن الاستبانة مفتوحة لكل من يملك الرابط.</p>
        ${u ? `<div class="acts"><button class="btn" id="cp">نسخ الرابط</button><a class="btn sec" id="wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msgText(u))}">إرسال بواتساب</a><a class="btn sec" href="sms:?&body=${encodeURIComponent(msgText(u))}">رسالة نصية</a><a class="btn sec" href="mailto:?subject=${encodeURIComponent(cur.title)}&body=${encodeURIComponent(msgText(u))}">بريد إلكتروني</a></div>
        <label class="mt">نص الرسالة</label><textarea readonly rows="2">${esc(msgText(u))}</textarea>` : ""}
        <div class="acts mt"><button class="btn sec" id="cx">إغلاق</button></div>`;
      o.querySelector("#cx").onclick = () => o.remove(); const cp = o.querySelector("#cp"); if (cp) cp.onclick = () => copy(u);
      o.querySelector("#ss").onclick = async () => { try { const t = await rpc("admin_set_survey_slug", { p_id: cur.id, p_slug: o.querySelector("#sl").value }); toast("حُفظ الرابط"); cur = { ...cur, token: t }; draw(cur); load(); } catch (e) { toast(msg(e), true); } }; };
    const o = modal(""); draw(x);
  }

  async function builder(id, aud) {
    const cur = id ? await rpc("admin_get_survey", { p_id: id }) : { title: "", description: "", audience: aud || "teacher", required: true, closes_at: null, target_count: null, questions: [{ kind: "scale", domain: "process", prompt: "", options: PH.agree[1], required: true }] };
    const Q = cur.questions.filter((q) => q.kind === "scale").map((q) => ({ ...q, options: q.options && q.options.length === 4 ? q.options : PH.agree[1] }));
    const o = modal(`<h3>${id ? "تعديل الاستبانة" : "استبانة جديدة"}</h3><label for="sa">الفئة المستهدفة</label><select id="sa">${Object.keys(AUD).map((k) => `<option value="${k}" ${cur.audience === k ? "selected" : ""}>${AUD[k]}</option>`).join("")}</select>
      <label for="st">العنوان</label><input id="st" maxlength="160" value="${esc(cur.title)}"><label for="sd">وصف (اختياري)</label><textarea id="sd" maxlength="1000">${esc(cur.description || "")}</textarea>
      <div class="fg"><div><label for="sc">آخر موعد (اختياري)</label><input id="sc" type="date" value="${cur.closes_at ? cur.closes_at.slice(0, 10) : ""}"></div><div><label for="sg">العدد المستهدف (للروابط العامة)</label><input id="sg" type="number" min="1" value="${cur.target_count || ""}"></div><div><label class="lgchk" for="sr"><input id="sr" type="checkbox" ${cur.required ? "checked" : ""}><span>مطلوبة من المنسوبين</span></label></div></div>
      <p class="hint">كل سؤال بأربع عبارات مرتبة من الأضعف (1) إلى الأقوى (4). اختر قالب العبارات المناسب للسؤال أو اكتبها بنفسك. نص التوصية يظهر في الدراسة إذا ضعفت نتيجة السؤال.</p>
      <div id="qs"></div><div class="acts"><button class="btn sm sec" id="aq">+ سؤال</button></div>
      <p class="err" id="em"></p><div class="acts mt"><button class="btn" id="sv">حفظ كمسودة</button><button class="btn sec" id="cx">إلغاء</button></div>`);
    const setKey = (op) => Object.keys(PH).find((k) => PH[k][1].join("|") === op.join("|")) || "custom";
    const draw = () => { o.querySelector("#qs").innerHTML = Q.map((q, i) => `<div class="qcard"><div class="row2"><b>السؤال ${i + 1}</b><button class="btn sm bad" data-d="${i}">حذف</button></div>
      <input data-p="${i}" maxlength="300" placeholder="نص السؤال" value="${esc(q.prompt)}"><select data-dm="${i}">${Object.keys(DOM).map((k) => `<option value="${k}" ${q.domain === k ? "selected" : ""}>${DOM[k]}</option>`).join("")}</select>
      <select data-ph="${i}">${Object.keys(PH).map((k) => `<option value="${k}" ${setKey(q.options) === k ? "selected" : ""}>قالب: ${PH[k][0]}</option>`).join("")}<option value="custom" ${setKey(q.options) === "custom" ? "selected" : ""}>عبارات مخصصة</option></select>
      <div class="fg">${q.options.map((t, k) => `<div><small class="hint">${k + 1}</small><input data-op="${i}:${k}" maxlength="60" value="${esc(t)}"></div>`).join("")}</div>
      <input data-rc="${i}" maxlength="600" placeholder="توصية عند ضعف النتيجة (اختياري)" value="${esc(q.recommendation || "")}"><input data-sg="${i}" maxlength="600" placeholder="عبارة قوة عند ارتفاع النتيجة (اختياري)" value="${esc(q.strength || "")}">
      <label class="lgchk"><input type="checkbox" data-r="${i}" ${q.required ? "checked" : ""}><span>إجابته مطلوبة</span></label></div>`).join("");
      o.querySelectorAll("[data-d]").forEach((b) => b.onclick = () => { sync(); Q.splice(+b.dataset.d, 1); draw(); });
      o.querySelectorAll("[data-ph]").forEach((s) => s.onchange = () => { sync(); if (PH[s.value]) Q[+s.dataset.ph].options = [...PH[s.value][1]]; draw(); }); };
    const sync = () => { o.querySelectorAll("[data-p]").forEach((e) => Q[+e.dataset.p].prompt = e.value); o.querySelectorAll("[data-dm]").forEach((e) => Q[+e.dataset.dm].domain = e.value);
      o.querySelectorAll("[data-rc]").forEach((e) => Q[+e.dataset.rc].recommendation = e.value); o.querySelectorAll("[data-sg]").forEach((e) => Q[+e.dataset.sg].strength = e.value);
      o.querySelectorAll("[data-op]").forEach((e) => { const [i, k] = e.dataset.op.split(":"); Q[+i].options[+k] = e.value; }); o.querySelectorAll("[data-r]").forEach((e) => Q[+e.dataset.r].required = e.checked); };
    draw();
    o.querySelector("#aq").onclick = () => { sync(); if (Q.length >= 10) { o.querySelector("#em").textContent = "الحد الأقصى 10 أسئلة."; return; } Q.push({ kind: "scale", domain: "process", prompt: "", options: [...PH.agree[1]], required: true }); draw(); };
    o.querySelector("#cx").onclick = () => o.remove();
    o.querySelector("#sv").onclick = async () => { sync(); const m = o.querySelector("#em"); m.textContent = "";
      if (!Q.length || Q.some((q) => q.prompt.trim().length < 3 || q.options.some((t) => !t.trim()))) { m.textContent = "أضف سؤالاً على الأقل، وأكمل نص كل سؤال وعباراته الأربع."; return; }
      const d = o.querySelector("#sc").value, g = o.querySelector("#sg").value;
      if (await act(() => rpc("admin_save_survey", { p_id: id, p_title: o.querySelector("#st").value, p_description: o.querySelector("#sd").value, p_audience: o.querySelector("#sa").value, p_required: o.querySelector("#sr").checked, p_closes: d ? new Date(d + "T23:59:59").toISOString() : null, p_target: g ? Number(g) : null,
        p_questions: Q.map((q) => ({ kind: "scale", domain: q.domain, prompt: q.prompt, options: q.options.map((t) => t.trim()), required: q.required, recommendation: q.recommendation || null, strength: q.strength || null })) }), "حُفظت")) { o.remove(); load(); } };
  }
  load();
})();
