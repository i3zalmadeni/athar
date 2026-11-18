// صفحة بوابة واحدة لكل فئة: دخول وتسجيل بنموذج خاص بالفئة، ومسارات مستقلة.
(async () => {
  const { $, esc, api, sb, rpc, msg } = A, portal = document.body.dataset.portal, [self, title] = A.PORTAL[portal];
  await A.loadMe(); await A.chrome(self);
  if (A.state.me && A.state.me.user_type === portal) { location.replace("dashboard.html"); return; }
  let info = {}; try { info = (await sb.rpc("athar_public_info")).data || {}; } catch (_) {}
  const minPw = info.min_password || 8;
  const pwHint = `${minPw} خانات على الأقل`;
  const LOGIN_FIELDS = `<label for="lid">معرّف الدخول</label><input id="lid" dir="ltr" autocomplete="username" autocapitalize="none" spellcheck="false" required>
    <label for="pw">كلمة المرور</label><input id="pw" type="password" autocomplete="current-password" required>`;
  const REG = {
    staff: `<div class="alert info">يُتحقق من هويتك عبر الرقم الوظيفي في النواة الرقمية ويُستمد اسمك منها. يُفعَّل حسابك بعد اعتماد الإدارة.</div>
      <label for="emp">الرقم الوظيفي</label><input id="emp" dir="ltr" required>`,
    student: `<div class="fg"><div class="full"><label for="fn">الاسم الكامل</label><input id="fn" required minlength="6" maxlength="100"></div>
      <div><label for="sno">رقم الطالب</label><input id="sno" dir="ltr" required pattern="[0-9A-Za-z\\-]{4,20}"></div>
      <div><label for="gr">الصف</label><select id="gr" required><option value="">اختر</option><option>الأول المتوسط</option><option>الثاني المتوسط</option><option>الثالث المتوسط</option></select></div>
      <div><label for="sec">الفصل (اختياري)</label><input id="sec" maxlength="20"></div><div><label for="bd">تاريخ الميلاد (اختياري)</label><input id="bd" type="date"></div></div>`,
    parent: `<label for="fn">الاسم الكامل</label><input id="fn" required minlength="6" maxlength="100">
      <h3 class="sec">ربط بطالب (يمكن إضافته لاحقاً)</h3><div class="fg"><div><label for="sno">رقم الطالب</label><input id="sno" dir="ltr"></div>
      <div><label for="rel">صلة القرابة</label><select id="rel"><option value="father">أب</option><option value="mother">أم</option><option value="guardian">وصي</option><option value="brother">أخ</option><option value="other">أخرى</option></select></div></div>
      <p class="hint">لا تظهر بيانات الطالب إلا بعد أن تتحقق المدرسة من العلاقة.</p>`,
  }[portal];
  $("#app").innerHTML = `<div class="auth"><div class="card"><h2>${title}</h2><p class="sub">أثر · ${esc(A.C.schoolName)}</p>
    <div class="tabs"><button class="on" data-t="in">دخول</button><button data-t="reg">${portal === "staff" ? "تفعيل حساب" : "تسجيل جديد"}</button></div>
    <form id="fin">${LOGIN_FIELDS}<p class="err" id="m1" role="alert"></p><button class="btn block" id="go1">دخول</button></form>
    <form id="freg" hidden>${REG}<label for="rid">معرّف الدخول المطلوب</label><input id="rid" dir="ltr" required autocapitalize="none" spellcheck="false" autocomplete="username">
      <p class="hint">أحرف إنجليزية صغيرة وأرقام و . _ - (3 إلى 40 خانة)</p>
      <label for="rpw">كلمة المرور</label><input id="rpw" type="password" autocomplete="new-password" required minlength="${minPw}"><p class="hint">${pwHint}</p>
      <p class="err" id="m2" role="alert"></p><button class="btn block" id="go2">إرسال الطلب</button></form>
    <p class="hint mt"><a href="index.html#gates">العودة إلى البوابات</a></p></div></div>`;
  document.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#fin").hidden = b.dataset.t !== "in"; $("#freg").hidden = b.dataset.t !== "reg"; });
  async function enter(lid, pw, m) {
    const r = await api("login", { portal, login_id: lid, password: pw });
    const { error } = await sb.auth.setSession(r.session); if (error) throw error;
    if (r.status === "active") { try { await rpc("touch_login"); } catch (_) {} }
    location.replace("dashboard.html");
  }
  $("#fin").onsubmit = async (e) => { e.preventDefault(); const b = $("#go1"), m = $("#m1"); b.disabled = true; m.textContent = "";
    try { await enter($("#lid").value.trim().toLowerCase(), $("#pw").value, m); }
    catch (x) { b.disabled = false; m.textContent = x.error === "locked" ? `تجاوزت عدد المحاولات. حاول بعد ${Math.ceil((x.retry_after || 60) / 60)} دقيقة.` : msg(x); } };
  $("#freg").onsubmit = async (e) => { e.preventDefault(); const b = $("#go2"), m = $("#m2"); b.disabled = true; m.textContent = "";
    const body = { portal, login_id: $("#rid").value.trim().toLowerCase(), password: $("#rpw").value };
    if (portal === "staff") body.employee_no = $("#emp").value;
    else { body.full_name = $("#fn").value; if ($("#sno")) body.student_no = $("#sno").value; }
    if (portal === "student") { body.grade = $("#gr").value; body.section = $("#sec").value; body.birth_date = $("#bd").value; }
    if (portal === "parent") body.relation = $("#rel").value;
    try { const r = await api("register", body);
      if (r.status === "active") { await enter(body.login_id, body.password, m); return; }
      $("#freg").innerHTML = `<div class="alert ok"><b>تم استلام طلبك</b><div>حسابك بانتظار الاعتماد. استخدم معرّف الدخول وكلمة المرور التي أدخلتها بعد التفعيل.</div></div><button class="btn sec" onclick="location.reload()">رجوع</button>`;
    } catch (x) { b.disabled = false; m.textContent = x.error === "locked" ? "طلبات كثيرة من هذا الجهاز. حاول لاحقاً." : msg(x); } };
})();
