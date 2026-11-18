-- 0003: الطلاب وأولياء الأمور بلا حسابات ولا دخول: يعبّئون نماذج عبر روابط تُرسل لهم. المنسوبون يدخلون بحساب النواة (انظر 0004).
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and (p.proname like 'athar\_svc\_%' or p.proname in ('athar_guardian_students','athar_request_link','athar_touch_login','athar_admin_set_core_mode'))
  loop execute 'drop function '||f.sig; end loop; end $$;
drop table athar.core_demo_staff;

alter table athar.accounts drop constraint login_id_fmt;
alter table athar.accounts add constraint staff_only check (user_type='staff');
alter table athar.guardians alter column account_id drop not null;
alter table athar.guardians add column phone text check (phone ~ '^[0-9+ ]{7,20}$');
create index guardians_phone on athar.guardians(phone);
alter table athar.students add column source text not null default 'intake', add column intake_link_id uuid;

do $$ declare c record; begin
  for c in select conrelid::regclass rel, conname from pg_constraint where contype='c' and
    ((conrelid='athar.core_integration'::regclass and pg_get_constraintdef(oid) like '%mode%') or (conrelid='athar.staff_links'::regclass and pg_get_constraintdef(oid) like '%core_source%'))
  loop execute format('alter table %s drop constraint %I', c.rel, c.conname); end loop; end $$;
update athar.core_integration set mode='db', last_ok=null, last_error=null where id=1;
alter table athar.core_integration add constraint core_integration_mode_check check (mode in ('db','api'));
alter table athar.core_integration alter column mode set default 'db';
alter table athar.staff_links add constraint staff_links_core_source_check check (core_source in ('db','api'));
delete from athar.system_settings where key like 'approval.%' or key like 'login.%' or key='password.min_length';
insert into athar.system_settings(key,value,description) values ('intake.max_per_ip_10min','20','الحد الأقصى لعمليات التعبئة من عنوان واحد خلال 10 دقائق');

create table athar.intake_links(
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  kind text not null check (kind in ('student','parent')),
  label text not null check (char_length(label) between 3 and 80),
  expires_at timestamptz, max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0, active boolean not null default true,
  created_by uuid, created_at timestamptz not null default now());
create table athar.intake_log(id bigserial primary key, ip text, link_id uuid, created_at timestamptz not null default now());
create index intake_log_ip on athar.intake_log(ip, created_at desc);
alter table athar.intake_links enable row level security; alter table athar.intake_log enable row level security;
revoke all on athar.intake_links, athar.intake_log from public, anon, authenticated;
revoke all on all sequences in schema athar from public, anon, authenticated;

insert into athar.permissions values ('intake:manage','إدارة روابط التعبئة للطلاب وأولياء الأمور','الطلاب');
insert into athar.role_permissions values ('admin','intake:manage'),('school_manager','intake:manage'),('student_affairs','intake:manage');
