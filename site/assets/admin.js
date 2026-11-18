// لوحة الإدارة: عمليات وطوابير. الإظهار بحسب الصلاحية للتجربة فقط؛ التحقق الفعلي في دوال الخادم وقاعدة البيانات.
(async () => {
  if (!(await A.guard("admin.html", ["staff"]))) return;
  const { esc, rpc, $, fmt, can, badge, msg, toast, sb } = A, me = A.state.me;
  if (me.status !== "active") { $("#app").innerHTML = A.statusScreen(me); return; }
  const TABS = [["surveys","الاستبانات","surveys:manage"],["studies","الدراسات والتقارير","surveys:manage"],["accounts","حسابات المنسوبين","accounts:view"],
    ["roles","الأدوار والصلاحيات","roles:manage"],["audit","سجل العمليات","audit:view"],["settings","الإعدادات والتكامل","settings:manage"]].filter(t => can(t[2]) || (t[0] === "settings" && can("integration:view")));
  if (!TABS.length) { $("#app").innerHTML = '<div class="alert bad">ليست لديك صلاحيات إدارية.</div>'; return; }
  const AUD = { student: "المتعلم", teacher: "المعلم", administrative: "الهيئة الإدارية", supervisor: "الجهة المشرفة", parent: "ولي الأمر" };
  const ROLE_AR = {}; me.roles.forEach(r => ROLE_AR[r.code] = r.name_ar);
  let cur = TABS.find(t => "#" + t[0] === location.hash) ? location.hash.slice(1) : TABS[0][0];
  const act = async (fn, ok) => { try { await fn(); toast(ok || "تم"); return true; } catch (x) { toast(msg(x), true); return false; } };
  const modal = (html) => { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="md">${html}</div>`; o.onclick = (e) => { if (e.target === o) o.remove(); }; document.body.appendChild(o); return o; };
  const ask = (t) => prompt(t) ;

  function shell() {
    $("#app").innerHTML = `<div class="tabs">${TABS.map(t => `<button data-t="${t[0]}" class="${t[0] === cur ? "on" : ""}">${t[1]}</button>`).join("")}</div><div id="pane"><div class="empty"><span class="spin"></span></div></div>`;
    document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { cur = b.dataset.t; location.hash = cur; shell(); load(); });
  }
  const rowAcct = (a, extra) => `<tr><td><b>${esc(a.display_name)}</b><div class="hint" dir="ltr" style="text-align:right">${esc(a.login_id)}</div></td><td>${A.TYPE_AR[a.user_type]}</td><td>${badge(a.status)}</td><td>${esc((a.roles || []).map(r => ROLE_AR[r] || r).join("، "))}</td><td>${fmt(a.created_at)}</td><td class="acts">${extra}</td></tr>`;
  const table = (heads, rows) => `<div class="tw"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}" class="empty">لا توجد سجلات.</td></tr>`}</tbody></table></div>`;

  const V = {
    async accounts() { $("#pane").innerHTML = `<div class="bar"><input id="q" placeholder="بحث بالاسم أو المعرّف"><select id="st"><option value="">كل الحالات</option><option value="active">مفعّل</option><option value="pending">بانتظار الاعتماد</option><option value="suspended">موقوف</option><option value="rejected">مرفوض</option></select></div><div id="lst"></div>`;
      const go = async () => { const r = await rpc("admin_accounts", { p_status: $("#st").value || null, p_type: "staff", p_q: $("#q").value, p_limit: 50 });
        $("#lst").innerHTML = `<p class="hint">${r.total} حساب</p>` + table(["الاسم", "النوع", "الحالة", "الأدوار", "تاريخ الإنشاء", "إجراءات"], r.rows.map(a => rowAcct(a,
          `${a.id !== me.id && can("accounts:manage") ? (a.status === "active" ? `<button class="btn sm bad" data-s="suspended" data-id="${a.id}">إيقاف</button>` : a.status === "suspended" ? `<button class="btn sm" data-s="active" data-id="${a.id}">تفعيل</button>` : "") : ""}
           ${a.id !== me.id && can("roles:manage") ? `<button class="btn sm sec" data-r="${a.id}">الأدوار</button>` : ""}`)).join(""));
        document.querySelectorAll("[data-s]").forEach(b => b.onclick = async () => { const note = ask("ملاحظة (اختياري)"); if (note === null) return; if (await act(() => rpc("admin_set_status", { p_account: b.dataset.id, p_status: b.dataset.s, p_note: note }))) go(); });
        document.querySelectorAll("[data-r]").forEach(b => b.onclick = () => rolesModal(r.rows.find(x => x.id === b.dataset.r), go)); };
      ["q", "st"].forEach(i => $("#" + i).oninput = go); go(); },
    async surveys() { const L = await rpc("admin_surveys"), ST = { draft: ["مسودة", ""], open: ["مفتوحة", "ok"], closed: ["مغلقة", "info"] }, base = location.href.replace(/[^/]*$/, "") + "form.html?t=";
      const PUB = ["student", "parent", "supervisor"];
      $("#pane").innerHTML = `<div class="bar"><button class="btn" id="ns">استبانة جديدة</button></div><p class="hint">لكل فئة استبانة بحد أقصى 10 أسئلة. المعلمون والهيئة الإدارية يعبّئون بحساب النواة، أما المتعلم وولي الأمر والجهة المشرفة فبرابط مباشر بلا دخول. بعد الإغلاق تُنشأ الدراسة.</p>` +
        Object.keys(AUD).map(a => { const rows = L.filter(x => x.audience === a); return `<h3 class="sec">${AUD[a]}</h3>` + table(["العنوان", "الحالة", "الأسئلة", "الاستجابات", "الدراسة", ""], rows.map(x => `<tr><td><b>${esc(x.title)}</b></td><td><span class="badge ${ST[x.status][1]}">${ST[x.status][0]}</span></td><td>${x.questions}</td><td>${x.responses}</td><td>${x.study_id ? (x.study_status === "approved" ? '<span class="badge ok">معتمدة</span>' : '<span class="badge warn">مسودة</span>') : "—"}</td>
          <td class="acts">${x.status === "draft" ? `<button class="btn sm sec" data-e="${x.id}">تعديل</button><button class="btn sm" data-o="${x.id}">فتح للتعبئة</button><button class="btn sm bad" data-x="${x.id}">حذف</button>` : ""}${x.status === "open" && x.token && PUB.includes(a) ? `<button class="btn sm sec" data-l="${x.token}">نسخ الرابط</button>` : ""}${x.status === "open" ? `<button class="btn sm bad" data-c="${x.id}">إغلاق</button>` : ""}${x.status !== "draft" ? `<a class="btn sm sec" href="survey-results.html?id=${x.id}">النتائج</a>` : ""}${x.status === "closed" && x.study_status !== "approved" ? `<button class="btn sm" data-g="${x.id}">إنشاء الدراسة</button>` : ""}${x.study_id ? `<a class="btn sm sec" href="study.html?id=${x.study_id}">الدراسة</a>` : ""}${PUB.includes(a) && x.status !== "draft" ? `<button class="btn sm sec" data-r="${x.id}">بيانات المشاركين</button>` : ""}</td></tr>`).join("")); }).join("");
      $("#ns").onclick = () => builder(null);
      document.querySelectorAll("[data-e]").forEach(b => b.onclick = () => builder(b.dataset.e));
      document.querySelectorAll("[data-o]").forEach(b => b.onclick = async () => { if (confirm("تُفتح الاستبانة ويُشعَر المعنيون من المنسوبين. متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.o, p_status: "open" }), "فُتحت الاستبانة")) load(); });
      document.querySelectorAll("[data-c]").forEach(b => b.onclick = async () => { if (confirm("بعد الإغلاق لا تقبل إجابات. متابعة؟") && await act(() => rpc("admin_set_survey_status", { p_id: b.dataset.c, p_status: "closed" }), "أُغلقت الاستبانة")) load(); });
      document.querySelectorAll("[data-x]").forEach(b => b.onclick = async () => { if (confirm("حذف المسودة نهائياً؟") && await act(() => rpc("admin_delete_survey", { p_id: b.dataset.x }))) load(); });
      document.querySelectorAll("[data-l]").forEach(b => b.onclick = async () => { const u = base + b.dataset.l; try { await navigator.clipboard.writeText(u); toast("نُسخ الرابط"); } catch (_) { prompt("انسخ الرابط", u); } });
      document.querySelectorAll("[data-g]").forEach(b => b.onclick = async () => { try { const id = await rpc("admin_generate_study", { p_survey: b.dataset.g }); location.href = "study.html?id=" + id; } catch (x) { toast(msg(x), true); } });
      document.querySelectorAll("[data-r]").forEach(b => b.onclick = async () => { try { const r = await rpc("admin_respondents", { p_id: b.dataset.r });
        const o = modal(`<h3>بيانات المشاركين الاختيارية</h3><p class="hint">${r.total} مشاركاً، منهم ${r.with_contact.length} أدخلوا بيانات تواصل.</p>${table(["الاسم", "البريد", "الجوال"], r.with_contact.map(c => `<tr><td>${esc(c.name || "—")}</td><td dir="ltr">${esc(c.email || "—")}</td><td dir="ltr">${esc(c.phone || "—")}</td></tr>`).join(""))}<div class="acts mt"><button class="btn sec" id="cx">إغلاق</button></div>`);
        o.querySelector("#cx").onclick = () => o.remove(); } catch (x) { toast(msg(x), true); } }); },
    async studies() { const L = await rpc("admin_studies");
      $("#pane").innerHTML = `<p class="hint">تُنشأ الدراسة من استبانة مغلقة، وتُراجع توصياتها قبل الاعتماد. بعد الاعتماد تظهر للمنسوبين الذين شاركوا فيها.</p>` + table(["الاستبانة", "الفئة", "المشاركون", "المتوسط", "المستوى", "الحالة", ""], L.map(x => `<tr><td><b>${esc(x.title)}</b></td><td>${AUD[x.audience]}</td><td>${x.participants}</td><td>${x.overall_mean ?? "—"}</td><td>${esc(x.level)}</td><td>${x.status === "approved" ? '<span class="badge ok">معتمدة</span>' : '<span class="badge warn">مسودة</span>'}</td><td class="acts"><a class="btn sm sec" href="study.html?id=${x.id}">فتح</a>${x.status === "draft" ? `<button class="btn sm sec" data-n="${x.id}">تحرير</button><button class="btn sm" data-a="${x.id}">اعتماد</button>` : ""}</td></tr>`).join(""));
      document.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { if (confirm("بعد الاعتماد تظهر الدراسة للمشاركين من المنسوبين ولا تُعدَّل. متابعة؟") && await act(() => rpc("admin_approve_study", { p_id: b.dataset.a }), "اعتُمدت الدراسة")) load(); });
      document.querySelectorAll("[data-n]").forEach(b => b.onclick = async () => { const st = await rpc("study_get", { p_id: b.dataset.n });
        const o = modal(`<h3>تحرير الدراسة</h3><label for="sn">ملخص الدراسة (يظهر في التقرير)</label><textarea id="sn" rows="4" maxlength="4000">${esc(st.note || "")}</textarea><label for="sr">التوصيات (توصية في كل سطر، ولا تتجاوز 600 حرف)</label><textarea id="sr" rows="8">${esc(st.recommendations.map(x => x.text).join("\n"))}</textarea><p class="err" id="em"></p><div class="acts mt"><button class="btn" id="sv">حفظ</button><button class="btn sec" id="cx">إلغاء</button></div>`);
        o.querySelector("#cx").onclick = () => o.remove();
        o.querySelector("#sv").onclick = async () => { const prev = st.recommendations, lines = o.querySelector("#sr").value.split("\n").map(x => x.trim()).filter(Boolean);
          const recs = lines.map((t, i) => { const m = prev.find(p => p.text === t); return m || { priority: "متابعة", text: t, basis: "أضافتها الإدارة" }; });
          if (await act(() => rpc("admin_update_study", { p_id: st.id, p_note: o.querySelector("#sn").value, p_recommendations: recs }), "حُفظت")) { o.remove(); load(); } }; }); },
    async roles() { const R = await rpc("admin_roles"), P = R.permissions;
      $("#pane").innerHTML = `<p class="hint">الأدوار الأساسية لا تُحذف. لا يمكنك منح صلاحية لا تملكها.</p>` + R.roles.map(r => `<div class="item"><div class="row2"><div><b>${esc(r.name_ar)}</b> <small class="hint" dir="ltr">${esc(r.code)}</small><div class="hint">النطاق: ${{ school: "المدرسة", linked: "المرتبطون", own: "بياناته فقط" }[r.data_scope]} · ${r.members} عضو</div></div>
        ${r.code !== "admin" ? `<button class="btn sm sec" data-e="${r.code}">تعديل الصلاحيات</button>` : '<span class="badge">كل الصلاحيات</span>'}</div><div style="margin-top:6px">${r.permissions.map(p => `<span class="badge info">${esc((P.find(x => x.code === p) || {}).name_ar || p)}</span>`).join(" ") || '<small class="hint">بلا صلاحيات إدارية</small>'}</div></div>`).join("");
      document.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { const r = R.roles.find(x => x.code === b.dataset.e);
        const o = modal(`<h3>${esc(r.name_ar)}</h3>${P.map(p => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:auto" value="${p.code}" ${r.permissions.includes(p.code) ? "checked" : ""} ${can(p.code) ? "" : "disabled"}>${esc(p.name_ar)}</label>`).join("")}<div class="acts mt"><button class="btn" id="sv">حفظ</button><button class="btn sec" id="cx">إلغاء</button></div>`);
        $("#cx").onclick = () => o.remove(); $("#sv").onclick = async () => { const perms = [...o.querySelectorAll("input:checked")].map(i => i.value); if (await act(() => rpc("admin_save_role", { p_code: r.code, p_name: r.name_ar, p_scope: r.data_scope, p_user_type: r.user_type || "", p_perms: perms }))) { o.remove(); load(); } }; }); },
    async audit() { $("#pane").innerHTML = `<div class="bar"><input id="q" placeholder="بحث في العمليات"></div><div id="lst"></div>`;
      const go = async () => { const L = await rpc("admin_audit", { p_q: $("#q").value, p_limit: 100 });
        $("#lst").innerHTML = table(["الوقت", "المنفّذ", "العملية", "الكيان", "قبل", "بعد"], L.map(l => `<tr><td>${fmt(l.created_at)}</td><td dir="ltr" style="text-align:right">${esc(l.actor_login || "—")}</td><td>${esc(l.action)}</td><td>${esc(l.entity || "")}</td><td class="hint">${esc(l.before ? JSON.stringify(l.before) : "")}</td><td class="hint">${esc(l.after ? JSON.stringify(l.after) : "")}</td></tr>`).join("")); };
      $("#q").oninput = go; go(); },
    async settings() { let h = "";
      if (can("integration:view")) { const c = await rpc("core_status");
        h += `<h3 class="sec">التكامل مع النواة الرقمية</h3><div class="card"><div class="fg"><div><small class="hint">الوضع</small><div><span class="badge info">${c.mode === "api" ? "واجهة API (غير مفعّلة)" : "قراءة مباشرة من قاعدة النواة (للقراءة فقط)"}</span></div></div>
          <div><small class="hint">آخر تحقق ناجح</small><div>${fmt(c.last_ok_at)}</div></div><div><small class="hint">منسوبون مرتبطون</small><div>${c.linked_staff}</div></div></div>${c.last_error ? `<div class="alert bad mt">${esc(c.last_error)}</div>` : ""}</div>`; }
      if (can("settings:manage")) { const S = await rpc("admin_settings");
        h += `<h3 class="sec">إعدادات النظام</h3>` + S.map(s => `<div class="item"><div class="row2"><div><b>${esc(s.description || s.key)}</b><div class="hint" dir="ltr" style="text-align:right">${esc(s.key)}</div></div>
          ${typeof s.value === "boolean" ? `<input type="checkbox" style="width:auto" data-k="${s.key}" ${s.value ? "checked" : ""}>` : `<input ${typeof s.value === "string" ? 'type="text" dir="ltr" style="width:170px"' : 'type="number" style="width:90px"'} data-k="${s.key}" value="${esc(s.value)}">`}</div></div>`).join(""); }
      $("#pane").innerHTML = h;
      document.querySelectorAll("[data-k]").forEach(i => i.onchange = async () => { const v = i.type === "checkbox" ? i.checked : i.type === "text" ? i.value.trim() : Number(i.value); if (!(await act(() => rpc("admin_set_setting", { p_key: i.dataset.k, p_value: v })))) load(); }); },
  };
  async function builder(id) {
    const cur = id ? await rpc("admin_get_survey", { p_id: id }) : { title: "", description: "", audience: "teacher", required: true, closes_at: null, target_count: null, questions: [{ kind: "scale", domain: "process", prompt: "", required: true }] };
    const Q = cur.questions.map(q => ({ ...q, options: q.options || [] }));
    const DOM = { process: "العملية التربوية", environment: "البيئة المدرسية", leadership: "الإدارة والقيادة" };
    const o = modal(`<h3>${id ? "تعديل الاستبانة" : "استبانة جديدة"}</h3><label for="sa">الفئة المستهدفة</label><select id="sa">${Object.keys(AUD).map(k => `<option value="${k}" ${cur.audience === k ? "selected" : ""}>${AUD[k]}</option>`).join("")}</select>
      <label for="st">العنوان</label><input id="st" maxlength="160" value="${esc(cur.title)}"><label for="sd">وصف (اختياري)</label><textarea id="sd" maxlength="1000">${esc(cur.description || "")}</textarea>
      <div class="fg"><div><label for="sc">آخر موعد (اختياري)</label><input id="sc" type="date" value="${cur.closes_at ? cur.closes_at.slice(0, 10) : ""}"></div><div><label for="sg">العدد المستهدف (للروابط العامة)</label><input id="sg" type="number" min="1" value="${cur.target_count || ""}"></div><div><label class="lgchk" for="sr"><input id="sr" type="checkbox" ${cur.required ? "checked" : ""}><span>مطلوبة من المنسوبين</span></label></div></div>
      <p class="hint">بحد أقصى 10 أسئلة. نص التوصية يظهر في الدراسة إذا ضعف متوسط السؤال.</p>
      <div id="qs"></div><div class="acts"><button class="btn sm sec" data-a="scale">+ سؤال مقياس (1-5)</button><button class="btn sm sec" data-a="choice">+ سؤال اختيار</button><button class="btn sm sec" data-a="text">+ سؤال نصي</button></div>
      <p class="err" id="em"></p><div class="acts mt"><button class="btn" id="sv">حفظ كمسودة</button><button class="btn sec" id="cx">إلغاء</button></div>`);
    const KIND = { scale: "مقياس 1-5", choice: "اختيار", text: "نصي" };
    const draw = () => { o.querySelector("#qs").innerHTML = Q.map((q, i) => `<div class="qcard"><div class="row2"><b>${i + 1}. ${KIND[q.kind]}</b><button class="btn sm bad" data-d="${i}">حذف</button></div>
      <input data-p="${i}" maxlength="300" placeholder="نص السؤال" value="${esc(q.prompt)}"><select data-dm="${i}">${Object.keys(DOM).map(k => `<option value="${k}" ${q.domain === k ? "selected" : ""}>${DOM[k]}</option>`).join("")}</select>
      ${q.kind === "choice" ? `<textarea data-op="${i}" rows="3" placeholder="خيار في كل سطر (2 إلى 8)">${esc(q.options.join("\n"))}</textarea>` : ""}
      ${q.kind === "scale" ? `<input data-rc="${i}" maxlength="600" placeholder="توصية عند ضعف النتيجة (اختياري)" value="${esc(q.recommendation || "")}"><input data-sg="${i}" maxlength="600" placeholder="عبارة قوة عند ارتفاع النتيجة (اختياري)" value="${esc(q.strength || "")}">` : ""}
      <label class="lgchk"><input type="checkbox" data-r="${i}" ${q.required ? "checked" : ""}><span>إجابته مطلوبة</span></label></div>`).join("");
      o.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { sync(); Q.splice(+b.dataset.d, 1); draw(); }); };
    const sync = () => { o.querySelectorAll("[data-p]").forEach(e => Q[+e.dataset.p].prompt = e.value); o.querySelectorAll("[data-dm]").forEach(e => Q[+e.dataset.dm].domain = e.value); o.querySelectorAll("[data-rc]").forEach(e => Q[+e.dataset.rc].recommendation = e.value); o.querySelectorAll("[data-sg]").forEach(e => Q[+e.dataset.sg].strength = e.value);
      o.querySelectorAll("[data-op]").forEach(e => Q[+e.dataset.op].options = e.value.split("\n").map(x => x.trim()).filter(Boolean)); o.querySelectorAll("[data-r]").forEach(e => Q[+e.dataset.r].required = e.checked); };
    draw();
    o.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { sync(); if (Q.length >= 10) { o.querySelector("#em").textContent = "الحد الأقصى 10 أسئلة."; return; } Q.push({ kind: b.dataset.a, domain: "process", prompt: "", options: [], required: true }); draw(); });
    o.querySelector("#cx").onclick = () => o.remove();
    o.querySelector("#sv").onclick = async () => { sync(); const m = o.querySelector("#em"); m.textContent = "";
      if (!Q.length || Q.some(q => q.prompt.trim().length < 3 || (q.kind === "choice" && (q.options.length < 2 || q.options.length > 8)))) { m.textContent = "أضف سؤالاً على الأقل، وأكمل نص كل سؤال، وللاختيار من 2 إلى 8 خيارات."; return; }
      const d = o.querySelector("#sc").value, g = o.querySelector("#sg").value;
      if (await act(() => rpc("admin_save_survey", { p_id: id, p_title: o.querySelector("#st").value, p_description: o.querySelector("#sd").value, p_audience: o.querySelector("#sa").value, p_required: o.querySelector("#sr").checked, p_closes: d ? new Date(d + "T23:59:59").toISOString() : null, p_target: g ? Number(g) : null,
        p_questions: Q.map(q => ({ kind: q.kind, domain: q.domain, prompt: q.prompt, options: q.kind === "choice" ? q.options : null, required: q.required, recommendation: q.kind === "scale" ? q.recommendation || null : null, strength: q.kind === "scale" ? q.strength || null : null })) }), "حُفظت")) { o.remove(); load(); } };
  }
  async function rolesModal(a, done) { const R = await rpc("admin_roles"), cand = R.roles.filter(r => !r.user_type || r.user_type === a.user_type);
    const o = modal(`<h3>أدوار ${esc(a.display_name)}</h3>${cand.map(r => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:auto" value="${r.code}" ${a.roles.includes(r.code) ? "checked" : ""}>${esc(r.name_ar)}</label>`).join("")}<div class="acts mt"><button class="btn" id="sv">حفظ</button><button class="btn sec" id="cx">إلغاء</button></div>`);
    o.querySelector("#cx").onclick = () => o.remove();
    o.querySelector("#sv").onclick = async () => { const roles = [...o.querySelectorAll("input:checked")].map(i => i.value); if (await act(() => rpc("admin_set_roles", { p_account: a.id, p_roles: roles }))) { o.remove(); done(); } }; }
  async function load() { try { await V[cur](); } catch (x) { $("#pane").innerHTML = `<div class="alert bad">${esc(msg(x))}</div>`; } }
  shell(); load();
})();
