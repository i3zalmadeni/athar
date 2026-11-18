-- 0005: مدير النواة ومنسق أثر يملكان الصلاحية الكاملة (تُزامَن من النواة عند كل دخول)
insert into athar.roles(code,name_ar,user_type,data_scope,is_system) values ('athar_coordinator','منسق أثر','staff','school',true) on conflict do nothing;
insert into athar.role_permissions select 'athar_coordinator', code from athar.permissions on conflict do nothing;
create or replace function athar.is_admin_tier(uid uuid) returns boolean language sql stable security definer set search_path=athar,pg_temp as $$
  select exists(select 1 from account_roles where account_id=uid and role_code in ('admin','athar_coordinator')) $$;
create or replace function athar.active_admins() returns int language sql stable security definer set search_path=athar,pg_temp as $$
  select count(*)::int from accounts a where a.status='active' and athar.is_admin_tier(a.id) $$;
create or replace function athar.guard_target(target uuid) returns void language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin
  if target = auth.uid() then raise exception 'self_action' using errcode='42501'; end if;
  if athar.is_admin_tier(target) and not athar.is_admin_tier(auth.uid()) then raise exception 'admin_protected' using errcode='42501'; end if;
end $$;
create or replace function public.athar_staff_session() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare u uuid := auth.uid(); c record; a accounts; lid text; v_admin boolean; v_coord boolean; begin
  if u is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into c from athar.core_staff(u);
  if not found then raise exception 'not_staff' using errcode='42501'; end if;
  if not c.is_active then raise exception 'core_inactive' using errcode='42501'; end if;
  lid := lower(coalesce(nullif(c.login_id,''), c.staff_id::text));
  insert into accounts(id,user_type,login_id,display_name,status) values (u,'staff',lid,c.full_name,'active')
    on conflict (id) do update set display_name=excluded.display_name, login_id=excluded.login_id, updated_at=now();
  insert into profiles(account_id) values (u) on conflict do nothing;
  insert into account_roles(account_id,role_code) select u,'staff' where not exists(select 1 from account_roles where account_id=u);
  -- مزامنة الأدوار الإدارية من النواة: مدير النواة => مدير النظام، ومنسق أثر => منسق أثر (الصلاحيات نفسها)
  select exists(select 1 from public.staff_roles r where r.staff_id=c.staff_id and r.ended_on is null and r.role_code='core_admin') into v_admin;
  select exists(select 1 from public.staff_roles r where r.staff_id=c.staff_id and r.ended_on is null and r.role_code='coordinator' and r.system_code='athar') into v_coord;
  if v_admin then insert into account_roles(account_id,role_code,granted_by) values (u,'admin',u) on conflict do nothing;
  else delete from account_roles where account_id=u and role_code='admin' and granted_by=u; end if;
  if v_coord then insert into account_roles(account_id,role_code,granted_by) values (u,'athar_coordinator',u) on conflict do nothing;
  else delete from account_roles where account_id=u and role_code='athar_coordinator' and granted_by=u; end if;
  insert into staff_links(account_id,core_staff_id,core_source) values (u,c.staff_id,'db')
    on conflict (account_id) do update set core_staff_id=excluded.core_staff_id, verified_at=now();
  select * into a from accounts where id=u;
  if a.status='active' then update accounts set last_login_at=now() where id=u; perform athar.log_as(u,'login','account',u::text); end if;
  update core_integration set last_check_at=now(), last_ok=true, last_ok_at=now(), last_error=null where id=1;
  return public.athar_me();
end $$;

revoke all on function athar.is_admin_tier(uuid) from public, anon, authenticated;
