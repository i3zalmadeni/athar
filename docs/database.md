# قاعدة البيانات

الترحيلات في `supabase/migrations`: 0001 المخطط، 0002 الدوال، 0003-0006 دخول النواة والأدوار ومزامنتها، 0007 محرك الاستبانات، 0008 منصة الاستبانات (الفئات والروابط العامة والدراسات وإزالة نموذج الطلاب وأولياء الأمور)، 0009 بذر خمس استبانات مسودة (واحدة لكل فئة، 10 أسئلة).

أهم الجداول: accounts (فيها category من النواة)، roles، permissions، profiles، staff_links، surveys، survey_questions (domain وrecommendation وstrength)، survey_participation (من شارك)، survey_answers (بلا حساب ولا وقت)، survey_respondents (بيانات اختيارية)، survey_log، studies، notifications، audit_logs، system_settings، core_integration.

أول مدير يُنشأ بعد أول دخول للمنسوب: `select athar.bootstrap_admin('<login_id>');` من محرر SQL، أو تلقائياً لمن له دور core_admin في النواة.
