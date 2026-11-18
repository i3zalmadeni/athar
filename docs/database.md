# قاعدة البيانات

الترحيلات في `supabase/migrations`: 0001 المخطط، 0002 الدوال، 0003 روابط التعبئة وإزالة نموذج الحسابات القديم، 0004 دخول النواة ودوال التعبئة. أهم الجداول: accounts، roles، permissions، profiles، staff_links، students، guardians، guardian_students، intake_links، intake_log، notifications، audit_logs، system_settings، core_integration. أول مدير يُنشأ بعد أول دخول للمنسوب: `select athar.bootstrap_admin('<login_id>');` من محرر SQL.
