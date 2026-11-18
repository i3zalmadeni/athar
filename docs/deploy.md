# التشغيل والنشر

1. **قاعدة البيانات:** طبّق `supabase/migrations/*.sql` بالترتيب على مشروع Supabase.
2. **الدالة الطرفية:** انشر `supabase/functions/athar-api` بالخيار `verify_jwt=false` (تتحقق من الهوية بنفسها). أسرار اختيارية: `ALLOWED_ORIGINS`, `CORE_API_URL`, `CORE_API_KEY`. المتغيرات `SUPABASE_URL` و`SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY` متوفرة تلقائياً.
3. **الواجهة:** عدّل `site/assets/config.js` (العنوان والمفتاح العام فقط). فعّل Pages من إعدادات المستودع (المصدر: GitHub Actions) ثم ادفع إلى `main`؛ يتولى `.github/workflows/pages.yml` النشر.
4. **شعار المدرسة:** ضع الملف المعتمد في `site/assets/` وحدّد `logoUrl` في `config.js` (لم يُوجد في مستودعات النواة، فلم يُوضع شعار بديل).
5. **أول مدير:** سجّل منسوباً من بوابة المنسوبين ثم نفّذ `select athar.bootstrap_admin('login_id');` من محرر SQL.
6. **اختبار الدخان:** `node tests/smoke.mjs` (يحتاج playwright).
