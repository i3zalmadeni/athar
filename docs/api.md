# واجهة RPC (`public.athar_*`)

- عامة (للزائر): `athar_public_info`، `athar_public_intake_info(p_token)`، `athar_public_submit(p_token, p_payload)`. الإخفاقات المتوقعة تعود `{ok:false,error}`: invalid_link، invalid_input، rate_limited، student_no_taken، student_not_found، already_requested.
- المنسوب: `athar_staff_session` (دخول)، `athar_me`، `athar_update_profile`، `athar_my_activity`، `athar_my_notifications`، `athar_mark_notifications_read`، `athar_notif_prefs`، `athar_set_notif_pref`.
- الإدارة (بصلاحية): `athar_admin_dashboard|accounts|set_status|set_roles|set_account_perms|roles|save_role|students|student_verify|links|link_decide|audit|settings|set_setting|intake_links|create_intake_link|set_intake_link`، و`athar_core_status`.
- تنبيه: رمز الرابط محفوظ نصاً ليمكن نسخه ثانيةً؛ من يملك `intake:manage` يراه.
- تنبيه: استجابة `student_not_found` تكشف وجود رقم الطالب؛ يخفّفه حد الطلبات لكل IP.

## الاستبانات (0007)
- المنسوب: `athar_surveys_me` (المطلوب منه وما شارك فيه)، `athar_survey_get`، `athar_survey_submit`، `athar_survey_results` (للمشارك بعد إغلاق الاستبانة).
- الإدارة (`surveys:manage`): `athar_admin_surveys|get_survey|save_survey|set_survey_status|delete_survey`، ويرى المدير النتائج في أي وقت.
- الخصوصية: جدول المشاركة (من شارك) منفصل عن جدول الإجابات (لا حساب ولا وقت فيه)، فلا يربط بينهما أي استعلام في التطبيق. لا تُعرض النتائج قبل بلوغ الحد الأدنى للمشاركين (`surveys.min_respondents`، افتراضيه 5)، والإجابات النصية لا يراها إلا المدير. هذا فصل في الجداول وليس إخفاءً مطلقاً عن من يملك صلاحية قاعدة البيانات نفسها.
- التحليل وصفي آلي فقط: المتوسطات والنسب والتوزيع، والقوة متوسطها 4 فأكثر، والمتابعة أقل من 3.5.
