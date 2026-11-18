-- «أثر» – منطق الصلاحيات والدوال. كل وصول من الواجهة عبر دوال public.athar_* (تتحقق من الصلاحية داخل الخادم).
-- الجداول محمية بـ RLS دون أي سياسة ودون منح، فلا يُقرأ منها إلا عبر هذه الدوال.

create function athar.can_acct(a uuid, p text) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$
  select a is not null
    and exists(select 1 from accounts x where x.id=a and x.status='active')
    and coalesce(
      (select ap.granted from account_permissions ap where ap.account_id=a and ap.permission_code=p),
      exists(select 1 from account_roles ar join role_permissions rp on rp.role_code=ar.role_code
             where ar.account_id=a and rp.permission_code=p)) $$;
create function athar.can(p text) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$ select athar.can_acct(auth.uid(), p) $$;
create function athar.require(p text) returns void language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin if not athar.can(p) then raise exception 'forbidden' using errcode='42501'; end if; end $$;
create function athar.require_active(t text default null) returns athar.accounts language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare a accounts; begin
  select * into a from accounts where id=auth.uid() and status='active';
  if not found or (t is not null and a.user_type<>t) then raise exception 'forbidden' using errcode='42501'; end if;
  return a; end $$;
create function athar.has_role(a uuid, r text) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$
  select exists(select 1 from account_roles where account_id=a and role_code=r) $$;
create function athar.setting(k text) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$ select value from system_settings where key=k $$;

create function athar.log_as(actor uuid, act text, ent text, ent_id text, b jsonb default null, a jsonb default null) returns void language sql security definer set search_path=athar,pg_temp as $$
  insert into audit_logs(actor_id, actor_login, action, entity, entity_id, before, after)
  values (actor, (select login_id from accounts where id=actor), act, ent, ent_id, b, a) $$;
create function athar.notify(acct uuid, k text, t text, b text default null, l text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  if exists(select 1 from notification_prefs where account_id=acct and kind=k and not enabled) then return; end if;
  insert into notifications(account_id, kind, title, body, link) values (acct, k, t, b, l);
end $$;
create function athar.notify_perm(perm text, k text, t text, b text default null, l text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare r record; begin
  for r in select id from accounts where status='active' loop
    if athar.can_acct(r.id, perm) then perform athar.notify(r.id, k, t, b, l); end if;
  end loop; end $$;
create function athar.active_admins() returns int language sql stable security definer set search_path=athar,pg_temp as $$
  select count(*)::int from accounts a join account_roles r on r.account_id=a.id and r.role_code='admin' where a.status='active' $$;
create function athar.guard_target(target uuid) returns void language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin
  if target = auth.uid() then raise exception 'self_action' using errcode='42501'; end if;
  if athar.has_role(target,'admin') and not athar.has_role(auth.uid(),'admin') then raise exception 'admin_protected' using errcode='42501'; end if;
end $$;

-- ===== الواجهة العامة (بلا دخول) =====
create function public.athar_public_info() returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select jsonb_build_object('core_mode',(select mode from core_integration where id=1),
    'approval_student',athar.setting('approval.student'),'approval_parent',athar.setting('approval.parent'),
    'min_password',athar.setting('password.min_length')) $$;

-- ===== المستخدم الحالي =====
create function public.athar_me() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare a accounts; begin
  select * into a from accounts where id=auth.uid();
  if not found then return null; end if;
  return jsonb_build_object('id',a.id,'login_id',a.login_id,'display_name',a.display_name,'user_type',a.user_type,'status',a.status,
    'status_note',a.status_note,'last_login_at',a.last_login_at,'created_at',a.created_at,
    'roles',(select coalesce(jsonb_agg(jsonb_build_object('code',r.code,'name_ar',r.name_ar,'scope',r.data_scope)),'[]') from account_roles ar join roles r on r.code=ar.role_code where ar.account_id=a.id),
    'permissions',(select coalesce(jsonb_agg(p.code order by p.code),'[]') from permissions p where athar.can_acct(a.id,p.code)),
    'profile',(select to_jsonb(p)-'account_id' from profiles p where p.account_id=a.id),
    'staff_link',(select jsonb_build_object('core_source',s.core_source,'verified_at',s.verified_at) from staff_links s where s.account_id=a.id),
    'student',(select to_jsonb(s)-'account_id'-'verified_by' from students s where s.account_id=a.id),
    'guardian',(select jsonb_build_object('id',g.id,'full_name',g.full_name) from guardians g where g.account_id=a.id),
    'unread',(select count(*) from notifications n where n.account_id=a.id and n.status='sent'),
    'core_mode',(select mode from core_integration where id=1));
end $$;
create function public.athar_touch_login() returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require_active();
  update accounts set last_login_at=now() where id=auth.uid();
  perform athar.log_as(auth.uid(),'login','account',auth.uid()::text);
end $$;
create function public.athar_update_profile(p_phone text, p_bio text, p_contact jsonb default '[]') returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require_active();
  if jsonb_typeof(coalesce(p_contact,'[]'))<>'array' or jsonb_array_length(coalesce(p_contact,'[]'))>5 then raise exception 'invalid_contact'; end if;
  update profiles set phone=nullif(trim(p_phone),''), bio=nullif(trim(p_bio),''), contact_methods=coalesce(p_contact,'[]'), updated_at=now() where account_id=auth.uid();
  perform athar.log_as(auth.uid(),'profile.update','profile',auth.uid()::text);
end $$;
create function public.athar_my_activity(p_limit int default 30) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require_active();
  return (select coalesce(jsonb_agg(x),'[]') from (select id, action, entity, created_at from audit_logs where actor_id=auth.uid() order by id desc limit least(coalesce(p_limit,30),100)) x);
end $$;

-- ===== الإشعارات =====
create function public.athar_my_notifications(p_limit int default 30) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  if not exists(select 1 from accounts where id=auth.uid()) then raise exception 'forbidden' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(x),'[]') from (select id,kind,title,body,link,status,created_at,read_at from notifications where account_id=auth.uid() order by id desc limit least(coalesce(p_limit,30),100)) x);
end $$;
create function public.athar_mark_notifications_read(p_ids bigint[] default null) returns int language plpgsql security definer set search_path=athar,pg_temp as $$
declare n int; begin
  update notifications set status='read', read_at=now() where account_id=auth.uid() and status='sent' and (p_ids is null or id=any(p_ids));
  get diagnostics n = row_count; return n; end $$;
create function public.athar_notif_prefs() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  return (select jsonb_object_agg(k, coalesce((select enabled from notification_prefs where account_id=auth.uid() and kind=k), true)) from unnest(array['registration','account','link','system']) k);
end $$;
create function public.athar_set_notif_pref(p_kind text, p_enabled boolean) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  if p_kind not in ('registration','account','link','system') then raise exception 'invalid_kind'; end if;
  if p_kind='account' and not p_enabled then raise exception 'required_kind'; end if;  -- إشعارات حالة الحساب إلزامية
  insert into notification_prefs values (auth.uid(), p_kind, p_enabled) on conflict (account_id, kind) do update set enabled=excluded.enabled;
end $$;

-- ===== ولي الأمر =====
create function public.athar_guardian_students() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare a accounts; g guardians; begin
  a := athar.require_active('parent');
  select * into g from guardians where account_id=a.id;
  return (select coalesce(jsonb_agg(jsonb_build_object('link_id',l.id,'relation',l.relation,'status',l.status,'note',l.note,'requested_at',l.requested_at,
      'student', case when l.status='verified' then jsonb_build_object('full_name',s.full_name,'student_no',s.student_no,'grade',s.grade,'section',s.section,'verification_status',s.verification_status)
                      else jsonb_build_object('student_no',s.student_no) end) order by l.requested_at desc),'[]')
    from guardian_students l join students s on s.id=l.student_id where l.guardian_id=g.id);
end $$;
create function public.athar_request_link(p_student_no text, p_relation text) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare a accounts; g guardians; s students; l guardian_students; begin
  a := athar.require_active('parent');
  select * into g from guardians where account_id=a.id;
  select * into s from students where student_no=trim(p_student_no);
  if not found then raise exception 'student_not_found'; end if;
  select * into l from guardian_students where guardian_id=g.id and student_id=s.id;
  if found and l.status<>'rejected' then raise exception 'already_requested'; end if;
  if found then update guardian_students set status='pending', relation=p_relation, requested_at=now(), note=null, decided_by=null, decided_at=null where id=l.id;
  else insert into guardian_students(guardian_id, student_id, relation) values (g.id, s.id, p_relation); end if;
  perform athar.log_as(a.id,'link.request','student',s.id::text, null, jsonb_build_object('relation',p_relation));
  perform athar.notify_perm('links:review','link','طلب ربط ولي أمر بطالب', g.full_name, 'admin.html#links');
  return jsonb_build_object('ok',true);
end $$;

-- ===== الإدارة =====
create function public.athar_admin_dashboard() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require_active('staff');
  return jsonb_build_object(
   'pending_accounts', case when athar.can('accounts:approve') then (select count(*) from accounts where status='pending') end,
   'pending_links', case when athar.can('links:review') then (select count(*) from guardian_students where status='pending') end,
   'pending_students', case when athar.can('students:verify') then (select count(*) from students where verification_status='unverified') end,
   'accounts_by_type', case when athar.can('accounts:view') then (select coalesce(jsonb_object_agg(user_type,c),'{}') from (select user_type,count(*) c from accounts where status='active' group by 1) t) end);
end $$;
create function public.athar_admin_accounts(p_status text default null, p_type text default null, p_q text default null, p_limit int default 25, p_offset int default 0) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare tot int; rows jsonb; q text := nullif(trim(coalesce(p_q,'')),''); begin
  perform athar.require('accounts:view');
  select count(*) into tot from accounts a where (p_status is null or a.status=p_status) and (p_type is null or a.user_type=p_type)
    and (q is null or a.login_id ilike '%'||q||'%' or a.display_name ilike '%'||q||'%');
  select coalesce(jsonb_agg(x),'[]') into rows from (
    select a.id,a.login_id,a.display_name,a.user_type,a.status,a.status_note,a.last_login_at,a.created_at,
      (select coalesce(jsonb_agg(ar.role_code),'[]') from account_roles ar where ar.account_id=a.id) roles,
      (select coalesce(jsonb_object_agg(ap.permission_code,ap.granted),'{}') from account_permissions ap where ap.account_id=a.id) overrides
    from accounts a where (p_status is null or a.status=p_status) and (p_type is null or a.user_type=p_type)
      and (q is null or a.login_id ilike '%'||q||'%' or a.display_name ilike '%'||q||'%')
    order by a.created_at desc limit least(coalesce(p_limit,25),100) offset greatest(coalesce(p_offset,0),0)) x;
  return jsonb_build_object('total',tot,'rows',rows);
end $$;
create function public.athar_admin_set_status(p_account uuid, p_status text, p_note text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare t accounts; begin
  if p_status not in ('active','suspended','rejected') then raise exception 'invalid_status'; end if;
  select * into t from accounts where id=p_account;
  if not found then raise exception 'not_found'; end if;
  perform athar.require(case when t.status in ('pending','rejected') then 'accounts:approve' else 'accounts:manage' end);
  perform athar.guard_target(p_account);
  if p_status in ('suspended','rejected') and athar.has_role(p_account,'admin') and t.status='active' and athar.active_admins()<=1 then raise exception 'last_admin' using errcode='42501'; end if;
  if t.status=p_status then return; end if;
  update accounts set status=p_status, status_note=nullif(trim(p_note),''), decided_by=auth.uid(), decided_at=now(), updated_at=now() where id=p_account;
  perform athar.log_as(auth.uid(),'account.status','account',p_account::text, jsonb_build_object('status',t.status), jsonb_build_object('status',p_status,'note',p_note));
  perform athar.notify(p_account,'account', case p_status when 'active' then 'تم تفعيل حسابك' when 'suspended' then 'تم إيقاف حسابك' else 'لم يُعتمد طلب التفعيل' end, nullif(trim(p_note),''), 'dashboard.html');
end $$;
create function public.athar_admin_set_roles(p_account uuid, p_roles text[]) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare t accounts; r text; old jsonb; begin
  perform athar.require('roles:manage');
  select * into t from accounts where id=p_account; if not found then raise exception 'not_found'; end if;
  perform athar.guard_target(p_account);
  if p_roles is null or cardinality(p_roles)=0 then raise exception 'role_required'; end if;
  foreach r in array p_roles loop
    if not exists(select 1 from roles where code=r and (user_type is null or user_type=t.user_type)) then raise exception 'invalid_role'; end if;
    if exists(select 1 from role_permissions rp where rp.role_code=r and not athar.can(rp.permission_code)) then raise exception 'escalation' using errcode='42501'; end if;
  end loop;
  if athar.has_role(p_account,'admin') and not ('admin'=any(p_roles)) and t.status='active' and athar.active_admins()<=1 then raise exception 'last_admin' using errcode='42501'; end if;
  select coalesce(jsonb_agg(role_code),'[]') into old from account_roles where account_id=p_account;
  delete from account_roles where account_id=p_account;
  insert into account_roles(account_id, role_code, granted_by) select p_account, x, auth.uid() from unnest(p_roles) x;
  perform athar.log_as(auth.uid(),'account.roles','account',p_account::text, old, to_jsonb(p_roles));
end $$;
create function public.athar_admin_set_account_perms(p_account uuid, p_grants jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare e record; begin
  perform athar.require('roles:manage');
  if not exists(select 1 from accounts where id=p_account) then raise exception 'not_found'; end if;
  perform athar.guard_target(p_account);
  for e in select key, value from jsonb_each(coalesce(p_grants,'{}')) loop
    if not exists(select 1 from permissions where code=e.key) then raise exception 'invalid_permission'; end if;
    if e.value = 'true'::jsonb and not athar.can(e.key) then raise exception 'escalation' using errcode='42501'; end if;
    if e.value = 'null'::jsonb then delete from account_permissions where account_id=p_account and permission_code=e.key;
    else insert into account_permissions values (p_account, e.key, (e.value)::text::boolean) on conflict (account_id, permission_code) do update set granted=excluded.granted; end if;
  end loop;
  perform athar.log_as(auth.uid(),'account.permissions','account',p_account::text, null, p_grants);
end $$;
create function public.athar_admin_roles() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require('roles:manage');
  return jsonb_build_object(
    'roles',(select coalesce(jsonb_agg(jsonb_build_object('code',r.code,'name_ar',r.name_ar,'user_type',r.user_type,'data_scope',r.data_scope,'is_system',r.is_system,
       'permissions',(select coalesce(jsonb_agg(rp.permission_code order by rp.permission_code),'[]') from role_permissions rp where rp.role_code=r.code),
       'members',(select count(*) from account_roles ar where ar.role_code=r.code)) order by r.is_system desc, r.code),'[]') from roles r),
    'permissions',(select coalesce(jsonb_agg(jsonb_build_object('code',code,'name_ar',name_ar,'grp',grp) order by grp,code),'[]') from permissions));
end $$;
create function public.athar_admin_save_role(p_code text, p_name text, p_scope text, p_user_type text, p_perms text[]) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare ex roles; x text; begin
  perform athar.require('roles:manage');
  if p_code !~ '^[a-z][a-z0-9_]{2,30}$' then raise exception 'invalid_code'; end if;
  if p_scope not in ('school','linked','own') then raise exception 'invalid_scope'; end if;
  if p_code='admin' then raise exception 'admin_protected' using errcode='42501'; end if;
  foreach x in array coalesce(p_perms,'{}') loop
    if not exists(select 1 from permissions where code=x) then raise exception 'invalid_permission'; end if;
    if not athar.can(x) then raise exception 'escalation' using errcode='42501'; end if;
  end loop;
  select * into ex from roles where code=p_code;
  if found then update roles set name_ar=case when ex.is_system then name_ar else trim(p_name) end, data_scope=case when ex.is_system then data_scope else p_scope end where code=p_code;
  else insert into roles(code,name_ar,user_type,data_scope) values (p_code, trim(p_name), nullif(p_user_type,''), p_scope); end if;
  delete from role_permissions where role_code=p_code;
  insert into role_permissions select p_code, x from unnest(coalesce(p_perms,'{}')) x;
  perform athar.log_as(auth.uid(),'role.save','role',p_code,null,to_jsonb(p_perms));
end $$;
create function public.athar_admin_links(p_status text default 'pending') returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require('links:review');
  return (select coalesce(jsonb_agg(x),'[]') from (select l.id, l.relation, l.status, l.note, l.requested_at, g.full_name guardian_name, ga.login_id guardian_login,
      s.full_name student_name, s.student_no, s.grade, s.section, s.verification_status
    from guardian_students l join guardians g on g.id=l.guardian_id join accounts ga on ga.id=g.account_id join students s on s.id=l.student_id
    where p_status is null or l.status=p_status order by l.requested_at desc limit 200) x);
end $$;
create function public.athar_admin_link_decide(p_link uuid, p_decision text, p_note text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare l guardian_students; ga uuid; begin
  perform athar.require('links:review');
  if p_decision not in ('verified','rejected') then raise exception 'invalid_decision'; end if;
  select * into l from guardian_students where id=p_link; if not found then raise exception 'not_found'; end if;
  update guardian_students set status=p_decision, note=nullif(trim(p_note),''), decided_by=auth.uid(), decided_at=now() where id=p_link;
  select account_id into ga from guardians where id=l.guardian_id;
  perform athar.log_as(auth.uid(),'link.'||p_decision,'guardian_student',p_link::text, jsonb_build_object('status',l.status), jsonb_build_object('status',p_decision));
  perform athar.notify(ga,'link', case p_decision when 'verified' then 'تم اعتماد ارتباطك بالطالب' else 'لم يُعتمد طلب الربط بالطالب' end, nullif(trim(p_note),''), 'dashboard.html');
end $$;
create function public.athar_admin_students(p_q text default null, p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare q text := nullif(trim(coalesce(p_q,'')),''); begin
  perform athar.require('students:view');
  return (select coalesce(jsonb_agg(x),'[]') from (select s.id, s.student_no, s.full_name, s.grade, s.section, s.verification_status, a.status account_status,
      (select count(*) from guardian_students l where l.student_id=s.id and l.status='verified') parents
    from students s left join accounts a on a.id=s.account_id
    where q is null or s.full_name ilike '%'||q||'%' or s.student_no ilike '%'||q||'%'
    order by s.created_at desc limit least(coalesce(p_limit,50),200) offset greatest(coalesce(p_offset,0),0)) x);
end $$;
create function public.athar_admin_student_verify(p_student uuid, p_decision text, p_note text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s students; begin
  perform athar.require('students:verify');
  if p_decision not in ('verified','rejected') then raise exception 'invalid_decision'; end if;
  select * into s from students where id=p_student; if not found then raise exception 'not_found'; end if;
  update students set verification_status=p_decision, verified_by=auth.uid(), verified_at=now() where id=p_student;
  perform athar.log_as(auth.uid(),'student.'||p_decision,'student',p_student::text);
  if s.account_id is not null then perform athar.notify(s.account_id,'account', case p_decision when 'verified' then 'تم التحقق من بياناتك' else 'تعذّر التحقق من بياناتك' end, nullif(trim(p_note),''), 'profile.html'); end if;
end $$;
create function public.athar_admin_audit(p_q text default null, p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare q text := nullif(trim(coalesce(p_q,'')),''); begin
  perform athar.require('audit:view');
  return (select coalesce(jsonb_agg(x),'[]') from (select id, created_at, actor_login, action, entity, entity_id, before, after from audit_logs
    where q is null or action ilike '%'||q||'%' or actor_login ilike '%'||q||'%' or entity_id ilike '%'||q||'%' order by id desc
    limit least(coalesce(p_limit,50),200) offset greatest(coalesce(p_offset,0),0)) x);
end $$;
create function public.athar_admin_settings() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('settings:manage');
  return (select coalesce(jsonb_agg(jsonb_build_object('key',key,'value',value,'description',description,'updated_at',updated_at) order by key),'[]') from system_settings); end $$;
create function public.athar_admin_set_setting(p_key text, p_value jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare old jsonb; begin
  perform athar.require('settings:manage');
  select value into old from system_settings where key=p_key; if not found then raise exception 'invalid_key'; end if;
  if jsonb_typeof(p_value)<>jsonb_typeof(old) then raise exception 'invalid_value'; end if;
  if p_key='password.min_length' and (p_value::text)::int not between 8 and 64 then raise exception 'invalid_value'; end if;
  if p_key in ('login.max_failures','login.window_minutes') and (p_value::text)::int not between 3 and 60 then raise exception 'invalid_value'; end if;
  update system_settings set value=p_value, updated_by=auth.uid(), updated_at=now() where key=p_key;
  perform athar.log_as(auth.uid(),'setting.update','setting',p_key,old,p_value);
end $$;
create function public.athar_core_status() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('integration:view');
  return (select to_jsonb(c)-'id' || jsonb_build_object('demo_records',(select count(*) from core_demo_staff),'linked_staff',(select count(*) from staff_links)) from core_integration c where id=1); end $$;
create function public.athar_admin_set_core_mode(p_mode text) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare old text; begin
  perform athar.require('settings:manage');
  if p_mode not in ('demo','api') then raise exception 'invalid_value'; end if;
  select mode into old from core_integration where id=1;
  update core_integration set mode=p_mode, last_ok=null, last_error=null where id=1;
  perform athar.log_as(auth.uid(),'core.mode','integration','core',to_jsonb(old),to_jsonb(p_mode));
end $$;

-- ===== دوال الخدمة (تستدعيها الدالة الطرفية athar-api بمفتاح الخدمة فقط) =====
create function public.athar_svc_login_gate(p_login text, p_ip text) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare mx int := (athar.setting('login.max_failures')#>>'{}')::int; win int := (athar.setting('login.window_minutes')#>>'{}')::int; fails int; first_at timestamptz; a record; begin
  select count(*), min(created_at) into fails, first_at from login_attempts
    where created_at > now() - make_interval(mins=>win) and not ok and (login_id=lower(p_login) or (p_ip is not null and ip=p_ip))
      and created_at > coalesce((select max(created_at) from login_attempts where login_id=lower(p_login) and ok), '-infinity');
  select id, user_type, status into a from accounts where login_id=lower(p_login);
  return jsonb_build_object('locked', fails >= mx, 'retry_after', case when fails>=mx then greatest(1, ceil(extract(epoch from (first_at + make_interval(mins=>win) - now()))))::int end,
    'account', case when a.id is not null then jsonb_build_object('id',a.id,'user_type',a.user_type,'status',a.status) end);
end $$;
create function public.athar_svc_login_record(p_login text, p_portal text, p_ok boolean, p_ip text) returns void language sql security definer set search_path=athar,pg_temp as $$
  insert into login_attempts(login_id,portal,ok,ip) values (lower(p_login),p_portal,p_ok,p_ip);
  delete from login_attempts where created_at < now() - interval '30 days' $$;
create function public.athar_svc_setting(p_key text) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$ select athar.setting(p_key) $$;
create function public.athar_svc_staff_lookup(p_employee_no text) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare m text; d core_demo_staff; begin
  select mode into m from core_integration where id=1;
  if m <> 'demo' then return jsonb_build_object('mode',m); end if;
  select * into d from core_demo_staff where employee_no=upper(trim(p_employee_no));
  update core_integration set last_check_at=now(), last_ok_at=now(), last_ok=true, last_error=null where id=1;
  if not found then return jsonb_build_object('mode','demo','found',false); end if;
  return jsonb_build_object('mode','demo','found',true,'core_staff_id',d.core_staff_id,'full_name',d.full_name,'job_title',d.job_title,
    'already_linked',exists(select 1 from staff_links where core_staff_id=d.core_staff_id));
end $$;
create function public.athar_svc_staff_linked(p_core_staff_id uuid) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$
  select exists(select 1 from staff_links where core_staff_id=p_core_staff_id) $$;
create function public.athar_svc_core_report(p_ok boolean, p_error text) returns void language sql security definer set search_path=athar,pg_temp as $$
  update core_integration set last_check_at=now(), last_ok=p_ok, last_ok_at=case when p_ok then now() else last_ok_at end, last_error=case when p_ok then null else left(p_error,300) end where id=1 $$;
create function public.athar_svc_can(p_uid uuid, p_perm text) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$ select athar.can_acct(p_uid,p_perm) $$;
create function public.athar_svc_guard(p_actor uuid, p_target uuid) returns void language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin
  if p_actor=p_target then raise exception 'self_action' using errcode='42501'; end if;
  if athar.has_role(p_target,'admin') and not athar.has_role(p_actor,'admin') then raise exception 'admin_protected' using errcode='42501'; end if;
end $$;
create function public.athar_svc_log(p_actor uuid, p_action text, p_entity text, p_entity_id text) returns void language sql security definer set search_path=athar,pg_temp as $$
  select athar.log_as(p_actor,p_action,p_entity,p_entity_id) $$;
create function public.athar_svc_create_account(p_uid uuid, p_type text, p_login text, p_name text, p_payload jsonb) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare st text; sid uuid; gid uuid; rel text; begin
  st := case p_type when 'staff' then 'pending'
        when 'student' then case when athar.setting('approval.student')='true'::jsonb then 'pending' else 'active' end
        when 'parent' then case when athar.setting('approval.parent')='true'::jsonb then 'pending' else 'active' end
        else null end;
  if st is null then raise exception 'invalid_type'; end if;
  insert into accounts(id,user_type,login_id,display_name,status) values (p_uid,p_type,lower(p_login),trim(p_name),st);
  insert into profiles(account_id) values (p_uid);
  insert into account_roles(account_id,role_code) values (p_uid,p_type);
  if p_type='staff' then
    insert into staff_links(account_id,core_staff_id,core_source) values (p_uid,(p_payload->>'core_staff_id')::uuid,p_payload->>'core_source');
  elsif p_type='student' then
    insert into students(account_id,student_no,full_name,grade,section,birth_date)
      values (p_uid, trim(p_payload->>'student_no'), trim(p_name), p_payload->>'grade', nullif(trim(p_payload->>'section'),''), nullif(p_payload->>'birth_date','')::date);
  else
    insert into guardians(account_id,full_name) values (p_uid,trim(p_name)) returning id into gid;
    if nullif(p_payload->>'student_no','') is not null then
      select id into sid from students where student_no=trim(p_payload->>'student_no');
      if sid is null then raise exception 'student_not_found'; end if;
      rel := coalesce(p_payload->>'relation','guardian');
      insert into guardian_students(guardian_id,student_id,relation) values (gid,sid,rel);
      perform athar.notify_perm('links:review','link','طلب ربط ولي أمر بطالب',trim(p_name),'admin.html#links');
    end if;
  end if;
  perform athar.log_as(p_uid,'account.register','account',p_uid::text,null,jsonb_build_object('type',p_type,'status',st));
  if st='pending' then perform athar.notify_perm('accounts:approve','registration','طلب تفعيل حساب جديد',trim(p_name),'admin.html#pending'); end if;
  return jsonb_build_object('status',st);
end $$;

-- أول مدير نظام: يُنفَّذ مرة واحدة من المشغّل عبر SQL، ولا يعمل إن وُجد مدير فعّال (ليس متاحاً للواجهة)
create function athar.bootstrap_admin(p_login text) returns text language plpgsql security definer set search_path=athar,pg_temp as $$
declare a accounts; begin
  if exists(select 1 from account_roles r join accounts x on x.id=r.account_id where r.role_code='admin' and x.status='active') then raise exception 'admin_exists'; end if;
  select * into a from accounts where login_id=lower(p_login) and user_type='staff'; if not found then raise exception 'not_found'; end if;
  update accounts set status='active', decided_at=now(), updated_at=now() where id=a.id;
  insert into account_roles(account_id,role_code) values (a.id,'admin') on conflict do nothing;
  perform athar.log_as(a.id,'bootstrap.admin','account',a.id::text);
  return 'ok'; end $$;

-- منح التنفيذ: الدوال العامة للمصادَقين، دوال الخدمة لـ service_role فقط
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'athar\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.proname like 'athar\_svc\_%' then execute format('grant execute on function %s to service_role', f.sig);
    elsif f.proname='athar_public_info' then execute format('grant execute on function %s to anon, authenticated', f.sig);
    else execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
revoke all on all functions in schema athar from public, anon, authenticated;
