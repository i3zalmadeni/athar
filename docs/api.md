# واجهة RPC (`public.athar_*`)

- عامة (للزائر): `athar_public_info`، `athar_public_survey_info(p_token)`، `athar_public_survey_submit(p_token, p_payload)`. الإخفاقات المتوقعة تعود `{ok:false,error}`: invalid_link، invalid_input، rate_limited.
- المنسوب: `athar_staff_session` (دخول)، `athar_me`، `athar_update_profile`، `athar_my_activity`، `athar_my_notifications`، `athar_mark_notifications_read`، `athar_notif_prefs`، `athar_set_notif_pref`.
- الإدارة (بصلاحية): `athar_admin_dashboard|accounts|set_status|set_roles|set_account_perms|roles|save_role|audit|settings|set_setting`، و`athar_core_status`.

## الاستبانات (0007)
- المنسوب: `athar_surveys_me` (المطلوب منه وما شارك فيه)، `athar_survey_get`، `athar_survey_submit`، `athar_survey_results` (للمشارك بعد إغلاق الاستبانة).
- الإدارة (`surveys:manage`): `athar_admin_surveys|get_survey|save_survey|set_survey_status|delete_survey`، ويرى المدير النتائج في أي وقت.
- الخصوصية: جدول المشاركة (من شارك) منفصل عن جدول الإجابات (لا حساب ولا وقت فيه)، فلا يربط بينهما أي استعلام في التطبيق. لا تُعرض النتائج قبل بلوغ الحد الأدنى للمشاركين (`surveys.min_respondents`، افتراضيه 5)، والإجابات النصية لا يراها إلا المدير. هذا فصل في الجداول وليس إخفاءً مطلقاً عن من يملك صلاحية قاعدة البيانات نفسها.
- التحليل وصفي آلي فقط: المتوسطات والنسب والتوزيع، والقوة متوسطها 4 فأكثر، والمتابعة أقل من 3.5.

## الاستبانات والدراسات (0008)
- الفئات: student، teacher، administrative، supervisor، parent. المعلم يطابق فئة `teaching` في النواة، والإداري يطابق `administrative`؛ ولا استبانة موجهة للدعم حالياً.
- المنسوب: `athar_surveys_me` (حسب فئته)، `athar_survey_get|submit`، `athar_study_get` (للمشارك بعد اعتماد الدراسة).
- الإدارة (`surveys:manage`): `athar_admin_surveys|get_survey|save_survey|set_survey_status|delete_survey|respondents|generate_study|studies|update_study|approve_study`، و`athar_survey_results`.
- الرابط العام يُولَّد عند فتح استبانة المتعلم أو ولي الأمر أو الجهة المشرفة. الحد الأقصى للإرسال من عنوان واحد: `surveys.max_per_ip_10min` (100 افتراضياً لأن شبكة المدرسة تشترك في عنوان).
- لا تُنشأ دراسة قبل الإغلاق ولا بأقل من `surveys.min_respondents` مشاركاً. نصوص الإجابات الحرة لا تدخل لقطة الدراسة.

## الأسئلة الموضوعية والروابط المختصرة (0010)
- كل سؤال `scale` بأربع عبارات في `options` مرتبة من الأضعف (قيمة 1) إلى الأقوى (قيمة 4). عتبات التحليل: قوة عند 3.3 فأكثر، متابعة تحت 2.8، أولوية عالية تحت 2.4. مستوى الدراسة: مرتفع 3.4 فأكثر، جيد 2.8، متوسط 2.4.
- الرابط المختصر `/s/<رمز>`: صفحة `404.html` تحوّله إلى `form.html?t=<رمز>` (استضافة GitHub Pages بلا مسارات ديناميكية). الرمز عشوائي من 8 خانات، ويحدده المدير بـ`athar_admin_set_survey_slug` (4 إلى 30 خانة).
- `athar_admin_study_overview`: كل الاستبانات غير المسودة (الجارية والمغلقة) بمتوسطها حين يبلغ المشاركون الحد الأدنى.
- الصفحات: `surveys-admin.html` (إدارة الاستبانات)، `studies-admin.html` (إدارة الدراسات)، `admin.html` (الحسابات والصلاحيات والسجل والإعدادات). حُذفت صفحة «حسابي»، والإشعارات تُفتح من «مشاهدة الكل» في الجرس.

## 0011: دراسة حية
- كل استبانة تُفتح تحصل تلقائياً على دراسة مسودة (trigger على surveys).
- `admin_generate_study` يعمل على الاستبانة المفتوحة والمغلقة وبلا حد أدنى للمديرين، ولا يستبدل التوصيات المحرَّرة يدوياً (`recs_edited`).
- إغلاق تلقائي للاستبانة عند بلوغ `target_count` (trigger على survey_participation وsurvey_respondents).
- `survey_results` و`admin_study_overview` لا يخفيان الأرقام المجمَّعة؛ النصوص الحرة تظهر بعد `surveys.min_respondents`.
- واجهة الدراسة `study.html`: رسوم SVG (assets/charts.js) وتحديث حي كل 20 ثانية للمسودة.
