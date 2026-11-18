// أثر – الدالة الطرفية athar-api: الدخول مع تحديد المحاولات، تسجيل الطلاب وأولياء الأمور، تفعيل المنسوبين، إعادة تعيين كلمات المرور.
// تعمل بمفتاح الخدمة داخل الخادم فقط. لا تُكشف المفاتيح للواجهة.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://i3zalmadeni.github.io").split(",").map((s) => s.trim());
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const DOMAIN = "athar.invalid";
const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const GRADES = ["الأول المتوسط", "الثاني المتوسط", "الثالث المتوسط"];
const RELATIONS = ["father", "mother", "guardian", "brother", "other"];
const PORTALS = ["staff", "student", "parent"];

class Fail extends Error { constructor(public code: string, public status = 400, public extra: Record<string, unknown> = {}) { super(code); } }
const cors = (req: Request) => {
  const o = req.headers.get("origin") ?? "";
  const h: Record<string, string> = { "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, content-type, apikey", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  if (ORIGINS.includes(o)) h["Access-Control-Allow-Origin"] = o;
  return h;
};
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const ipOf = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
const rpc = async (fn: string, args: Record<string, unknown>) => {
  const { data, error } = await admin.rpc(fn, args);
  if (error) throw error;
  return data;
};
async function minPassword(): Promise<number> { return Number(await rpc("athar_svc_setting", { p_key: "password.min_length" })) || 8; }

// ===== طبقة التكامل مع النواة الرقمية (بديلان: demo | api) =====
// demo: بيانات تجريبية موسومة داخل قاعدة أثر (لا اتصال فعلي). api: قراءة فقط من core-api بمفتاح نظام يُضبط كسرّ.
type CoreStaff = { mode: string; found: boolean; core_staff_id?: string; full_name?: string; already_linked?: boolean };
async function coreLookupStaff(employeeNo: string): Promise<CoreStaff> {
  const r = await rpc("athar_svc_staff_lookup", { p_employee_no: employeeNo });
  if (r.mode === "demo") return r;
  const base = Deno.env.get("CORE_API_URL"), key = Deno.env.get("CORE_API_KEY");
  if (!base || !key) { await rpc("athar_svc_core_report", { p_ok: false, p_error: "CORE_API_URL/CORE_API_KEY غير مضبوطين" }); throw new Fail("core_unavailable", 503); }
  try {
    const res = await fetch(`${base}/v1/staff?active=all&limit=500`, { headers: { "x-system-key": key } });
    if (!res.ok) throw new Error(`core-api ${res.status}`);
    const body = await res.json();
    const list: Array<Record<string, unknown>> = Array.isArray(body) ? body : body.data ?? body.items ?? [];
    const hit = list.find((s) => String(s.employee_no ?? "").toUpperCase() === employeeNo.toUpperCase());
    await rpc("athar_svc_core_report", { p_ok: true, p_error: null });
    if (!hit) return { mode: "api", found: false };
    const id = String(hit.id);
    return { mode: "api", found: true, core_staff_id: id, full_name: String(hit.full_name ?? ""), already_linked: await rpc("athar_svc_staff_linked", { p_core_staff_id: id }) };
  } catch (e) {
    await rpc("athar_svc_core_report", { p_ok: false, p_error: String((e as Error).message) });
    throw new Fail("core_unavailable", 503);
  }
}

// ===== الإجراءات =====
async function login(req: Request, b: Record<string, unknown>) {
  const portal = str(b.portal, 10), loginId = str(b.login_id, 40).toLowerCase(), password = str(b.password, 200);
  if (!PORTALS.includes(portal) || !LOGIN_RE.test(loginId) || !password) throw new Fail("invalid_credentials", 401);
  const ip = ipOf(req);
  const gate = await rpc("athar_svc_login_gate", { p_login: loginId, p_ip: ip });
  if (gate.locked) throw new Fail("locked", 429, { retry_after: gate.retry_after });
  const anon = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: `${loginId}@${DOMAIN}`, password });
  const okType = gate.account && gate.account.user_type === portal;
  if (error || !data.session || !okType) {
    await rpc("athar_svc_login_record", { p_login: loginId, p_portal: portal, p_ok: false, p_ip: ip });
    throw new Fail("invalid_credentials", 401);   // رسالة واحدة لا تكشف وجود الحساب أو نوعه
  }
  await rpc("athar_svc_login_record", { p_login: loginId, p_portal: portal, p_ok: true, p_ip: ip });
  const s = data.session;
  return { session: { access_token: s.access_token, refresh_token: s.refresh_token }, status: gate.account.status };
}

async function register(req: Request, b: Record<string, unknown>) {
  const portal = str(b.portal, 10), loginId = str(b.login_id, 40).toLowerCase(), password = str(b.password, 200);
  if (!PORTALS.includes(portal)) throw new Fail("invalid_portal");
  if (!LOGIN_RE.test(loginId)) throw new Fail("invalid_login_id");
  if (password.length < (await minPassword())) throw new Fail("weak_password");
  // تحديد عدد طلبات التسجيل لكل عنوان: تُحسب كمحاولات في نافذة الدخول نفسها
  const ip = ipOf(req);
  const gate = await rpc("athar_svc_login_gate", { p_login: "register", p_ip: ip });
  if (gate.locked) throw new Fail("locked", 429, { retry_after: gate.retry_after });
  await rpc("athar_svc_login_record", { p_login: "register", p_portal: "register", p_ok: false, p_ip: ip });
  const existing = await rpc("athar_svc_login_gate", { p_login: loginId, p_ip: null });
  if (existing.account) throw new Fail("login_taken", 409);

  let name = str(b.full_name, 100), payload: Record<string, unknown> = {};
  if (portal === "staff") {
    const emp = str(b.employee_no, 30);
    if (!emp) throw new Fail("employee_no_required");
    const core = await coreLookupStaff(emp);
    if (!core.found) throw new Fail("staff_not_found", 404);
    if (core.already_linked) throw new Fail("core_already_linked", 409);
    name = core.full_name ?? name;                       // الاسم يُستمد من النواة ولا يُعاد إدخاله
    payload = { core_staff_id: core.core_staff_id, core_source: core.mode };
  } else if (portal === "student") {
    const grade = str(b.grade, 40), no = str(b.student_no, 20);
    if (name.length < 6 || !GRADES.includes(grade) || !/^[0-9A-Za-z-]{4,20}$/.test(no)) throw new Fail("invalid_input");
    const bd = str(b.birth_date, 10);
    if (bd && !/^\d{4}-\d{2}-\d{2}$/.test(bd)) throw new Fail("invalid_input");
    payload = { student_no: no, grade, section: str(b.section, 20), birth_date: bd || null };
  } else {
    if (name.length < 6) throw new Fail("invalid_input");
    const no = str(b.student_no, 20), rel = str(b.relation, 20);
    if (no) { if (!/^[0-9A-Za-z-]{4,20}$/.test(no) || !RELATIONS.includes(rel)) throw new Fail("invalid_input"); payload = { student_no: no, relation: rel }; }
  }
  const { data: u, error: ue } = await admin.auth.admin.createUser({ email: `${loginId}@${DOMAIN}`, password, email_confirm: true, user_metadata: { athar_type: portal } });
  if (ue || !u.user) throw new Fail("register_failed", 500);
  try {
    const r = await rpc("athar_svc_create_account", { p_uid: u.user.id, p_type: portal, p_login: loginId, p_name: name, p_payload: payload });
    return { status: r.status };
  } catch (e) {
    await admin.auth.admin.deleteUser(u.user.id);        // لا يبقى مستخدم مصادقة بلا حساب
    const m = String((e as { message?: string }).message ?? "");
    if (m.includes("students_student_no_key")) throw new Fail("student_no_taken", 409);
    if (m.includes("staff_links_core_staff_id_key")) throw new Fail("core_already_linked", 409);
    if (m.includes("student_not_found")) throw new Fail("student_not_found", 404);
    throw new Fail("register_failed", 500);
  }
}

async function resetPassword(req: Request, b: Record<string, unknown>) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) throw new Fail("unauthorized", 401);
  const actor = who.user.id, target = str(b.account_id, 40), pw = str(b.new_password, 200);
  if (!(await rpc("athar_svc_can", { p_uid: actor, p_perm: "accounts:reset_password" }))) throw new Fail("forbidden", 403);
  if (pw.length < (await minPassword())) throw new Fail("weak_password");
  try { await rpc("athar_svc_guard", { p_actor: actor, p_target: target }); } catch { throw new Fail("forbidden", 403); }
  const { error } = await admin.auth.admin.updateUserById(target, { password: pw });
  if (error) throw new Fail("reset_failed", 500);
  await rpc("athar_svc_log", { p_actor: actor, p_action: "account.reset_password", p_entity: "account", p_entity_id: target });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);
  try {
    const b = await req.json().catch(() => ({}));
    const action = str(b.action, 30);
    const out = action === "login" ? await login(req, b) : action === "register" ? await register(req, b)
      : action === "reset_password" ? await resetPassword(req, b) : (() => { throw new Fail("unknown_action", 404); })();
    return json(req, out);
  } catch (e) {
    if (e instanceof Fail) return json(req, { error: e.code, ...e.extra }, e.status);
    console.error(e);
    return json(req, { error: "server_error" }, 500);
  }
});
