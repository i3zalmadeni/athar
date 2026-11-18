-- 0004: دخول المنسوبين بحساب النواة الموحّد (جلسة Supabase المشتركة) + دوال روابط التعبئة العامة.
-- التحقق من الهوية قراءة فقط من سجل المنسوبين في النواة عبر دالة محكومة؛ لا كتابة في النواة ولا نسخ لبياناتها عدا الاسم المعروض.
create function athar.core_staff(u uuid) returns table(staff_id uuid, full_name text, is_active boolean, login_id text)
language sql stable security definer set search_path=athar,pg_temp as $$
  select sm.id, sm.full_name, sm.is_active, sp.login_id from public.staff_members sm left join public.staff_private sp on sp.staff_id=sm.id where sm.user_id=u limit 1 $$;

create function public.athar_staff_session() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare u uuid := auth.uid(); c record; a accounts; lid text; begin
  if u is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into c from athar.core_staff(u);
  if not found then raise exception 'not_staff' using errcode='42501'; end if;
  if not c.is_active then raise exception 'core_inactive' using errcode='42501'; end if;
  lid := lower(coalesce(nullif(c.login_id,''), c.staff_id::text));
  insert into accounts(id,user_type,login_id,display_name,status) values (u,'staff',lid,c.full_name,'active')
    on conflict (id) do update set display_name=excluded.display_name, login_id=excluded.login_id, updated_at=now();
  insert into profiles(account_id) values (u) on conflict do nothing;
  insert into account_roles(account_id,role_code) select u,'staff' where not exists(select 1 from account_roles where account_id=u);
  insert into staff_links(account_id,core_staff_id,core_source) values (u,c.staff_id,'db')
    on conflict (account_id) do update set core_staff_id=excluded.core_staff_id, verified_at=now();
  select * into a from accounts where id=u;
  if a.status='active' then update accounts set last_login_at=now() where id=u; perform athar.log_as(u,'login','account',u::text); end if;
  update core_integration set last_check_at=now(), last_ok=true, last_ok_at=now(), last_error=null where id=1;
  return public.athar_me();
end $$;

create or replace function public.athar_me() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare a accounts; begin
  select * into a from accounts where id=auth.uid();
  if not found then return null; end if;
  return jsonb_build_object('id',a.id,'login_id',a.login_id,'display_name',a.display_name,'user_type',a.user_type,'status',a.status,
    'status_note',a.status_note,'last_login_at',a.last_login_at,'created_at',a.created_at,
    'roles',(select coalesce(jsonb_agg(jsonb_build_object('code',r.code,'name_ar',r.name_ar,'scope',r.data_scope)),'[]') from account_roles ar join roles r on r.code=ar.role_code where ar.account_id=a.id),
    'permissions',(select coalesce(jsonb_agg(p.code order by p.code),'[]') from permissions p where athar.can_acct(a.id,p.code)),
    'profile',(select to_jsonb(p)-'account_id' from profiles p where p.account_id=a.id),
    'staff_link',(select jsonb_build_object('core_source',s.core_source,'verified_at',s.verified_at) from staff_links s where s.account_id=a.id),
    'unread',(select count(*) from notifications n where n.account_id=a.id and n.status='sent'),
    'core_mode',(select mode from core_integration where id=1));
end $$;
create or replace function public.athar_public_info() returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select jsonb_build_object('core_mode',(select mode from core_integration where id=1)) $$;
create or replace function public.athar_core_status() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('integration:view');
  return (select to_jsonb(c)-'id' || jsonb_build_object('linked_staff',(select count(*) from staff_links)) from core_integration c where id=1); end $$;
create or replace function public.athar_admin_dashboard() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require_active('staff');
  return jsonb_build_object(
   'pending_links', case when athar.can('links:review') then (select count(*) from guardian_students where status='pending') end,
   'pending_students', case when athar.can('students:verify') then (select count(*) from students where verification_status='unverified') end,
   'active_intake_links', case when athar.can('intake:manage') then (select count(*) from intake_links where active and (expires_at is null or expires_at>now()) and (max_uses is null or uses<max_uses)) end,
   'staff_accounts', case when athar.can('accounts:view') then (select count(*) from accounts where status='active') end);
end $$;
create or replace function public.athar_admin_links(p_status text default 'pending') returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  perform athar.require('links:review');
  return (select coalesce(jsonb_agg(x),'[]') from (select l.id, l.relation, l.status, l.note, l.requested_at, g.full_name guardian_name, g.phone guardian_phone,
      s.full_name student_name, s.student_no, s.grade, s.section, s.verification_status
    from guardian_students l join guardians g on g.id=l.guardian_id join students s on s.id=l.student_id
    where p_status is null or l.status=p_status order by l.requested_at desc limit 200) x);
end $$;
create or replace function public.athar_admin_link_decide(p_link uuid, p_decision text, p_note text default null) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare l guardian_students; begin
  perform athar.require('links:review');
  if p_decision not in ('verified','rejected') then raise exception 'invalid_decision'; end if;
  select * into l from guardian_students where id=p_link; if not found then raise exception 'not_found'; end if;
  update guardian_students set status=p_decision, note=nullif(trim(p_note),''), decided_by=auth.uid(), decided_at=now() where id=p_link;
  perform athar.log_as(auth.uid(),'link.'||p_decision,'guardian_student',p_link::text, jsonb_build_object('status',l.status), jsonb_build_object('status',p_decision));
end $$;

-- روابط التعبئة (إدارة)
create function public.athar_admin_create_intake_link(p_kind text, p_label text, p_expires timestamptz default null, p_max_uses int default null) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare tok text := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-',''); lid uuid; begin
  perform athar.require('intake:manage');
  if p_kind not in ('student','parent') then raise exception 'invalid_value'; end if;
  if char_length(trim(coalesce(p_label,''))) not between 3 and 80 then raise exception 'invalid_value'; end if;
  if p_expires is not null and p_expires <= now() then raise exception 'invalid_value'; end if;
  if p_max_uses is not null and p_max_uses < 1 then raise exception 'invalid_value'; end if;
  insert into intake_links(token,kind,label,expires_at,max_uses,created_by) values (tok,p_kind,trim(p_label),p_expires,p_max_uses,auth.uid()) returning id into lid;
  perform athar.log_as(auth.uid(),'intake.create','intake_link',lid::text,null,jsonb_build_object('kind',p_kind,'label',p_label));
  return jsonb_build_object('id',lid,'token',tok);
end $$;
create function public.athar_admin_intake_links() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('intake:manage');
  return (select coalesce(jsonb_agg(x),'[]') from (select id, token, kind, label, expires_at, max_uses, uses, active, created_at,
      (active and (expires_at is null or expires_at>now()) and (max_uses is null or uses<max_uses)) usable from intake_links order by created_at desc limit 200) x); end $$;
create function public.athar_admin_set_intake_link(p_id uuid, p_active boolean) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('intake:manage');
  update intake_links set active=p_active where id=p_id; if not found then raise exception 'not_found'; end if;
  perform athar.log_as(auth.uid(),'intake.'||case when p_active then 'enable' else 'disable' end,'intake_link',p_id::text); end $$;

-- التعبئة العامة (بلا دخول): تحقق من الرابط ثم استلام النموذج. الأخطاء المتوقعة تُعاد كنتيجة لا استثناء حتى يبقى سجل التحديد بالعنوان.
create function public.athar_public_intake_info(p_token text) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select coalesce((select jsonb_build_object('valid',true,'kind',kind,'label',label) from intake_links
    where token=p_token and active and (expires_at is null or expires_at>now()) and (max_uses is null or uses<max_uses)), jsonb_build_object('valid',false)) $$;
create function public.athar_public_submit(p_token text, p_payload jsonb) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare l intake_links; hdr json; v_ip text := ''; n int := 0; mx int := coalesce((athar.setting('intake.max_per_ip_10min')#>>'{}')::int, 20);
  nm text; sno text; sid uuid; gid uuid; ph text; rel text; gr text; bd date; begin
  p_payload := coalesce(p_payload,'{}');
  select * into l from intake_links where token=p_token and active and (expires_at is null or expires_at>now()) and (max_uses is null or uses<max_uses) for update;
  if not found then return jsonb_build_object('ok',false,'error','invalid_link'); end if;
  if nullif(trim(p_payload->>'website'),'') is not null then return jsonb_build_object('ok',true); end if;
  begin hdr := current_setting('request.headers', true)::json; v_ip := trim(split_part(coalesce(hdr->>'x-forwarded-for',''), ',', 1)); exception when others then v_ip := ''; end;
  if v_ip <> '' then
    select count(*) into n from intake_log il where il.ip = v_ip and il.created_at > now() - interval '10 minutes';
    if n >= mx then return jsonb_build_object('ok',false,'error','rate_limited'); end if;
    insert into intake_log(ip, link_id) values (v_ip, l.id);
  end if;
  nm := trim(coalesce(p_payload->>'full_name',''));
  if char_length(nm) not between 6 and 100 then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  sno := trim(coalesce(p_payload->>'student_no',''));
  if sno !~ '^[0-9A-Za-z-]{4,20}$' then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  if l.kind='student' then
    gr := p_payload->>'grade';
    if gr is null or gr not in ('الأول المتوسط','الثاني المتوسط','الثالث المتوسط') then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
    begin bd := nullif(p_payload->>'birth_date','')::date; exception when others then return jsonb_build_object('ok',false,'error','invalid_input'); end;
    begin
      insert into students(full_name,student_no,grade,section,birth_date,intake_link_id)
        values (nm,sno,gr,nullif(left(trim(coalesce(p_payload->>'section','')),20),''),bd,l.id) returning id into sid;
    exception when unique_violation then return jsonb_build_object('ok',false,'error','student_no_taken'); end;
    perform athar.notify_perm('students:verify','registration','تعبئة بيانات طالب جديد', nm, 'admin.html#students');
  else
    ph := regexp_replace(trim(coalesce(p_payload->>'phone','')),'\s+',' ','g'); rel := p_payload->>'relation';
    if ph !~ '^[0-9+ ]{7,20}$' or rel is null or rel not in ('father','mother','guardian','brother','other') then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
    select id into sid from students where student_no=sno;
    if not found then return jsonb_build_object('ok',false,'error','student_not_found'); end if;
    select id into gid from guardians where phone=ph and full_name=nm limit 1;
    if gid is null then insert into guardians(full_name,phone) values (nm,ph) returning id into gid; end if;
    begin insert into guardian_students(guardian_id,student_id,relation) values (gid,sid,rel);
    exception when unique_violation then return jsonb_build_object('ok',false,'error','already_requested'); end;
    perform athar.notify_perm('links:review','link','طلب ربط ولي أمر بطالب', nm, 'admin.html#links');
  end if;
  update intake_links set uses=uses+1 where id=l.id;
  perform athar.log_as(null,'intake.'||l.kind,'intake_link',l.id::text);
  return jsonb_build_object('ok',true);
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'athar\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.proname in ('athar_public_info','athar_public_intake_info','athar_public_submit') then execute format('grant execute on function %s to anon, authenticated', f.sig);
    else execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
revoke all on all functions in schema athar from public, anon, authenticated;
