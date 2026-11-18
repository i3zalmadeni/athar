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
function homePage(me) {
  const I = hi;
  const SH = (n, t, s, k = "") => `<div class="ahb-sh ah-rv" data-rv="up"><span>${n}</span><div>${k ? `<small class="ah-kick">${k}</small>` : ""}<h2>${t}</h2><p>${s}</p></div></div>`;

  const pains = [
    ["list", "نعدّ الأنشطة", "عدد الدورات والحصص والمبادرات والفعاليات التي نُفّذت خلال العام."],
    ["users", "نعدّ الحضور", "كم شارك وكم حضر وكم استفاد حسب السجلات، دون معرفة ماذا بقي بعد ذلك."],
    ["clock", "نحكم في النهاية", "نصل إلى آخر العام بانطباعات عامة، بعد أن فات وقت التصحيح."],
    ["bulb", "نفترض الأثر", "نفترض أن الجهد المبذول أثمر، دون أن نسأل من وصل إليه الجهد."],
  ];
  const cures = [
    ["target", "نسأل: ماذا تغيّر؟", "هل تحسّن تعلّم المتعلم وممارسة المعلم وتجربة ولي الأمر؟"],
    ["family", "نسأل أصحاب التجربة", "من يعيش العملية التعليمية يخبرنا بما وصله فعلاً."],
    ["hourglass", "نقيس أثناء الطريق", "قراءة مبكرة تتيح التعديل قبل أن ينتهي العام."],
    ["chart", "نبني على دليل", "نتائج بمحاور ومتوسطات تحوّل الافتراض إلى معرفة."],
  ];
  const goals = [
    ["target", "معرفة ما تحقق فعلاً", "التمييز بين ما نُفّذ وما أحدث فرقاً حقيقياً في التعلم والبيئة والقيادة."],
    ["users", "إسماع كل الأطراف", "أن يشارك المتعلم والمعلم وولي الأمر والقيادة والجهة المشرفة في الحكم على الأثر."],
    ["bolt", "الكشف المبكر عن الفجوات", "اكتشاف مواضع الضعف وهي قابلة للمعالجة، لا بعد استقرارها."],
    ["check", "توجيه القرار والموارد", "جعل الوقت والجهد والميزانية تذهب إلى ما يثبت أثره."],
    ["star", "تعزيز ما ينجح", "إبراز الممارسات المؤثرة لتُعمَّم وتُكرَّم وتُبنى عليها الخطط."],
    ["hourglass", "تحسّن متواصل", "إعادة القياس بعد كل تدخل لمعرفة هل اقترب الأثر من المستهدف."],
  ];
  const chain = [
    ["plan", "النشاط", "المدخل", "ما نفعله: دروس ومبادرات وبرامج وقرارات إدارية وخطط إشرافية.", ["حصة", "برنامج", "قرار"]],
    ["rep", "المخرج", "المنتج", "ما يُنتج مباشرة: عدد المستفيدين والمواد المنفذة والساعات.", ["عدد", "ساعات", "منتجات"]],
    ["edit", "النتيجة", "التغير القريب", "ما يتغير في المعرفة والاتجاه والممارسة عند من وصله النشاط.", ["فهم", "ممارسة", "رضا"]],
    ["target", "الأثر", "التغير العميق", "ما يستقر في تعلم المتعلم وبيئة المدرسة وجودة القيادة على المدى الأبعد.", ["تعلّم", "بيئة", "قيادة"]],
  ];
  const effects = [
    ["cap", "على المتعلم", "يشعر أن رأيه مسموع، وتُبنى الممارسات الصفية والبيئة بما يلائم تعلمه فعلاً.", "w2"],
    ["user", "على المعلم", "يرى أثر ممارسته كما يصل إلى طلابه، ويحدد احتياجه التطويري بدليل.", ""],
    ["family", "على ولي الأمر", "يتحول من متلقٍ للنتائج إلى شريك يخبر المدرسة بما يراه في ابنه.", ""],
    ["school", "على القيادة المدرسية", "تقرأ أثر قراراتها وخططها وتعدّلها مبكراً، وتوجّه الموارد حيث يظهر الأثر.", "w2 acc"],
    ["shield2", "على الجهة المشرفة", "تقوّم واقع المدرسة بمعطيات واضحة بدل الانطباعات.", ""],
    ["layers", "على المنظومة", "تصبح الثقافة المدرسية ثقافة سؤال وأدلة، وتزداد الثقة حين تُترجم الآراء إلى إجراءات.", ""],
  ];
  const flow = [
    ["target", "حدّد", "ما الأثر المستهدف؟ وعلى من؟"],
    ["list", "اسأل", "أسئلة قصيرة تقيس المحاور المهمة"],
    ["users", "اسمع", "كل فئة تجيب بما يخصها"],
    ["chart", "حلّل", "قراءة الأنماط ومواضع القوة والضعف"],
    ["bolt", "قرّر", "توصيات تتحول إلى إجراءات، ثم يُعاد القياس"],
  ];
  const who = [
    ["cap", "المتعلم", "مركز العملية ومصدر أثرها"],
    ["user", "المعلم", "صانع الأثر المباشر"],
    ["family", "ولي الأمر", "شريك يرى الأثر في البيت"],
    ["school", "القيادة المدرسية", "تحوّل الأثر إلى قرار"],
    ["shield2", "الجهة المشرفة", "تقوّم وتدعم بمعطيات"],
  ];
  const principles = [
    ["lock", "الخصوصية أولاً", "تُجمّع الإجابات ولا تُربط بأصحابها، فيجيب الناس بصدق."],
    ["target", "أثر لا انطباع", "نسأل عن التغير الفعلي، لا عن مجرد الرضا العام."],
    ["shield2", "ليس تقويماً للأفراد", "هدفه تحسين العملية، وليس الحكم على أداء معلم أو إداري."],
    ["clock", "قصير وواضح", "أسئلة محدودة تحترم وقت المشارك وتُجاب في دقائق."],
    ["chart", "قراءة عادلة", "لا تُعرض النتائج قبل عدد كافٍ من المشاركين حتى لا تُبنى على رأي واحد."],
    ["hourglass", "قياس يتكرر", "قيمة القياس في مقارنة الجولات، لا في لقطة واحدة."],
  ];
  const ba = [
    ["الحكم على الجودة", "بالانطباع والمشاهدة العابرة", "بأدلة من أصحاب التجربة"],
    ["صوت المتعلم", "يُفترض ولا يُسمع", "يُسأل ويُقرأ رأيه"],
    ["ولي الأمر", "يُستدعى عند المشكلة", "يشارك بانتظام في تقييم الأثر"],
    ["قرارات التطوير", "حسب الاجتهاد", "حسب ما أثبت القياس"],
    ["التحسين", "مرة في نهاية العام", "دورة متكررة تُقارن بسابقتها"],
    ["الثقة", "غموض حول ما أُنجز", "شفافية في النتائج والتوصيات"],
  ];
  const faq = [
    ["ما الفرق بين قياس الأثر وقياس الرضا؟", "الرضا يسأل: هل أعجبك؟ والأثر يسأل: ماذا تغيّر في تعلمك أو ممارستك أو تجربتك بسبب ما قُدّم؟ الرضا مدخل مفيد، لكنه لا يكفي وحده."],
    ["لماذا نسأل المتعلم وولي الأمر لا المعلمين فقط؟", "لأن من يعيش العملية التعليمية هو الأقدر على وصف ما وصله منها، وكل فئة ترى زاوية لا تراها الأخرى."],
    ["هل يعني قياس الأثر تقييم المعلم؟", "لا. هو يقيس أثر العملية والبيئة والقيادة لتحسينها، ولا يحل محل تقويم الأداء الوظيفي الرسمي."],
    ["متى يظهر الأثر؟", "بعضه يظهر سريعاً في الاتجاه والممارسة، وبعضه يحتاج وقتاً. لذلك يُعاد القياس على جولات ويُقارن."],
    ["ماذا يحدث بعد جمع الآراء؟", "تُحوَّل إلى قراءة بالنتائج ونقاط القوة وفرص التحسين، ثم إلى توصيات مرتبة تتابعها القيادة، ثم يُعاد القياس."],
    ["كيف يطبّق «أثر» هذه الفكرة؟", "عبر استبانات قصيرة لكل فئة، تُحلَّل في دراسة إلكترونية وتوصيات، ويُعاد القياس بجولات جديدة."],
  ];

  const R = 150, cx = 200, cy = 200;
  const nodes = flow.map((f, k) => { const a = (-90 + k * 72) * Math.PI / 180; return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), f, k }; });
  const cycle = `<div class="ah-cyc ah-rv" data-rv="zoom"><svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="ahg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0f8a94"/><stop offset="1" stop-color="#f0a530"/></linearGradient><marker id="aha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#0f8a94"/></marker></defs>
    <circle cx="200" cy="200" r="${R}" class="ah-ring"/><circle cx="200" cy="200" r="${R}" class="ah-ring2"/>
    ${nodes.map((n, k) => { const m = nodes[(k + 1) % 5], a1 = Math.atan2(n.y - cy, n.x - cx) + .24, a2 = Math.atan2(m.y - cy, m.x - cx) - .24; const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)]; return `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${R} ${R} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" class="ah-arc" style="--d:${k * .35}s" marker-end="url(#aha)"/>`; }).join("")}
    <circle cx="200" cy="200" r="70" fill="url(#ahg)" class="ah-core"/></svg><div class="ah-core-t"><b>الأثر</b><small>من القياس إلى القرار</small></div>
    ${nodes.map((n) => `<div class="ah-node" style="left:${n.x / 4}%;top:${n.y / 4}%;--d:${n.k * .12}s"><i>${I(n.f[0])}</i><b>${n.k + 1}. ${n.f[1]}</b></div>`).join("")}</div>`;
  const flowList = `<ol class="ah-fl">${flow.map(([i, t, d], k) => `<li class="ah-rv" data-rv="left" style="--d:${k * .08}s"><span>${k + 1}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ol>`;
  const hub = `<div class="ah-hub ah-rv" data-rv="zoom"><svg viewBox="0 0 400 400" aria-hidden="true">${who.map((w, k) => { const a = (-90 + k * 72) * Math.PI / 180; return `<line x1="200" y1="200" x2="${(200 + 150 * Math.cos(a)).toFixed(1)}" y2="${(200 + 150 * Math.sin(a)).toFixed(1)}" class="ah-spoke" style="--d:${k * .12}s"/>`; }).join("")}<circle cx="200" cy="200" r="150" class="ah-orb"/><circle cx="200" cy="200" r="98" class="ah-orb o2"/></svg>
    <div class="ah-hub-c">${I("chart")}<b>أثر التعليم</b></div>
    ${who.map((w, k) => { const a = (-90 + k * 72) * Math.PI / 180; return `<div class="ah-hn" style="left:${(50 + 37.5 * Math.cos(a)).toFixed(2)}%;top:${(50 + 37.5 * Math.sin(a)).toFixed(2)}%;--d:${.2 + k * .12}s"><i>${I(w[0])}</i><b>${w[1]}</b><small>${w[2]}</small></div>`; }).join("")}</div>`;

  const toc = [["what", "ما قياس الأثر؟"], ["why", "لماذا نقيس؟"], ["goals", "الأهداف"], ["chain", "سلسلة الأثر"], ["effects", "آثاره على المنظومة"], ["who", "أصحاب الأثر"], ["flow", "من القياس إلى القرار"], ["princ", "مبادئ القياس"], ["ba", "قبل وبعد"], ["faq", "أسئلة متوقعة"]];
  const S = (id, body, cls = "") => `<section class="ahb-s ah-s ${cls}" id="ahb-${id}">${body}</section>`;

  return `<div class="ahb ah"><div class="ahb-toc" role="navigation" aria-label="أقسام الصفحة">${toc.map(([id, t]) => `<button type="button" data-abgo="${id}">${t}</button>`).join("")}</div>
  ${S("what", `<div class="ah-what"><div class="ah-rv" data-rv="up"><small class="ah-kick">المفهوم</small><h2>ما «قياس الأثر»؟</h2><p>قياس الأثر هو السؤال عمّا <b>تغيّر فعلاً</b> بسبب ما نقدّمه في المدرسة. لا يكتفي بعدّ الأنشطة والحضور، بل يسأل <b>المتعلم</b> و<b>المعلم</b> و<b>ولي الأمر</b> و<b>القيادة المدرسية</b> و<b>الجهة المشرفة</b>: هل وصلكم الأثر؟ وكيف تعيشونه؟ وماذا ينبغي أن يتحسّن؟</p></div>
  <div class="ah-eq ah-rv" data-rv="up" style="--d:.15s">${[["edit", "جهد يُبذل"], ["users", "تجربة تُعاش"], ["chart", "دليل يُقاس"]].map(([i, t], k) => `<span class="ah-eqi"><i>${I(i)}</i><b>${t}</b></span>${k < 2 ? "<em>+</em>" : ""}`).join("")}<em>=</em><span class="ah-eqi res"><i>${I("star")}</i><b>أثر معروف</b></span></div></div>`)}
  ${S("why", SH("01", "لماذا نقيس الأثر؟", "لأن الجهد الكبير لا يعني بالضرورة أثراً كبيراً، ولا يُعرف الفرق إلا بالسؤال.", "الحاجة") + `<div class="ah-ps">${pains.map((p, k) => `<div class="ah-pr ah-rv" data-rv="up" style="--d:${k * .08}s"><div class="ah-p"><i>${I(p[0])}</i><div><b>${p[1]}</b><p>${p[2]}</p></div></div><span class="ah-arr">${I("swap")}</span><div class="ah-c"><i>${I(cures[k][0])}</i><div><b>${cures[k][1]}</b><p>${cures[k][2]}</p></div></div></div>`).join("")}</div><div class="ah-ps-h" aria-hidden="true"><span>إدارة بالمُنجَز</span><span>إدارة بالأثر</span></div>`)}
  ${S("goals", SH("02", "أهداف قياس الأثر", "ما نريد الوصول إليه حين نقيس أثر العملية التعليمية.", "الغاية") + `<div class="ah-bento">${goals.map(([i, t, d], k) => `<div class="ah-bt ${k === 0 ? "w2" : k === 5 ? "w2 acc" : ""} ah-rv" data-rv="up" style="--d:${(k % 4) * .07}s"><i>${I(i)}</i><b>${t}</b><p>${d}</p><span class="ah-glow2" aria-hidden="true"></span></div>`).join("")}</div>`)}
  ${S("chain", SH("03", "سلسلة الأثر", "الأثر آخر حلقة في سلسلة تبدأ بالنشاط، وكلما ابتعدنا عن النشاط اقتربنا من الأثر الحقيقي.", "من النشاط إلى الأثر") + `<div class="ah-arch"><div class="ah-wire" aria-hidden="true"><span></span><i></i><i style="--o:1.3s"></i><i style="--o:2.6s"></i></div>${chain.map(([i, t, r, d, ch], k) => `<div class="ah-nd ah-rv" data-rv="up" style="--d:${k * .12}s"><span class="ah-ndi"><i>${I(i)}</i><em>${k + 1}</em></span><small>${r}</small><b>${t}</b><p>${d}</p><div class="ah-chips">${ch.map((c) => `<span>${c}</span>`).join("")}</div></div>`).join("")}</div>
  <div class="ah-note ah-rv" data-rv="up">${I("info")}<p>كثير من التقارير تتوقف عند المخرج، أما قياس الأثر فيكمل الطريق إلى النتيجة والأثر.</p></div>`)}
  ${S("effects", SH("04", "آثاره على المنظومة التعليمية", "حين يصبح قياس الأثر عادة مؤسسية، يتغير موقع كل طرف في العملية التعليمية.", "ماذا يتغير؟") + `<div class="ah-bento">${effects.map(([i, t, d, c], k) => `<div class="ah-bt ${c} ah-rv" data-rv="up" style="--d:${(k % 4) * .07}s"><i>${I(i)}</i><b>${t}</b><p>${d}</p><span class="ah-glow2" aria-hidden="true"></span></div>`).join("")}</div>`)}
  ${S("who", SH("05", "أصحاب الأثر", "خمس فئات تصنع الأثر وتتأثر به، فكل واحدة تملك جزءاً من الحقيقة.", "من؟") + `<div class="ah-whow">${hub}<ul class="ah-wl">${who.map((w, k) => `<li class="ah-rv" data-rv="left" style="--d:${k * .07}s"><i>${I(w[0])}</i><b>${w[1]}</b><span>${w[2]}</span></li>`).join("")}</ul></div>`)}
  ${S("flow", SH("06", "من القياس إلى القرار", "القياس لا ينتهي بتقرير؛ بل يبدأ دورة تحسين تتكرر.", "كيف نستفيد؟") + `<div class="ah-flow">${cycle}${flowList}</div>`)}
  ${S("princ", SH("07", "مبادئ القياس الجيد", "ما يجعل نتائج الأثر موثوقة ومقبولة عند الجميع.", "الضوابط") + `<div class="ah-jt">${principles.map(([i, t, d], k) => `<div class="ah-jc ah-rv" data-rv="${k % 2 ? "left" : "right"}" style="--d:${k * .05}s"><i>${I(i)}</i><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div>`)}
  ${S("ba", SH("08", "قبل قياس الأثر وبعده", "الفرق الذي يُحدثه الانتقال من الافتراض إلى المعرفة.", "التحول") + `<div class="ah-ba"><div class="ah-bah"><span></span><span class="b">${I("x")} قبل القياس</span><span class="a">${I("check")} مع القياس</span></div>${ba.map(([a, b, c], k) => `<div class="ah-bar2 ah-rv" data-rv="up" style="--d:${k * .06}s"><b>${a}</b><span class="b">${b}</span><span class="ah-sw" aria-hidden="true">${I("swap")}</span><span class="a">${c}</span></div>`).join("")}</div>`)}
  ${S("faq", SH("09", "أسئلة متوقعة", "إجابات مختصرة عن فكرة قياس الأثر.", "استفسارات") + `<div class="ahb-faq">${faq.map(([q, a], k) => `<details class="ah-rv" data-rv="up" style="--d:${(k % 2) * .08}s"${k ? "" : " open"}><summary>${I("help")}<b>${q}</b></summary><p>${a}</p></details>`).join("")}</div>
  <div class="ah-cta ah-rv" data-rv="zoom"><div><b>${me ? "شارك في قياس الأثر" : "كن جزءاً من قياس الأثر"}</b><p>${me ? "استباناتك المطلوبة ودراساتك المعتمدة في مكتبك الإلكتروني." : "سجّل دخولك بحساب النواة لتعبئة استباناتك والاطلاع على دراساتك، أو عرّف بنظام أثر."}</p></div><div class="ah-cta-a"><a class="btn" href="${me ? "dashboard.html" : "login.html"}">${me ? "فتح لوحة التحكم" : "دخول المنسوبين"}</a><a class="btn ghost" href="about.html">عن نظام أثر</a></div></div>`)}</div>`;
}

/* تفاعل: أزرار الفهرس، ظهور متدرّج، فهرس يتبع القسم، ميل ثلاثي الأبعاد */
function homeInit(v) {
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
