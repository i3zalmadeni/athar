-- «أثر» – قاعدة البيانات التشغيلية المستقلة (مخطط athar). لا تعدّل أي جدول في مخطط public (النواة الرقمية).
create schema if not exists athar;
revoke all on schema athar from public, anon, authenticated;

create table athar.user_types(code text primary key, name_ar text not null);
insert into athar.user_types values ('staff','المنسوبون'),('student','الطلاب'),('parent','أولياء الأمور');

create table athar.accounts(
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null references athar.user_types(code),
  login_id text not null,
  display_name text not null,
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  status_note text,
  last_login_at timestamptz,
  decided_by uuid references athar.accounts(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint login_id_fmt check (login_id ~ '^[a-z0-9][a-z0-9._-]{2,39}$')
);
create unique index accounts_login_uq on athar.accounts(login_id);
create index accounts_type_status on athar.accounts(user_type, status);

create table athar.roles(
  code text primary key, name_ar text not null,
  user_type text references athar.user_types(code),         -- null = لأي نوع
  data_scope text not null default 'own' check (data_scope in ('school','linked','own')),
  is_system boolean not null default false
);
create table athar.permissions(code text primary key, name_ar text not null, grp text not null);
create table athar.role_permissions(
  role_code text references athar.roles(code) on delete cascade,
  permission_code text references athar.permissions(code) on delete cascade,
  primary key(role_code, permission_code));
create table athar.account_roles(
  account_id uuid references athar.accounts(id) on delete cascade,
  role_code text references athar.roles(code) on delete cascade,
  granted_by uuid, granted_at timestamptz not null default now(),
  primary key(account_id, role_code));
create table athar.account_permissions(            -- تخصيص تفصيلي: true منح، false سحب
  account_id uuid references athar.accounts(id) on delete cascade,
  permission_code text references athar.permissions(code) on delete cascade,
  granted boolean not null, primary key(account_id, permission_code));

create table athar.profiles(
  account_id uuid primary key references athar.accounts(id) on delete cascade,
  phone text check (phone is null or phone ~ '^[0-9+ ]{7,20}$'),
  bio text check (char_length(bio) <= 500),
  contact_methods jsonb not null default '[]',
  updated_at timestamptz not null default now());

-- ارتباط المنسوب بمعرّفه في النواة الرقمية: معرّف مرجعي فقط، دون نسخ بياناته الأساسية
create table athar.staff_links(
  account_id uuid primary key references athar.accounts(id) on delete cascade,
  core_staff_id uuid not null unique,
  core_source text not null check (core_source in ('demo','api')),
  verified_at timestamptz not null default now());

create table athar.students(
  id uuid primary key default gen_random_uuid(),
  account_id uuid unique references athar.accounts(id) on delete cascade,
  student_no text not null unique check (student_no ~ '^[0-9A-Za-z-]{4,20}$'),
  full_name text not null,
  grade text not null check (grade in ('الأول المتوسط','الثاني المتوسط','الثالث المتوسط')),
  section text,
  birth_date date,
  core_student_id uuid unique,                      -- يُملأ عند توفر التكامل مع سجل المتعلمين
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  verified_by uuid, verified_at timestamptz,
  created_at timestamptz not null default now());

create table athar.guardians(
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references athar.accounts(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now());
create table athar.guardian_students(
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references athar.guardians(id) on delete cascade,
  student_id uuid not null references athar.students(id) on delete cascade,
  relation text not null check (relation in ('father','mother','guardian','brother','other')),
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  note text, requested_at timestamptz not null default now(),
  decided_by uuid, decided_at timestamptz,
  unique(guardian_id, student_id));

create table athar.system_settings(key text primary key, value jsonb not null, description text, updated_by uuid, updated_at timestamptz not null default now());
create table athar.notifications(
  id bigserial primary key, account_id uuid not null references athar.accounts(id) on delete cascade,
  kind text not null, title text not null, body text, link text,
  status text not null default 'sent' check (status in ('sent','read')),
  created_at timestamptz not null default now(), read_at timestamptz);
create index notif_acct on athar.notifications(account_id, created_at desc);
create table athar.notification_prefs(account_id uuid references athar.accounts(id) on delete cascade, kind text, enabled boolean not null, primary key(account_id, kind));
create table athar.audit_logs(
  id bigserial primary key, actor_id uuid, actor_login text, action text not null, entity text, entity_id text,
  before jsonb, after jsonb, created_at timestamptz not null default now());
create index audit_created on athar.audit_logs(created_at desc);
create index audit_actor on athar.audit_logs(actor_id, created_at desc);
create table athar.login_attempts(id bigserial primary key, login_id text not null, portal text, ok boolean not null, ip text, created_at timestamptz not null default now());
create index login_attempts_idx on athar.login_attempts(login_id, created_at desc);

-- التكامل مع النواة الرقمية
create table athar.core_integration(
  id int primary key check (id = 1), mode text not null default 'demo' check (mode in ('demo','api')),
  last_check_at timestamptz, last_ok_at timestamptz, last_ok boolean, last_error text);
insert into athar.core_integration(id) values (1);
-- بيانات تجريبية موسومة صراحةً، تُستعمل فقط في وضع demo ولا تُعدّ بيانات مستخدمين فعليين
create table athar.core_demo_staff(
  core_staff_id uuid primary key default gen_random_uuid(), employee_no text not null unique,
  full_name text not null, job_title text, is_demo boolean not null default true check (is_demo));
insert into athar.core_demo_staff(employee_no, full_name, job_title) values
 ('DEMO-0001','[تجريبي] منسوب ١','معلم'),('DEMO-0002','[تجريبي] منسوب ٢','إداري'),('DEMO-0003','[تجريبي] منسوب ٣','معلم');

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='athar' loop
    execute format('alter table athar.%I enable row level security', t);
    execute format('revoke all on athar.%I from public, anon, authenticated', t);
  end loop; end $$;
revoke all on all sequences in schema athar from public, anon, authenticated;

-- الأدوار والصلاحيات
insert into athar.permissions values
 ('accounts:view','عرض الحسابات','الحسابات'),('accounts:approve','اعتماد الحسابات الجديدة أو رفضها','الحسابات'),
 ('accounts:manage','إيقاف الحسابات وتفعيلها','الحسابات'),('accounts:reset_password','إعادة تعيين كلمات المرور','الحسابات'),
 ('roles:manage','إدارة الأدوار والصلاحيات','الصلاحيات'),('links:review','مراجعة ارتباط أولياء الأمور بالطلاب','الطلاب'),
 ('students:view','عرض سجلات الطلاب','الطلاب'),('students:verify','التحقق من بيانات الطلاب','الطلاب'),
 ('audit:view','عرض سجل العمليات','الحوكمة'),('settings:manage','إدارة إعدادات النظام','الحوكمة'),
 ('integration:view','عرض حالة التكامل مع النواة','الحوكمة');
insert into athar.roles(code,name_ar,user_type,data_scope,is_system) values
 ('admin','مدير النظام','staff','school',true),
 ('school_manager','مدير المدرسة','staff','school',true),
 ('student_affairs','شؤون الطلاب','staff','school',true),
 ('staff','منسوب','staff','own',true),
 ('student','طالب','student','own',true),
 ('parent','ولي أمر','parent','linked',true);
insert into athar.role_permissions select 'admin', code from athar.permissions;
insert into athar.role_permissions values
 ('school_manager','accounts:view'),('school_manager','accounts:approve'),('school_manager','links:review'),('school_manager','students:view'),
 ('school_manager','students:verify'),('school_manager','audit:view'),('school_manager','integration:view'),
 ('student_affairs','students:view'),('student_affairs','students:verify'),('student_affairs','links:review');
insert into athar.system_settings(key,value,description) values
 ('approval.student','true','اشتراط اعتماد حساب الطالب قبل التفعيل'),
 ('approval.parent','true','اشتراط اعتماد حساب ولي الأمر قبل التفعيل'),
 ('login.max_failures','5','عدد محاولات الدخول الفاشلة المسموحة'),
 ('login.window_minutes','15','مدة القفل ونافذة العدّ بالدقائق'),
 ('password.min_length','8','الحد الأدنى لطول كلمة المرور');
