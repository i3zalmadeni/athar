/* الواجهة الرئيسية لأثر: بنمط صفحة «عن النواة» (أقسام مرقّمة، دورة، مزايا، مستفيدون، قبل وبعد) بمحتوى قياس الأثر */
const _HI = {
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c.6-3.4 2.9-5.2 5.5-5.2s4.9 1.8 5.5 5.2M14.5 20c.4-2.4 1.9-3.8 3.7-3.8s3.3 1.4 3.7 3.8"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  school: '<path d="M3 10l9-6 9 6M5 10v10M19 10v10M2 20h20M9 20v-6h6v6"/>',
  plan: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  news: '<rect x="3" y="5" width="14" height="15" rx="2"/><path d="M17 9h3v9a2 2 0 0 1-2 2M7 9h6M7 13h6M7 17h4"/>',
  rep: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 13h7M9 17h7"/>',
  star: '<path d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  shield2: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  signal: '<path d="M4 18a11 11 0 0 1 16 0M7.5 14.5a6 6 0 0 1 9 0M12 18h.01"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  building: '<path d="M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};
const hi = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${_HI[n] || ""}</svg>`;
function aboutPage(me) {
  const I = hi;
  const SH = (n, t, s, k = "") => `<div class="ahb-sh ah-rv" data-rv="up"><span>${n}</span><div>${k ? `<small class="ah-kick">${k}</small>` : ""}<h2>${t}</h2><p>${s}</p></div></div>`;

  /* التحدي والمعالجة */
  const pains = [
    ["bulb", "انطباعات متفرقة", "يُحكم على العملية التعليمية بالتقدير الشخصي والملاحظات العابرة، فلا يُعرف حجم الأثر الحقيقي."],
    ["users", "أصوات غائبة", "يشارك في القرار فريق محدود، بينما لا يُسمع المتعلم ولا ولي الأمر ولا الجهة المشرفة بانتظام."],
    ["clock", "قياس متأخر", "تُجمع الآراء في نهاية العام، فتصل النتائج بعد فوات فرصة التحسين."],
    ["rep", "تقارير بلا قرار", "يتحول القياس إلى جداول لا تنتهي بتوصية واضحة ولا بمسؤول عن المتابعة."],
  ];
  const cures = [
    ["chart", "قياس موحّد", "أسئلة موضوعية بأربعة مستويات تُقرأ بالمقياس نفسه لكل فئة وكل جولة."],
    ["family", "خمس فئات تشارك", "المتعلم والمعلم وولي الأمر والقيادة المدرسية والجهة المشرفة، بحسب ما يخص كل فئة."],
    ["bolt", "دراسة حيّة", "تبدأ الدراسة مسودة من لحظة فتح الاستبانة، وتُحدَّث عند كل مشاركة جديدة."],
    ["target", "توصيات مرتبة", "تُختم كل دراسة بنقاط القوة وفرص التحسين وتوصيات بالأولوية تعتمدها الإدارة."],
  ];

  /* دورة الأثر */
  const flow = [
    ["plan", "اسأل", "استبانة قصيرة لكل فئة، بما لا يزيد على عشرة أسئلة موضوعية"],
    ["link", "أرسل", "رابط مباشر للمتعلم وولي الأمر والجهة المشرفة، ومكتب إلكتروني للمنسوبين"],
    ["edit", "اجمع", "تعبئة بدقائق، وإغلاق تلقائي عند بلوغ العدد المستهدف"],
    ["chart", "حلّل", "متوسطات المحاور ونقاط القوة وفرص التحسين من الإجابات المجمّعة"],
    ["target", "طوّر", "توصيات مرتبة بالأولوية، ثم إعادة القياس في جولة جديدة لرؤية الفرق"],
  ];

  /* ما يقيسه أثر: ثلاثة محاور */
  const axes = [
    ["school", "العملية التعليمية", "جودة التعلم داخل الصف، وأساليب التدريس، والتقويم، والتغذية الراجعة، وما يصل فعلاً إلى المتعلم."],
    ["building", "البيئة المدرسية", "الأمان والانتماء والعلاقات والانضباط والمرافق، وكل ما يصنع مناخاً يساعد على التعلم."],
    ["star", "القيادة التعليمية", "وضوح الرؤية والتواصل ودعم المعلمين ومتابعة التنفيذ، وأثر القرارات على الميدان."],
  ];

  /* المزايا */
  const bento = [
    ["target", "ثلاثة محاور للأثر", "العملية التعليمية والبيئة المدرسية والقيادة التعليمية، تُقاس لكل فئة بما يخصها.", "w2"],
    ["list", "استبانات قصيرة", "عشرة أسئلة كحد أقصى، وبأربعة خيارات موضوعية بعبارات تناسب كل استبانة.", ""],
    ["link", "رابط بلا حساب", "يعبّئ المتعلم وولي الأمر والجهة المشرفة من الجوال مباشرة دون تسجيل.", ""],
    ["key", "حساب النواة", "يدخل المنسوب بحسابه الموحد، فيجد استباناته في مكتبه الإلكتروني.", ""],
    ["chart", "دراسة إلكترونية", "تقرير بالمتوسطات حسب المحور ونقاط القوة وفرص التحسين، ويُطبع للمراجعة والحفظ.", "w2 acc"],
    ["hourglass", "جولات متتابعة", "أعد فتح الاستبانة بجولة جديدة، واقرأ التقرير للجولة وحدها أو تراكمياً.", ""],
    ["bell", "إغلاق تلقائي", "تُغلق الاستبانة عند بلوغ العدد المستهدف، فتتحول النتائج إلى دراسة.", ""],
    ["eye", "المنسوب يرى أثره", "يطّلع المعلم على الدراسات المعتمدة التي شارك فيها، لا على إجابات زملائه.", ""],
    ["shield2", "إجابات مجمّعة وخصوصية", "لا تُربط الإجابة بصاحبها، ولا تُعرض النتائج قبل بلوغ الحد الأدنى من المشاركين.", "w2"],
  ];

  /* المستفيدون: خمس فئات */
  const who = [
    ["cap", "المتعلم", "يقول كيف يعيش تعلمه ومدرسته"],
    ["user", "المعلم", "يقيّم البيئة والقيادة ويرى دراساته"],
    ["family", "ولي الأمر", "يعبّر عن أثر المدرسة على ابنه"],
    ["school", "القيادة المدرسية", "تقرأ أثر قراراتها وخططها"],
    ["shield2", "الجهة المشرفة", "تقوّم واقع المدرسة بمعطيات"],
  ];

  /* قبل وبعد */
  const ba = [
    ["صوت المتعلم", "يُفترض ولا يُسمع", "استبانة تصل إليه برابط وتُجاب في دقائق"],
    ["ولي الأمر", "رأيه في مواقف متفرقة", "مشاركة منتظمة بأسئلة محددة، بلا حساب"],
    ["المعلم", "يتلقى الملاحظات دون قياس", "يقيّم ويطّلع على الدراسات التي شارك فيها"],
    ["القيادة والإشراف", "تقدير بالانطباع", "قراءة بمحاور ومتوسطات وتوصيات"],
    ["التقرير", "جداول تُجمع يدوياً", "دراسة جاهزة تُحدَّث عند كل مشاركة"],
    ["المتابعة", "لا قياس بعد التدخل", "جولة جديدة تُقارَن بسابقتها"],
  ];

  /* المبررات */
  const just = [
    ["target", "قرار يستند إلى أثر", "لا يُكتفى بحصر الأنشطة، بل يُسأل أصحاب العلاقة هل تغيّر شيء فعلاً."],
    ["users", "كل الأصوات في موضع واحد", "المتعلم وولي الأمر والمعلم والقيادة والإشراف يُقاسون بمنهجية واحدة."],
    ["lock", "ثقة بالخصوصية", "الإجابات مجمّعة، وبيانات التواصل الاختيارية منفصلة عنها."],
    ["clock", "سرعة بلا جهد", "تعبئة قصيرة، ودراسة تُبنى تلقائياً بدل تجميع الورق والجداول."],
    ["layers", "امتداد للنواة", "الهوية والفئات تُقرأ من النواة، فلا يتكرر تسجيل أحد."],
    ["globe", "قابل للتعميم", "تنتقل المنهجية إلى مدارس أخرى بتغيير بيانات المدرسة والاستبانات."],
  ];

  /* البنية التقنية */
  const stack = [
    ["phone", "الأجهزة", "المستخدم", "تُجاب الاستبانة من الجوال برابط، وتُدار اللوحة من الحاسب دون تثبيت برنامج.", ["جوال", "حاسب", "لوحي"]],
    ["home", "الواجهة", "العرض", "موقع عربي سريع متجاوب باتجاه RTL، ينشره GitHub Pages.", ["HTML", "CSS", "JavaScript"]],
    ["shield2", "الصلاحيات", "الحماية", "حساب النواة الموحد وأدوار مفروضة داخل قاعدة البيانات لا في الواجهة فقط.", ["Auth", "أدوار"]],
    ["layers", "البيانات", "التخزين", "مخطط مستقل باسم athar في Supabase PostgreSQL، لا يُقرأ إلا عبر دوال تتحقق من الصلاحية.", ["PostgreSQL", "RLS", "RPC"]],
  ];

  const faq = [
    ["هل يدخل المتعلم أو ولي الأمر بحساب؟", "لا. يصلهما رابط الاستبانة فيعبّئانها مباشرة، والاسم والبريد والجوال حقول اختيارية."],
    ["هل تُعرف إجابة كل مشارك؟", "لا. تُحفظ الإجابات مجمّعة ولا تُربط بالاسم، ولا تظهر النتائج قبل بلوغ الحد الأدنى من المشاركين."],
    ["من يرى نتائج الاستبانات؟", "يديرها مدير النواة ومنسق أثر، ويطّلع المنسوب على الدراسات المعتمدة التي شارك فيها فقط."],
    ["متى تُبنى الدراسة؟", "تبدأ مسودة من فتح الاستبانة وتتحدث مع كل مشاركة، وتُراجَع وتُعتمد بعد الإغلاق مع نقاط القوة وفرص التحسين والتوصيات."],
    ["هل يمكن إعادة القياس بعد التدخل؟", "نعم. تُفتح الاستبانة بجولة جديدة، ويُعرض التقرير للجولة وحدها أو تراكمياً لرؤية التغيّر."],
    ["هل أثر تقويم لأداء المعلم؟", "لا. هو أداة لقياس أثر العملية التعليمية وتحسينها، وليس بديلاً عن تقويم الأداء الوظيفي الرسمي."],
  ];

  /* رسم الدورة والمحور */
  const R = 150, cx = 200, cy = 200;
  const nodes = flow.map((f, k) => { const a = (-90 + k * 72) * Math.PI / 180; return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), f, k }; });
  const cycle = `<div class="ah-cyc ah-rv" data-rv="zoom"><svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="ahg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0f8a94"/><stop offset="1" stop-color="#f0a530"/></linearGradient><marker id="aha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#0f8a94"/></marker></defs>
    <circle cx="200" cy="200" r="${R}" class="ah-ring"/><circle cx="200" cy="200" r="${R}" class="ah-ring2"/>
    ${nodes.map((n, k) => { const m = nodes[(k + 1) % 5], a1 = Math.atan2(n.y - cy, n.x - cx) + .24, a2 = Math.atan2(m.y - cy, m.x - cx) - .24; const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)]; return `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${R} ${R} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" class="ah-arc" style="--d:${k * .35}s" marker-end="url(#aha)"/>`; }).join("")}
    <circle cx="200" cy="200" r="70" fill="url(#ahg)" class="ah-core"/></svg><div class="ah-core-t"><b>الأثر</b><small>قياس ثم تطوير</small></div>
    ${nodes.map((n) => `<div class="ah-node" style="left:${n.x / 4}%;top:${n.y / 4}%;--d:${n.k * .12}s"><i>${I(n.f[0])}</i><b>${n.k + 1}. ${n.f[1]}</b></div>`).join("")}</div>`;
  const flowList = `<ol class="ah-fl">${flow.map(([i, t, d], k) => `<li class="ah-rv" data-rv="left" style="--d:${k * .08}s"><span>${k + 1}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ol>`;
  const hub = `<div class="ah-hub ah-rv" data-rv="zoom"><svg viewBox="0 0 400 400" aria-hidden="true">${who.map((w, k) => { const a = (-90 + k * 72) * Math.PI / 180; return `<line x1="200" y1="200" x2="${(200 + 150 * Math.cos(a)).toFixed(1)}" y2="${(200 + 150 * Math.sin(a)).toFixed(1)}" class="ah-spoke" style="--d:${k * .12}s"/>`; }).join("")}<circle cx="200" cy="200" r="150" class="ah-orb"/><circle cx="200" cy="200" r="98" class="ah-orb o2"/></svg>
    <div class="ah-hub-c">${I("chart")}<b>أثر</b></div>
    ${who.map((w, k) => { const a = (-90 + k * 72) * Math.PI / 180; return `<div class="ah-hn" style="left:${(50 + 37.5 * Math.cos(a)).toFixed(2)}%;top:${(50 + 37.5 * Math.sin(a)).toFixed(2)}%;--d:${.2 + k * .12}s"><i>${I(w[0])}</i><b>${w[1]}</b><small>${w[2]}</small></div>`; }).join("")}</div>`;

  const toc = [["what", "التعريف"], ["why", "سبب النشأة"], ["vision", "الرؤية والهدف"], ["axes", "ما الذي نقيسه"], ["flow", "دورة الأثر"], ["feats", "المزايا"], ["who", "المستفيدون"], ["ba", "قبل وبعد"], ["just", "المبررات"], ["tech", "البنية التقنية"], ["faq", "أسئلة متوقعة"]];
  const S = (id, body, cls = "") => `<section class="ahb-s ah-s ${cls}" id="ahb-${id}">${body}</section>`;

  return `<div class="ahb ah"><div class="ahb-toc" role="navigation" aria-label="أقسام الصفحة">${toc.map(([id, t]) => `<button type="button" data-abgo="${id}">${t}</button>`).join("")}</div>
  ${S("what", `<div class="ah-what"><div class="ah-rv" data-rv="up"><small class="ah-kick">تعريف المشروع</small><h2>ما «أثر»؟</h2><p>منظومة تقيس <b>أثر العملية التعليمية</b> في متوسطة لبيد بن ربيعة كما يعيشه <b>المتعلم</b> و<b>المعلم</b> و<b>ولي الأمر</b> و<b>القيادة المدرسية</b> و<b>الجهة المشرفة</b>؛ فتسمع الأصوات الخمسة بمقياس واحد، وتحوّلها إلى دراسة وتوصيات تُبنى عليها قرارات التطوير.</p></div>
  <div class="ah-eq ah-rv" data-rv="up" style="--d:.15s">${[["users", "خمسة أصوات"], ["chart", "مقياس واحد"], ["target", "توصيات"]].map(([i, t], k) => `<span class="ah-eqi"><i>${I(i)}</i><b>${t}</b></span>${k < 2 ? "<em>+</em>" : ""}`).join("")}<em>=</em><span class="ah-eqi res"><i>${I("star")}</i><b>أثر ملموس</b></span></div></div>`)}
  ${S("why", SH("01", "سبب النشأة", "لكل عائق في معرفة الأثر معالجة داخل أثر.", "لماذا أثر؟") + `<div class="ah-ps">${pains.map((p, k) => `<div class="ah-pr ah-rv" data-rv="up" style="--d:${k * .08}s"><div class="ah-p"><i>${I(p[0])}</i><div><b>${p[1]}</b><p>${p[2]}</p></div></div><span class="ah-arr">${I("swap")}</span><div class="ah-c"><i>${I(cures[k][0])}</i><div><b>${cures[k][1]}</b><p>${cures[k][2]}</p></div></div></div>`).join("")}</div><div class="ah-ps-h" aria-hidden="true"><span>التحدي</span><span>الحل في أثر</span></div>`)}
  ${S("vision", SH("02", "الرؤية والرسالة والهدف", "البوصلة التي بُني عليها أثر.", "الاتجاه") + `<div class="ah-vm">${[["target", "الرؤية", "مدرسة تعرف أثر ما تقدّمه من تعليم وبيئة وقيادة بشهادة من تخدمهم، وتجعل هذه المعرفة أساس تطويرها."], ["news", "الرسالة", "توفير مقياس قصير وموثوق يسمع المتعلم وولي الأمر والمعلم والقيادة والإشراف، ويحوّل أصواتهم إلى دراسة وتوصيات."], ["check", "الهدف", "الانتقال من تقدير الأثر بالانطباع إلى قياسه بأدلة، ومتابعة تحسّنه من جولة إلى أخرى."]].map(([i, t, d], k) => `<div class="ah-vc ah-rv" data-rv="flip" style="--d:${k * .12}s"><span class="ah-vn">0${k + 1}</span><i>${I(i)}</i><b>${t}</b><p>${d}</p></div>`).join("")}</div>
  <div class="ah-goals ah-rv" data-rv="up">${[["users", "الجميع يشارك"], ["chart", "قياس بالأدلة"], ["lock", "خصوصية محفوظة"], ["target", "توصيات قابلة للتنفيذ"], ["hourglass", "تحسّن عبر الجولات"]].map(([i, t]) => `<span>${I(i)}${t}</span>`).join("")}</div>`)}
  ${S("axes", SH("03", "ما الذي نقيسه؟", "ثلاثة محاور تتكرر في استبانات الفئات الخمس، لتُقرأ الصورة من كل زاوية.", "المحاور") + `<div class="ah-axes">${axes.map(([i, t, d], k) => `<div class="ah-ax2 ah-rv" data-rv="up" style="--d:${k * .1}s"><span class="ah-axn">0${k + 1}</span><i>${I(i)}</i><b>${t}</b><p>${d}</p><div class="ah-scale" aria-hidden="true">${[1, 2, 3, 4].map((n) => `<u style="--h:${28 + n * 15}%">${n}</u>`).join("")}</div></div>`).join("")}</div>
  <div class="ah-note ah-rv" data-rv="up">${I("info")}<p>كل سؤال بأربعة خيارات موضوعية من 1 إلى 4 بعبارات تناسب الاستبانة، وكل استبانة لا تتجاوز عشرة أسئلة، لتُجاب في دقائق دون إرهاق.</p></div>`)}
  ${S("flow", SH("04", "دورة الأثر", "خمس مراحل متصلة تبدأ بالسؤال وتنتهي بالتطوير ثم القياس من جديد.", "كيف يعمل؟") + `<div class="ah-flow">${cycle}${flowList}</div>`)}
  ${S("feats", SH("05", "المزايا", "ما يقدمه أثر لمن يجيب ولمن يدير ولمن يقرأ النتائج.", "ماذا يقدم؟") + `<div class="ah-bento">${bento.map(([i, t, d, c], k) => `<div class="ah-bt ${c} ah-rv" data-rv="up" style="--d:${(k % 4) * .07}s"><i>${I(i)}</i><b>${t}</b><p>${d}</p><span class="ah-glow2" aria-hidden="true"></span></div>`).join("")}</div>`)}
  ${S("who", SH("06", "المستفيدون", "أثر واحد يخدم خمس فئات، ولكل فئة صوتها وقيمتها.", "لمن؟") + `<div class="ah-whow">${hub}<ul class="ah-wl">${who.map((w, k) => `<li class="ah-rv" data-rv="left" style="--d:${k * .07}s"><i>${I(w[0])}</i><b>${w[1]}</b><span>${w[2]}</span></li>`).join("")}</ul></div>`)}
  ${S("ba", SH("07", "قبل أثر وبعده", "الفرق الذي يُحدثه قياس الأثر في معرفة المدرسة بنفسها.", "الأثر") + `<div class="ah-ba"><div class="ah-bah"><span></span><span class="b">${I("x")} قبل أثر</span><span class="a">${I("check")} مع أثر</span></div>${ba.map(([a, b, c], k) => `<div class="ah-bar2 ah-rv" data-rv="up" style="--d:${k * .06}s"><b>${a}</b><span class="b">${b}</span><span class="ah-sw" aria-hidden="true">${I("swap")}</span><span class="a">${c}</span></div>`).join("")}</div>`)}
  ${S("just", SH("08", "المبررات", "لماذا يستحق قياس الأثر الاعتماد والتعميم.", "القيمة") + `<div class="ah-jt">${just.map(([i, t, d], k) => `<div class="ah-jc ah-rv" data-rv="${k % 2 ? "left" : "right"}" style="--d:${k * .05}s"><i>${I(i)}</i><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div>`)}
  ${S("tech", SH("09", "البنية التقنية", "رحلة الإجابة من جهاز المشارك إلى قاعدة البيانات، محمية بالصلاحيات في كل خطوة.", "كيف بُني؟") + `<div class="ah-arch"><div class="ah-wire" aria-hidden="true"><span></span><i></i><i style="--o:1.3s"></i><i style="--o:2.6s"></i></div>${stack.map(([i, t, r, d, ch], k) => `<div class="ah-nd ah-rv" data-rv="up" style="--d:${k * .12}s"><span class="ah-ndi"><i>${I(i)}</i><em>${k + 1}</em></span><small>${r}</small><b>${t}</b><p>${d}</p><div class="ah-chips">${ch.map((c) => `<span>${c}</span>`).join("")}</div></div>`).join("")}</div>
  <div class="ah-sec ah-rv" data-rv="up">${[["shield2", "الجداول لا تُقرأ مباشرة"], ["check", "كل إجراء يتحقق من الصلاحية في الخادم"], ["lock", "النواة مرجع للقراءة فقط"]].map(([i, t]) => `<span>${I(i)}${t}</span>`).join("")}</div>`)}
  ${S("faq", SH("10", "أسئلة متوقعة", "إجابات مختصرة لما يُسأل عنه عادة.", "استفسارات") + `<div class="ahb-faq">${faq.map(([q, a], k) => `<details class="ah-rv" data-rv="up" style="--d:${(k % 2) * .08}s"${k ? "" : " open"}><summary>${I("help")}<b>${q}</b></summary><p>${a}</p></details>`).join("")}</div>
  <div class="ah-cta ah-rv" data-rv="zoom"><div><b>${me ? "مكتبك الإلكتروني جاهز" : "ابدأ من مكتبك الإلكتروني"}</b><p>${me ? "تجد استباناتك المطلوبة ودراساتك المعتمدة في مكان واحد." : "سجّل دخولك بحساب النواة لتعبئة استباناتك والاطلاع على دراساتك."}</p></div><div class="ah-cta-a"><a class="btn" href="${me ? "dashboard.html" : "login.html"}">${me ? "فتح لوحة التحكم" : "دخول المنسوبين"}</a><a class="btn ghost" href="index.html">الرئيسية</a></div></div>`)}</div>`;
}

/* تفاعل: أزرار الفهرس، ظهور متدرّج، فهرس يتبع القسم، ميل ثلاثي الأبعاد */
function aboutInit(v) {
  const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches, toc = v.querySelector(".ahb-toc");
  const hh = () => (document.querySelector("header")?.offsetHeight || 70);
  const off = () => { const h = hh(); toc.style.top = h + 6 + "px"; v.querySelectorAll(".ahb-s[id]").forEach((x) => (x.style.scrollMarginTop = h + toc.offsetHeight + 20 + "px")); };
  off(); addEventListener("resize", off);
  v.querySelectorAll("[data-abgo]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); const t = document.getElementById("ahb-" + b.dataset.abgo); if (t) t.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }); }));
  const rv = v.querySelectorAll(".ah-rv");
  if ("IntersectionObserver" in window && smooth) { const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const t = e.target; t.classList.add("in"); o.unobserve(t); setTimeout(() => t.classList.add("ah-dn"), 900 + (parseFloat(getComputedStyle(t).transitionDelay) || 0) * 1000); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }); rv.forEach((x) => o.observe(x)); } else rv.forEach((x) => x.classList.add("in", "ah-dn"));
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const id = e.target.id.slice(4); toc.querySelectorAll("button").forEach((b) => { const on = b.dataset.abgo === id; b.classList.toggle("on", on); if (on && toc.scrollWidth > toc.clientWidth) toc.scrollTo({ left: b.offsetLeft - toc.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" }); }); } }), { rootMargin: "-35% 0px -60% 0px" }); v.querySelectorAll(".ahb-s[id]").forEach((s) => io.observe(s)); }
  if (smooth && matchMedia("(hover:hover)").matches) v.querySelectorAll(".ah-bt,.ah-vc,.ah-ax2").forEach((c) => { c.onpointermove = (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg"); c.style.setProperty("--ry", (x * 6).toFixed(2) + "deg"); c.style.setProperty("--mx", (x + 0.5) * 100 + "%"); c.style.setProperty("--my", (y + 0.5) * 100 + "%"); }; c.onpointerleave = () => { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }; });
}
