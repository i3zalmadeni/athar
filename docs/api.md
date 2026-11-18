# واجهات أثر

الواجهة تتحدث مع طبقتين فقط.

## 1) الدالة الطرفية `POST /functions/v1/athar-api`
جسم JSON فيه `action`. بلا JWT إلا `reset_password`. CORS محصور في `ALLOWED_ORIGINS` (الافتراضي https://i3zalmadeni.github.io).

| action | الحقول | النتيجة / الأخطاء |
|---|---|---|
| `login` | `portal`, `login_id`, `password` | `{session, status}`؛ `invalid_credentials` (401)، `locked` (429 + `retry_after`) |
| `register` | `portal` + حقول الفئة، `login_id`, `password` | `{status}`؛ `login_taken`, `weak_password`, `student_no_taken`, `staff_not_found`, `core_already_linked`, `core_unavailable`, `student_not_found` |
| `reset_password` | `account_id`, `new_password` + ترويسة Authorization | `{ok}`؛ يتطلب `accounts:reset_password` ولا يعمل على حساب المدير إلا من مدير |

حقول التسجيل: منسوب `employee_no`؛ طالب `full_name, student_no, grade, section?, birth_date?`؛ ولي أمر `full_name, student_no?, relation?`.
القفل: 5 محاولات فاشلة في 15 دقيقة (قابلة للضبط) لكل معرّف أو عنوان. طلبات التسجيل محدودة بالعدد نفسه لكل عنوان.

## 2) دوال RPC (`/rest/v1/rpc/athar_*`، للمصادَق فقط ما عدا `athar_public_info`)
ذاتية: `me`, `touch_login`, `update_profile`, `my_activity`, `my_notifications`, `mark_notifications_read`, `notif_prefs`, `set_notif_pref`.
ولي الأمر: `guardian_students`, `request_link`.
إدارية (كلٌ بصلاحيته داخل الخادم): `admin_dashboard`, `admin_accounts`, `admin_set_status`, `admin_set_roles`, `admin_set_account_perms`, `admin_roles`, `admin_save_role`, `admin_links`, `admin_link_decide`, `admin_students`, `admin_student_verify`, `admin_audit`, `admin_settings`, `admin_set_setting`, `core_status`, `admin_set_core_mode`.
دوال `athar_svc_*` لا يستدعيها إلا `service_role`.
أخطاء الصلاحية بالرمز `42501` (forbidden, self_action, admin_protected, last_admin, escalation).
