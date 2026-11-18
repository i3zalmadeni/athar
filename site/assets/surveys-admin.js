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

  async function load() {
    let L; try { L = await rpc("admin_surveys"); } catch (x) { $("#app").innerHTML = `<div class="alert bad">${esc(msg(x))}</div>`; return; }
    $("#app").innerHTML = `<div class="bar"><button class="btn" id="ns">استبانة جديدة</button></div>
      <p class="hint">الأسئلة موضوعية باختيار من أربع عبارات، وبحد أقصى 10 أسئلة. المعلم والهيئة الإدارية يجدان استباناتهما في مكتبهما الإلكتروني، أما المتعلم وولي الأمر والجهة المشرفة فبرابط مختصر يُرسل لهم.</p>` +
      Object.keys(AUD).map((a) => { const rows = L.filter((x) => x.audience === a); return `<h3 class="sec">${AUD[a]}</h3>` + table(["العنوان", "الحالة", "الأسئلة", "الاستجابات", ""], rows.map((x) => `<tr><td><b>${esc(x.title)}</b>${x.token && PUB.includes(a) ? `<div class="hint" dir="ltr" style="text-align:right">/s/${esc(x.token)}</div>` : ""}</td><td><span class="badge ${ST[x.status][1]}">${ST[x.status][0]}</span></td><td>${x.questions}</td><td>${x.responses}</td>
        <td class="acts">${x.status === "draft" ? `<button class="btn sm sec" data-e="${x.id}">تعديل</button><a class="btn sm sec" href="survey.html?id=${x.id}">معاينة</a>` : ""}${x.status !== "closed" ? `<button class="btn sm sec" data-p="${x.id}">نشر ومشاركة</button>` : ""}${x.status === "draft" ? `<button class="btn sm" data-o="${x.id}">فتح للتعبئة</button><button class="btn sm bad" data-x="${x.id}">حذف</button>` : ""}${x.status === "open" ? `<button class="btn sm bad" data-c="${x.id}">إغلاق</button>` : ""}${x.status !== "draft" ? `<a class="btn sm sec" href="studies-admin.html">النتائج والدراسة</a>` : ""}${PUB.includes(a) && x.status !== "draft" ? `<button class="btn sm sec" data-r="${x.id}">بيانات المشاركين</button>` : ""}</td></tr>`).join("")); }).join("");
    $("#ns").onclick = () => builder(null);
    const by = (id) => L.find((x) => x.id === id);
    document.querySelectorAll("[data-e]").forEach((b) => b.onclick = () => builder(b.dataset.e));
    document.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => share(by(b.dataset.p)));
    document.querySelectorAll("[data-o]").forEach((b) => b.onclick = async () => { if (confirm("تُفتح الاستبانة للتعبئة" + (PUB.includes(by(b.dataset.o).audience) ? "" : " ويُشعَر المعنيون من المنسوبين") + ". متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.o, p_status: "open" }), "فُتحت الاستبانة")) { await load(); const x = (await rpc("admin_surveys")).find((y) => y.id === b.dataset.o); if (x) share(x); } });
    document.querySelectorAll("[data-c]").forEach((b) => b.onclick = async () => { if (confirm("بعد الإغلاق لا تقبل إجابات ويتوقف الرابط. متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.c, p_status: "closed" }), "أُغلقت الاستبانة")) load(); });
    document.querySelectorAll("[data-x]").forEach((b) => b.onclick = async () => { if (confirm("حذف المسودة نهائياً؟") && await act(() => rpc("admin_delete_survey", { p_id: b.dataset.x }))) load(); });
    document.querySelectorAll("[data-r]").forEach((b) => b.onclick = async () => { try { const r = await rpc("admin_respondents", { p_id: b.dataset.r });
      const o = modal(`<h3>بيانات المشاركين الاختيارية</h3><p class="hint">${r.total} مشاركاً، منهم ${r.with_contact.length} أدخلوا بيانات تواصل.</p>${table(["الاسم", "البريد", "الجوال"], r.with_contact.map((c) => `<tr><td>${esc(c.name || "—")}</td><td dir="ltr">${esc(c.email || "—")}</td><td dir="ltr">${esc(c.phone || "—")}</td></tr>`).join(""))}<div class="acts mt"><button class="btn sec" id="cx">إغلاق</button></div>`);
      o.querySelector("#cx").onclick = () => o.remove(); } catch (x) { toast(msg(x), true); } });
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

  async function builder(id) {
    const cur = id ? await rpc("admin_get_survey", { p_id: id }) : { title: "", description: "", audience: "teacher", required: true, closes_at: null, target_count: null, questions: [{ kind: "scale", domain: "process", prompt: "", options: PH.agree[1], required: true }] };
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
