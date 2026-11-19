// إدارة الدراسات: نتائج الاستبانات الجارية والمغلقة، وإنشاء الدراسة وتحريرها واعتمادها.
(async () => {
  if (!(await A.guard("studies-admin.html", ["staff"]))) return;
  const { esc, rpc, $, fmt, can, msg, toast } = A;
const AUD = { student: "المتعلم", teacher: "المعلم", administrative: "الهيئة الإدارية", supervisor: "الجهة المشرفة", parent: "ولي الأمر" }, PUB = ["student", "parent", "supervisor"];
const act = async (fn, ok) => { try { await fn(); toast(ok || "تم"); return true; } catch (x) { toast(msg(x), true); return false; } };
const modal = (html) => { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="md">${html}</div>`; o.onclick = (e) => { if (e.target === o) o.remove(); }; modalX(o.firstChild, () => o.remove()); document.body.appendChild(o); return o; };
const table = (heads, rows) => `<div class="tw"><table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${heads.length}" class="empty">لا توجد سجلات.</td></tr>`}</tbody></table></div>`;
const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast("نُسخ"); } catch (_) { prompt("انسخ", t); } };
const dir = () => location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");

  if (!can("surveys:manage")) { $("#app").innerHTML = '<div class="alert bad">ليست لديك صلاحية إدارة الدراسات.</div>'; return; }
  const ST = { open: ["جارية", "ok"], closed: ["مغلقة", "info"] };
  async function load() {
    let O; try { O = await rpc("admin_study_overview"); } catch (x) { $("#app").innerHTML = `<div class="alert bad">${esc(msg(x))}</div>`; return; }
    const R = O.rows, ct = (f) => R.filter(f).length;
    $("#app").innerHTML = `<div class="grid"><div class="stat"><b>${ct((x) => x.status === "open")}</b><span>استبانات جارية</span></div><div class="stat"><b>${ct((x) => x.status === "closed")}</b><span>استبانات مغلقة</span></div><div class="stat"><b>${ct((x) => x.study_status === "draft")}</b><span>دراسات بانتظار الاعتماد</span></div><div class="stat"><b>${ct((x) => x.study_status === "approved")}</b><span>دراسات معتمدة</span></div></div>
      <p class="hint">لكل استبانة جارية دراسة مسودة تظهر لمنسق أثر ومدير النواة بنتائج حية ورسوم بيانية. تُغلق الاستبانة تلقائياً عند اكتمال العدد المستهدف، ثم تُعتمد الدراسة لتظهر للمنسوبين الذين شاركوا فيها.</p>` +
      table(["الاستبانة", "الفئة", "الحالة", "المشاركون", "التقدم نحو الهدف", "المتوسط من 4", "الدراسة", ""], R.map((x) => `<tr><td><b>${esc(x.title)}</b>${x.round > 1 ? `<div class="hint">الجولة ${x.round} · ${x.studies_count} تقارير</div>` : ""}</td><td>${AUD[x.audience]}</td><td><span class="badge ${ST[x.status][1]}">${ST[x.status][0]}</span></td><td>${x.participants}</td><td>${(x.target_count || x.eligible) ? `<div class="prog" style="min-width:80px"><i style="width:${Math.min(100, Math.round(100 * x.participants / (x.target_count || x.eligible)))}%"></i></div><small class="hint">${Math.min(100, Math.round(100 * x.participants / (x.target_count || x.eligible)))}% من ${x.target_count || x.eligible}</small>` : "—"}</td><td>${x.mean ?? "—"}</td>
        <td>${x.study_id ? (x.study_status === "approved" ? '<span class="badge ok">معتمدة</span>' : '<span class="badge warn">مسودة</span>') : "—"}</td>
        <td class="acts"><a class="btn sm" href="survey-results.html?id=${x.id}">${x.status === "open" ? "النتائج الحية" : "فتح الدراسة"}</a>${x.study_status === "draft" ? `<button class="btn sm sec" data-n="${x.study_id}">تحرير</button>` : ""}${x.study_status === "draft" && x.status === "closed" ? `<button class="btn sm" data-a="${x.study_id}">اعتماد</button>` : ""}${x.status === "closed" ? `<a class="btn sm sec" href="surveys-admin.html">إعادة فتح</a>` : ""}</td></tr>`).join(""));
    document.querySelectorAll("[data-g]").forEach((b) => b.onclick = async () => { try { const id = await rpc("admin_generate_study", { p_survey: b.dataset.g }); location.href = "study.html?id=" + id; } catch (x) { toast(msg(x), true); } });
    document.querySelectorAll("[data-a]").forEach((b) => b.onclick = async () => { if (confirm("بعد الاعتماد تظهر الدراسة للمشاركين من المنسوبين ولا تُعدَّل. متابعة؟") && await act(() => rpc("admin_approve_study", { p_id: b.dataset.a }), "اعتُمدت الدراسة")) load(); });
    document.querySelectorAll("[data-n]").forEach((b) => b.onclick = async () => { const st = await rpc("study_get", { p_id: b.dataset.n });
      const o = modal(`<h3>تحرير الدراسة</h3><label for="sn">ملخص الدراسة (يظهر في التقرير)</label><textarea id="sn" rows="4" maxlength="4000">${esc(st.note || "")}</textarea><label for="sr">التوصيات (توصية في كل سطر، ولا تتجاوز 600 حرف)</label><textarea id="sr" rows="8">${esc(st.recommendations.map((x) => x.text).join("\n"))}</textarea><div class="acts mt"><button class="btn" id="sv">حفظ</button><button class="btn sec" id="cx">إلغاء</button></div>`);
      o.querySelector("#cx").onclick = () => o.remove();
      o.querySelector("#sv").onclick = async () => { const prev = st.recommendations, lines = o.querySelector("#sr").value.split("\n").map((x) => x.trim()).filter(Boolean);
        const recs = lines.map((t) => prev.find((p) => p.text === t) || { priority: "متابعة", text: t, basis: "أضافتها الإدارة" });
        if (await act(() => rpc("admin_update_study", { p_id: st.id, p_note: o.querySelector("#sn").value, p_recommendations: recs }), "حُفظت")) { o.remove(); load(); } }; });
  }
  load();
})();
