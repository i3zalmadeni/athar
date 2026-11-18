# واجهة RPC (`public.athar_*`)

- عامة (للزائر): `athar_public_info`، `athar_public_intake_info(p_token)`، `athar_public_submit(p_token, p_payload)`. الإخفاقات المتوقعة تعود `{ok:false,error}`: invalid_link، invalid_input، rate_limited، student_no_taken، student_not_found، already_requested.
- المنسوب: `athar_staff_session` (دخول)، `athar_me`، `athar_update_profile`، `athar_my_activity`، `athar_my_notifications`، `athar_mark_notifications_read`، `athar_notif_prefs`، `athar_set_notif_pref`.
- الإدارة (بصلاحية): `athar_admin_dashboard|accounts|set_status|set_roles|set_account_perms|roles|save_role|students|student_verify|links|link_decide|audit|settings|set_setting|intake_links|create_intake_link|set_intake_link`، و`athar_core_status`.
- تنبيه: رمز الرابط محفوظ نصاً ليمكن نسخه ثانيةً؛ من يملك `intake:manage` يراه.
- تنبيه: استجابة `student_not_found` تكشف وجود رقم الطالب؛ يخفّفه حد الطلبات لكل IP.
