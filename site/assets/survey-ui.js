// واجهة تعبئة الاستبانة المشتركة (الرابط العام ولوحة المنسوبين): جوال أولاً، رسالة افتتاحية وموجّهة وختامية، وشكر عند الإرسال
const SV = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MSG = {
    student: { who: "عزيزي المتعلم", hi: "رأيك يهمنا ويصنع فرقاً في مدرستك. أجب بصراحة وهدوء، فلا توجد إجابة صحيحة أو خاطئة، وإنما تجربتك أنت.", bye: "أنت جزء من تطوير مدرستك، وكل إجابة صادقة منك تقرّبنا من بيئة تعلّم أجمل." },
    parent: { who: "ولي الأمر الكريم", hi: "شراكتكم مع المدرسة سر نجاح أبنائنا. نرجو منكم دقائق قليلة لمشاركتنا ما ترونه، لنحسّن معاً ما يقدَّم لهم.", bye: "نقدّر ثقتكم وتعاونكم، وملاحظاتكم تُقرأ بعناية وتتحول إلى خطوات تحسين." },
    supervisor: { who: "الجهة المشرفة الكريمة", hi: "تقييمكم يساعد المدرسة على قياس أثر عملها وبناء توصيات مبنية على أدلة. نرجو التفضل بتعبئة الاستبانة.", bye: "نشكر لكم دعمكم وملاحظاتكم، وسنأخذها في الاعتبار عند إعداد الدراسة والتوصيات." },
    teacher: { who: "الزميل المعلم الكريم", hi: "صوتك يبني قرارات التطوير في مدرستنا. إجاباتك تُجمَّع ولا تظهر باسمك.", bye: "شكراً لأنك تشارك في تطوير بيئتنا التعليمية، فخبرتك هي رأس مالنا." },
    administrative: { who: "الزميل الإداري الكريم", hi: "ملاحظاتك تساعدنا على تحسين العمل المدرسي وقياس أثره. إجاباتك تُجمَّع ولا تظهر باسمك.", bye: "نقدّر وقتك وجهدك، وما تقدمه يسهم في تطوير العمل المؤسسي." },
  };
  const THANKS = {
    student: ["وصلنا رأيك يا بطل", "شكراً لأنك شاركتنا. كلماتك اليوم تصنع مدرسة أجمل غداً."],
    parent: ["شكراً لكم على مشاركتكم", "ثقتكم وملاحظاتكم وقود التحسين لدينا، ونعدكم بأن تكون محل اهتمام."],
    supervisor: ["شكراً لتعاونكم", "وصلت ملاحظاتكم، وستدخل في الدراسة والتوصيات المعدّة للمدرسة."],
    teacher: ["شكراً لمشاركتك", "رأيك يبني قراراتنا ويطوّر بيئتنا التعليمية."],
    administrative: ["شكراً لمشاركتك", "ملاحظاتك محل تقدير وتدخل في تحسين العمل المدرسي."],
  };
  const AUD = { student: "المتعلم", parent: "ولي الأمر", supervisor: "الجهة المشرفة", teacher: "المعلم", administrative: "الهيئة الإدارية" };
  const q = (x, i) => `<section class="qc" data-q="${x.id}" data-k="${x.kind}" style="animation-delay:${Math.min(i, 8) * 40}ms"><div class="qh"><span class="qn">${i + 1}</span><h4>${esc(x.prompt)}${x.required ? '<em class="rq" title="مطلوب">*</em>' : ""}</h4></div>` +
    (x.kind === "text" ? `<textarea name="q${i}" maxlength="1000" rows="3" placeholder="اكتب رأيك (اختياري)"></textarea>`
      : `<div class="opts">${(x.kind === "scale" ? (x.options || ["1", "2", "3", "4"]) : x.options).map((t, n) => `<label class="op"><input type="radio" name="q${i}" value="${x.kind === "scale" ? n + 1 : n}"><span class="ob"><i>${x.kind === "scale" ? n + 1 : ""}</i><b>${esc(t)}</b></span></label>`).join("")}</div>`) + "</section>";
  // root: العنصر؛ info: {title, description, audience, questions}؛ o: {school, contact, preview, submit(ans, extra)}
  function render(root, info, o) {
    const aud = info.audience, m = MSG[aud] || MSG.teacher, n = info.questions.length;
    root.innerHTML = `<div class="svp"><div class="svh"><span class="svb">${esc(AUD[aud] || "")}</span><h1>${esc(info.title)}</h1><p class="svs">${esc(o.school || "")}</p></div>
      <div class="svi"><b>${m.who}،</b><p>${m.hi}</p>${info.description ? `<p class="svd">${esc(info.description)}</p>` : ""}<p class="svn">${n} أسئلة · نحو ${Math.max(1, Math.ceil(n / 4))} دقائق · بلا حاجة لتسجيل الدخول${o.contact ? "" : ""}</p></div>
      ${o.preview ? '<div class="alert info">هذه معاينة: الاستبانة لم تُفتح بعد.</div>' : ""}
      <div class="svpg" aria-hidden="true"><i id="pg"></i></div><div class="svpl" id="pl" aria-live="polite">0 من ${n}</div>
      <form id="f" novalidate>${info.questions.map(q).join("")}
      ${o.contact ? `<section class="qc"><h4>بيانات اختيارية</h4><p class="hint">يمكنك تركها فارغة. إن أدخلتها فقد تتواصل المدرسة معك عند الحاجة.</p>
        <div class="fg"><div><label for="nm">الاسم</label><input id="nm" maxlength="100" autocomplete="name"></div><div><label for="em">البريد الإلكتروني</label><input id="em" type="email" dir="ltr" maxlength="120" autocomplete="email" inputmode="email"></div>
        <div><label for="ph">رقم الجوال</label><input id="ph" dir="ltr" inputmode="tel" maxlength="20" autocomplete="tel"></div></div></section>
        <div class="hp" aria-hidden="true"><label>الموقع<input id="web" tabindex="-1" autocomplete="off"></label></div>` : ""}
      <div class="svc"><p>${m.bye}</p></div>
      <p class="err" id="m" role="alert"></p><button class="btn block svgo" id="go"${o.preview ? " disabled" : ""}>إرسال الإجابات</button></form></div>`;
    const f = root.querySelector("#f"), upd = () => { const d = info.questions.filter((x) => { const el = f.querySelector(`[data-q="${x.id}"]`); return x.kind === "text" ? el.querySelector("textarea").value.trim() : el.querySelector("input:checked"); }).length;
      root.querySelector("#pg").style.width = Math.round(100 * d / n) + "%"; root.querySelector("#pl").textContent = d + " من " + n; };
    f.addEventListener("change", (e) => { upd(); const sec = e.target.closest && e.target.closest(".qc"); const nx = sec && sec.nextElementSibling; if (e.target.type === "radio" && nx && nx.classList.contains("qc") && matchMedia("(max-width:700px)").matches) setTimeout(() => nx.scrollIntoView({ behavior: "smooth", block: "center" }), 220); });
    f.addEventListener("input", upd);
    f.onsubmit = async (e) => { e.preventDefault(); const m2 = root.querySelector("#m"), b = root.querySelector("#go"); m2.textContent = ""; const ans = {};
      for (const [i, x] of info.questions.entries()) { const el = f.querySelector(`[data-q="${x.id}"]`); let v = null;
        if (x.kind === "text") v = el.querySelector("textarea").value.trim(); else { const c = el.querySelector("input:checked"); v = c ? Number(c.value) : null; }
        if ((v === null || v === "") && x.required) { m2.textContent = `أجب عن السؤال ${i + 1}.`; el.classList.add("miss"); el.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => el.classList.remove("miss"), 1800); return; }
        if (v !== null && v !== "") ans[x.id] = v; }
      const val = (id) => { const el = root.querySelector("#" + id); return el ? (el.value || "").trim() : ""; };
      b.disabled = true; try { await o.submit(ans, { name: val("nm"), email: val("em"), phone: val("ph"), website: val("web") }); thanks(root, aud, o); }
      catch (x) { b.disabled = false; m2.textContent = x.message || "تعذر الإرسال"; } };
  }
  function thanks(root, aud, o) { const t = THANKS[aud] || THANKS.teacher; scrollTo({ top: 0, behavior: "smooth" });
    root.innerHTML = `<div class="svp"><div class="svt"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="c1" cx="60" cy="60" r="54"/><path class="c2" d="M36 62l16 16 32-34"/></svg><h2>${t[0]}</h2><p>${t[1]}</p>
      <div class="svq">نحن في ${esc(o.school || "المدرسة")} نؤمن أن الأثر يبدأ بكلمة صادقة.</div>${o.after || ""}</div></div>`; }
  return { render, esc };
})();
