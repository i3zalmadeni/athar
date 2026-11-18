# قاعدة البيانات (مخطط athar)

| المجموعة | الجداول |
|---|---|
| الحسابات | `accounts`, `user_types`, `profiles` |
| الصلاحيات | `roles`, `permissions`, `role_permissions`, `account_roles`, `account_permissions` |
| المنسوبون | `staff_links` (معرّف مرجعي للنواة فقط) |
| الطلاب وأولياء الأمور | `students`, `guardians`, `guardian_students` (حالة العلاقة: pending/verified/rejected) |
| التشغيل | `system_settings`, `notifications`, `notification_prefs`, `audit_logs`, `login_attempts` |
| التكامل | `core_integration`, `core_demo_staff` (تجريبي موسوم) |

الترحيلات: `supabase/migrations/0001` (الجداول) و`0002` (الدوال والمنح). طُبّق الثاني فعلياً على دفعتين متكافئتين. كل الجداول RLS دون سياسات، ولا منح مباشرة. لا تُنشأ بيانات مستخدمين افتراضية.
