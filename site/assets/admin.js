// لوحة الإدارة: عمليات وطوابير. الإظهار بحسب الصلاحية للتجربة فقط؛ التحقق الفعلي في دوال الخادم وقاعدة البيانات.
(async () => {
  if (!(await A.guard("admin.html", ["staff"]))) return;
  const { esc, rpc, $, fmt, can, badge, msg, toast, sb } = A, me = A.state.me;
  if (me.status !== "active") { $("#app").innerHTML = A.statusScreen(me); return; }
  const TABS = [["audit","سجل العمليات","audit:view"],["settings","الإعدادات والتكامل","settings:manage"]].filter(t => can(t[2]) || (t[0] === "settings" && can("integration:view")));
  if (!TABS.length) { $("#app").innerHTML = '<div class="alert bad">ليست لديك صلاحيات إدارية.</div>'; return; }
  const AUD = { student: "المتعلم", teacher: "المعلم", administrative: "الهيئة الإدارية", supervisor: "الجهة المشرفة", parent: "ولي الأمر" };
  const ROLE_AR = {}; me.roles.forEach(r => ROLE_AR[r.code] = r.name_ar);
  let cur = TABS.find(t => "#" + t[0] === location.hash) ? location.hash.slice(1) : TABS[0][0];
  const act = async (fn, ok) => { try { await fn(); toast(ok || "تم"); return true; } catch (x) { toast(msg(x), true); return false; } };
  const modal = (html) => { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="md">${html}</div>`; o.onclick = (e) => { if (e.target === o) o.remove(); }; modalX(o.firstChild, () => o.remove()); document.body.appendChild(o); return o; };
  const ask = (t) => prompt(t) ;

  function shell() {
    $("#app").innerHTML = `<div class="tabs">${TABS.map(t => `<button data-t="${t[0]}" class="${t[0] === cur ? "on" : ""}">${t[1]}</button>`).join("")}</div><div id="pane"><div class="empty"><span class="spin"></span></div></div>`;
    document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { cur = b.dataset.t; location.hash = cur; shell(); load(); });
  }
  const rowAcct = (a, extra) => `<tr><td><b>${esc(a.display_name)}</b><div class="hint" dir="ltr" style="text-align:right">${esc(a.login_id)}</div></td><td>${A.TYPE_AR[a.user_type]}</td><td>${badge(a.status)}</td><td>${esc((a.roles || []).map(r => ROLE_AR[r] || r).join("، "))}</td><td>${fmt(a.created_at)}</td><td class="acts">${extra}</td></tr>`;
  const table = (heads, rows) => `<div class="tw"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}" class="empty">لا توجد سجلات.</td></tr>`}</tbody></table></div>`;

  const V = {
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
  async function load() { try { await V[cur](); } catch (x) { $("#pane").innerHTML = `<div class="alert bad">${esc(msg(x))}</div>`; } }
  shell(); load();
})();
