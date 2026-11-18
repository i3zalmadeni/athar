-- 0008: أثر نظام استبانات لقياس الأثر. خمس فئات: متعلم، معلم، هيئة إدارية، جهة مشرفة، ولي أمر.
-- المعلم والإداري بحساب النواة (المشاركة مفصولة عن الإجابات)، والبقية برابط بلا دخول (اسم وبريد وجوال اختيارية).
-- بعد الإغلاق تُنشأ دراسة (لقطة نتائج + تحليل + توصيات) تُعتمد ثم تظهر للمشاركين من المنسوبين.

-- 1) إزالة مسار تسجيل الطلاب وأولياء الأمور السابق (لا بيانات فيه)
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('athar_public_intake_info','athar_public_submit','athar_admin_create_intake_link','athar_admin_intake_links','athar_admin_set_intake_link','athar_admin_links','athar_admin_link_decide','athar_admin_student_verify','athar_admin_students','athar_admin_save_survey','athar_survey_results','athar_surveys_me','athar_survey_get','athar_survey_submit','athar_admin_surveys','athar_admin_get_survey','athar_admin_dashboard','athar_admin_set_survey_status','athar_admin_delete_survey')
  loop execute 'drop function '||f.sig; end loop; end $$;
drop table if exists athar.guardian_students, athar.guardians, athar.students, athar.intake_log, athar.intake_links cascade;
delete from athar.role_permissions where permission_code in ('links:review','students:view','students:verify','intake:manage');
delete from athar.account_permissions where permission_code in ('links:review','students:view','students:verify','intake:manage');
delete from athar.permissions where code in ('links:review','students:view','students:verify','intake:manage');
delete from athar.account_roles where role_code in ('student_affairs','student','parent');
delete from athar.roles where code in ('student_affairs','student','parent');
delete from athar.system_settings where key='intake.max_per_ip_10min';
insert into athar.system_settings(key,value,description) values ('surveys.max_per_ip_10min','100','الحد الأقصى لإرسال استبانات عامة من عنوان واحد خلال 10 دقائق (شبكة المدرسة تشترك في عنوان واحد)') on conflict do nothing;

-- 2) فئة المنسوب من النواة (teaching | administrative | support)
alter table athar.accounts add column if not exists category text;
drop function if exists athar.core_staff(uuid);
create function athar.core_staff(u uuid) returns table(staff_id uuid, full_name text, is_active boolean, login_id text, category text)
  language sql stable security definer set search_path=athar,pg_temp as $$
  select sm.id, sm.full_name, sm.is_active, sp.login_id, sm.category from public.staff_members sm left join public.staff_private sp on sp.staff_id=sm.id where sm.user_id=u limit 1 $$;
revoke all on function athar.core_staff(uuid) from public, anon, authenticated;
create function athar.audience_ok(aud text, cat text) returns boolean language sql immutable as $$
  select (aud='teacher' and cat='teaching') or (aud='administrative' and cat='administrative') $$;

-- 3) الاستبانات: الفئة والرابط والمحاور والتوصيات
alter table athar.surveys add column audience text not null default 'teacher' check (audience in ('student','teacher','administrative','supervisor','parent'));
alter table athar.surveys add column token text unique;
alter table athar.surveys add column target_count int check (target_count is null or target_count > 0);
alter table athar.survey_questions add column domain text check (domain in ('process','environment','leadership'));
alter table athar.survey_questions add column recommendation text;
alter table athar.survey_questions add column strength text;
create table athar.survey_respondents(
  set_id uuid primary key, survey_id uuid not null references athar.surveys(id) on delete cascade,
  name text check (char_length(name) <= 100), email text check (char_length(email) <= 120), phone text check (char_length(phone) <= 20),
  created_at timestamptz not null default now());
create table athar.survey_log(id bigserial primary key, ip text not null, created_at timestamptz not null default now());
create index on athar.survey_log(ip, created_at);
create table athar.studies(
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null unique references athar.surveys(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','approved')),
  snapshot jsonb not null, note text check (char_length(note) <= 4000), recommendations jsonb not null default '[]',
  created_by uuid references athar.accounts(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  approved_by uuid references athar.accounts(id) on delete set null, approved_at timestamptz);
alter table athar.survey_respondents enable row level security; alter table athar.survey_log enable row level security; alter table athar.studies enable row level security;
revoke all on athar.survey_respondents, athar.survey_log, athar.studies from public, anon, authenticated;
update athar.surveys set audience='teacher';

-- 4) دوال داخلية: التحقق من الإجابات، والتجميع
create function athar.survey_n(p_id uuid) returns int language sql stable security definer set search_path=athar,pg_temp as $$
  select (select count(*) from survey_participation where survey_id=p_id)::int + (select count(*) from survey_respondents where survey_id=p_id)::int $$;
create function athar.survey_rows(p_id uuid, p_answers jsonb) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare q record; v jsonb; t text; k int; rows_ jsonb := '[]'; begin
  p_answers := coalesce(p_answers,'{}');
  if jsonb_typeof(p_answers)<>'object' then raise exception 'invalid_input'; end if;
  for q in select * from survey_questions where survey_id=p_id order by position loop
    v := p_answers->(q.id::text);
    if v is null or v='null'::jsonb or (jsonb_typeof(v)='string' and trim(v#>>'{}')='') then
      if q.required then raise exception 'invalid_input'; else continue; end if; end if;
    if q.kind='scale' then
      if jsonb_typeof(v)<>'number' or (v#>>'{}') !~ '^[1-5]$' then raise exception 'invalid_input'; end if;
      rows_ := rows_ || jsonb_build_array(jsonb_build_object('q',q.id,'n',(v#>>'{}')::int));
    elsif q.kind='choice' then
      if jsonb_typeof(v)<>'number' or (v#>>'{}') !~ '^[0-9]{1,2}$' then raise exception 'invalid_input'; end if;
      k := (v#>>'{}')::int; if k >= jsonb_array_length(q.options) then raise exception 'invalid_input'; end if;
      rows_ := rows_ || jsonb_build_array(jsonb_build_object('q',q.id,'n',k));
    else
      if jsonb_typeof(v)<>'string' then raise exception 'invalid_input'; end if;
      t := trim(v#>>'{}'); if char_length(t)>1000 then raise exception 'invalid_input'; end if;
      rows_ := rows_ || jsonb_build_array(jsonb_build_object('q',q.id,'t',t));
    end if;
  end loop;
  return rows_;
end $$;
create function athar.survey_items(p_id uuid, p_texts boolean) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select coalesce(jsonb_agg(item order by pos),'[]') from (
    select q.position pos, case q.kind
      when 'scale' then jsonb_build_object('id',q.id,'kind','scale','domain',q.domain,'prompt',q.prompt,'answered',sc.cnt,'mean',round(sc.av,2),
         'dist',jsonb_build_array(sc.c1,sc.c2,sc.c3,sc.c4,sc.c5),
         'favorable_pct',case when sc.cnt>0 then round(100.0*(sc.c4+sc.c5)/sc.cnt) end,'unfavorable_pct',case when sc.cnt>0 then round(100.0*(sc.c1+sc.c2)/sc.cnt) end)
      when 'choice' then jsonb_build_object('id',q.id,'kind','choice','domain',q.domain,'prompt',q.prompt,
         'options',(select jsonb_agg(jsonb_build_object('label',o.v,'count',coalesce(k.c,0),'pct',case when tt.tot>0 then round(100.0*coalesce(k.c,0)/tt.tot) else 0 end) order by o.ord)
            from jsonb_array_elements_text(q.options) with ordinality o(v,ord)
            left join (select num, count(*) c from survey_answers where question_id=q.id group by num) k on k.num=o.ord-1
            cross join (select count(*) tot from survey_answers where question_id=q.id) tt))
      else jsonb_build_object('id',q.id,'kind','text','domain',q.domain,'prompt',q.prompt,'answered',(select count(*) from survey_answers where question_id=q.id and txt is not null),
         'texts',case when p_texts then (select coalesce(jsonb_agg(txt order by random()),'[]') from survey_answers where question_id=q.id and txt is not null) end)
    end item
    from survey_questions q
    left join lateral (select count(num) cnt, avg(num) av, count(*) filter (where num=1) c1, count(*) filter (where num=2) c2, count(*) filter (where num=3) c3,
        count(*) filter (where num=4) c4, count(*) filter (where num=5) c5 from survey_answers a where a.question_id=q.id) sc on q.kind='scale'
    where q.survey_id=p_id) z $$;
create function athar.survey_eligible(p_id uuid) returns int language sql stable security definer set search_path=athar,pg_temp as $$
  select case s.audience
    when 'teacher' then (select count(*) from accounts a where a.status='active' and a.category='teaching')::int
    when 'administrative' then (select count(*) from accounts a where a.status='active' and a.category='administrative')::int
    else s.target_count end from surveys s where s.id=p_id $$;
create function athar.domain_name(d text) returns text language sql immutable as $$
  select case d when 'process' then 'العملية التربوية' when 'environment' then 'البيئة المدرسية' when 'leadership' then 'الإدارة والقيادة التعليمية' else 'عام' end $$;

-- 5) تسجيل دخول المنسوب (مع الفئة)، ثم لوحة الإدارة
create or replace function public.athar_staff_session() returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare u uuid := auth.uid(); c record; a accounts; lid text; v_admin boolean; v_coord boolean; begin
  if u is null then raise exception 'forbidden' using errcode='42501'; end if;
  select * into c from athar.core_staff(u);
  if not found then raise exception 'not_staff' using errcode='42501'; end if;
  if not c.is_active then raise exception 'core_inactive' using errcode='42501'; end if;
  lid := lower(coalesce(nullif(c.login_id,''), c.staff_id::text));
  insert into accounts(id,user_type,login_id,display_name,status,category) values (u,'staff',lid,c.full_name,'active',c.category)
    on conflict (id) do update set display_name=excluded.display_name, login_id=excluded.login_id, category=excluded.category, updated_at=now();
  insert into profiles(account_id) values (u) on conflict do nothing;
  insert into account_roles(account_id,role_code) select u,'staff' where not exists(select 1 from account_roles where account_id=u);
  select exists(select 1 from public.staff_roles r where r.staff_id=c.staff_id and r.ended_on is null and r.role_code='core_admin') into v_admin;
  select exists(select 1 from public.staff_roles r where r.staff_id=c.staff_id and r.ended_on is null and r.role_code='coordinator' and r.system_code=coalesce(athar.setting('core.coordinator_system')#>>'{}','athar')) into v_coord;
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
create function public.athar_admin_dashboard() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require_active('staff');
  return jsonb_build_object(
   'open_surveys', case when athar.can('surveys:manage') then (select count(*) from surveys where status='open') end,
   'draft_surveys', case when athar.can('surveys:manage') then (select count(*) from surveys where status='draft') end,
   'responses', case when athar.can('surveys:manage') then (select count(*) from survey_participation)+(select count(*) from survey_respondents) end,
   'studies_pending', case when athar.can('surveys:manage') then (select count(*) from studies where status='draft') end,
   'staff_accounts', case when athar.can('accounts:view') then (select count(*) from accounts where status='active') end);
end $$;

-- 6) استبانات المنسوب
create function public.athar_surveys_me() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare cat text; begin perform athar.require_active('staff');
  select category into cat from accounts where id=auth.uid();
  return jsonb_build_object(
    'pending', (select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
      select s.id, s.title, s.description, s.audience, s.required, s.closes_at, s.created_at, (select count(*) from survey_questions q where q.survey_id=s.id) questions
      from surveys s where s.status='open' and (s.closes_at is null or s.closes_at>now()) and athar.audience_ok(s.audience, cat)
        and not exists(select 1 from survey_participation p where p.survey_id=s.id and p.account_id=auth.uid())) x),
    'participated', (select coalesce(jsonb_agg(x order by x.submitted_at desc),'[]') from (
      select s.id, s.title, s.audience, s.status, p.submitted_at, st.id study_id, (st.id is not null) study_ready
      from survey_participation p join surveys s on s.id=p.survey_id
      left join studies st on st.survey_id=s.id and st.status='approved' where p.account_id=auth.uid()) x));
end $$;
create function public.athar_survey_get(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; cat text; begin perform athar.require_active('staff');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  select category into cat from accounts where id=auth.uid();
  if not athar.can('surveys:manage') then
    if s.status<>'open' or (s.closes_at is not null and s.closes_at<=now()) then raise exception 'survey_closed'; end if;
    if not athar.audience_ok(s.audience, cat) then raise exception 'forbidden' using errcode='42501'; end if;
  end if;
  if exists(select 1 from survey_participation where survey_id=p_id and account_id=auth.uid()) then raise exception 'already_submitted'; end if;
  return jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'required',s.required,'closes_at',s.closes_at,'status',s.status,
    'questions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'kind',q.kind,'domain',q.domain,'prompt',q.prompt,'options',q.options,'required',q.required) order by q.position),'[]') from survey_questions q where q.survey_id=p_id));
end $$;
create function public.athar_survey_submit(p_id uuid, p_answers jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; cat text; rows_ jsonb; sid uuid := gen_random_uuid(); begin
  perform athar.require_active('staff');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  select category into cat from accounts where id=auth.uid();
  if s.status<>'open' or (s.closes_at is not null and s.closes_at<=now()) then raise exception 'survey_closed'; end if;
  if not athar.audience_ok(s.audience, cat) then raise exception 'forbidden' using errcode='42501'; end if;
  rows_ := athar.survey_rows(p_id, p_answers);
  begin insert into survey_participation(survey_id,account_id) values (p_id,auth.uid());
  exception when unique_violation then raise exception 'already_submitted'; end;
  insert into survey_answers(survey_id,set_id,question_id,num,txt)
    select p_id, sid, (e->>'q')::uuid, (e->>'n')::int, e->>'t' from jsonb_array_elements(rows_) e;
  perform athar.log_as(auth.uid(),'survey.submit','survey',p_id::text);
end $$;

-- 7) الاستبانات العامة (بلا دخول): متعلم، ولي أمر، جهة مشرفة
create function public.athar_public_survey_info(p_token text) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select coalesce((select jsonb_build_object('valid',true,'audience',s.audience,'title',s.title,'description',s.description,
      'questions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'kind',q.kind,'prompt',q.prompt,'options',q.options,'required',q.required) order by q.position),'[]') from survey_questions q where q.survey_id=s.id))
    from surveys s where s.token=p_token and s.status='open' and s.audience in ('student','parent','supervisor') and (s.closes_at is null or s.closes_at>now())), jsonb_build_object('valid',false)) $$;
create function public.athar_public_survey_submit(p_token text, p_payload jsonb) returns jsonb language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; hdr json; v_ip text := ''; n int; mx int := coalesce((athar.setting('surveys.max_per_ip_10min')#>>'{}')::int,100);
  nm text; em text; ph text; rows_ jsonb; sid uuid := gen_random_uuid(); begin
  p_payload := coalesce(p_payload,'{}');
  select * into s from surveys where token=p_token and status='open' and audience in ('student','parent','supervisor') and (closes_at is null or closes_at>now());
  if not found then return jsonb_build_object('ok',false,'error','invalid_link'); end if;
  if nullif(trim(p_payload->>'website'),'') is not null then return jsonb_build_object('ok',true); end if;
  begin hdr := current_setting('request.headers', true)::json; v_ip := trim(split_part(coalesce(hdr->>'x-forwarded-for',''), ',', 1)); exception when others then v_ip := ''; end;
  if v_ip <> '' then
    select count(*) into n from survey_log where ip=v_ip and created_at > now() - interval '10 minutes';
    if n >= mx then return jsonb_build_object('ok',false,'error','rate_limited'); end if;
    insert into survey_log(ip) values (v_ip);
  end if;
  nm := nullif(trim(coalesce(p_payload->>'name','')),''); em := nullif(trim(coalesce(p_payload->>'email','')),''); ph := nullif(trim(coalesce(p_payload->>'phone','')),'');
  if nm is not null and char_length(nm)>100 then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  if em is not null and (char_length(em)>120 or em !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  if ph is not null and ph !~ '^[0-9+() -]{7,20}$' then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  begin rows_ := athar.survey_rows(s.id, p_payload->'answers');
  exception when others then if sqlerrm='invalid_input' then return jsonb_build_object('ok',false,'error','invalid_input'); end if; raise; end;
  insert into survey_respondents(set_id,survey_id,name,email,phone) values (sid,s.id,nm,em,ph);
  insert into survey_answers(survey_id,set_id,question_id,num,txt)
    select s.id, sid, (e->>'q')::uuid, (e->>'n')::int, e->>'t' from jsonb_array_elements(rows_) e;
  return jsonb_build_object('ok',true);
end $$;

-- 8) إدارة الاستبانات
create function public.athar_admin_surveys() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  return (select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.audience, s.status, s.required, s.closes_at, s.created_at, s.token, s.target_count,
      (select count(*) from survey_questions q where q.survey_id=s.id) questions,
      athar.survey_n(s.id) responses, st.id study_id, st.status study_status
    from surveys s left join studies st on st.survey_id=s.id) x);
end $$;
create function public.athar_admin_get_survey(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  return jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'required',s.required,'closes_at',s.closes_at,'status',s.status,'target_count',s.target_count,
    'questions',(select coalesce(jsonb_agg(jsonb_build_object('kind',q.kind,'domain',q.domain,'prompt',q.prompt,'options',q.options,'required',q.required,'recommendation',q.recommendation,'strength',q.strength) order by q.position),'[]') from survey_questions q where q.survey_id=p_id));
end $$;
create function public.athar_admin_save_survey(p_id uuid, p_title text, p_description text, p_audience text, p_required boolean, p_closes timestamptz, p_target int, p_questions jsonb) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare sid uuid := p_id; st text; e jsonb; i int := 0; k text; opts jsonb; dm text; begin
  perform athar.require('surveys:manage');
  p_title := trim(coalesce(p_title,'')); p_description := nullif(trim(coalesce(p_description,'')),'');
  if char_length(p_title) not between 4 and 160 or coalesce(char_length(p_description),0)>1000 then raise exception 'invalid_input'; end if;
  if p_audience not in ('student','teacher','administrative','supervisor','parent') then raise exception 'invalid_input'; end if;
  if p_target is not null and p_target<1 then raise exception 'invalid_input'; end if;
  if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not between 1 and 10 then raise exception 'invalid_input'; end if;
  if sid is null then
    insert into surveys(title,description,audience,required,closes_at,target_count,created_by) values (p_title,p_description,p_audience,coalesce(p_required,true),p_closes,p_target,auth.uid()) returning id into sid;
  else
    select status into st from surveys where id=sid; if not found then raise exception 'not_found'; end if;
    if st<>'draft' then raise exception 'not_draft'; end if;
    update surveys set title=p_title, description=p_description, audience=p_audience, required=coalesce(p_required,true), closes_at=p_closes, target_count=p_target where id=sid;
    delete from survey_questions where survey_id=sid;
  end if;
  for e in select * from jsonb_array_elements(p_questions) loop
    i := i+1; k := e->>'kind'; dm := nullif(e->>'domain','');
    if k not in ('scale','choice','text') or char_length(trim(coalesce(e->>'prompt','')))<3 or char_length(e->>'prompt')>300 then raise exception 'invalid_input'; end if;
    if dm is not null and dm not in ('process','environment','leadership') then raise exception 'invalid_input'; end if;
    if char_length(coalesce(e->>'recommendation',''))>600 or char_length(coalesce(e->>'strength',''))>600 then raise exception 'invalid_input'; end if;
    opts := null;
    if k='choice' then
      opts := e->'options';
      if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts) not between 2 and 8 or exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or char_length(trim(o#>>'{}')) not between 1 and 100) then raise exception 'invalid_input'; end if;
    end if;
    insert into survey_questions(survey_id,position,kind,domain,prompt,options,required,recommendation,strength)
      values (sid,i,k,dm,trim(e->>'prompt'),opts,coalesce((e->>'required')::boolean,true),nullif(trim(coalesce(e->>'recommendation','')),''),nullif(trim(coalesce(e->>'strength','')),''));
  end loop;
  perform athar.log_as(auth.uid(),case when p_id is null then 'survey.create' else 'survey.update' end,'survey',sid::text);
  return sid;
end $$;
create function public.athar_admin_set_survey_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; r record; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if p_status='open' and s.status='draft' then
    if not exists(select 1 from survey_questions where survey_id=p_id) then raise exception 'invalid_input'; end if;
    update surveys set status='open', opened_at=now(),
      token=case when audience in ('student','parent','supervisor') then coalesce(token, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')) else token end where id=p_id;
    if s.audience in ('teacher','administrative') then
      for r in select id from accounts where status='active' and user_type='staff' and athar.audience_ok(s.audience, category) loop
        perform athar.notify(r.id,'system',case when s.required then 'استبانة مطلوبة منك' else 'استبانة جديدة' end,s.title,'dashboard.html'); end loop;
    end if;
  elsif p_status='closed' and s.status='open' then update surveys set status='closed', closed_at=now() where id=p_id;
  else raise exception 'invalid_value'; end if;
  perform athar.log_as(auth.uid(),'survey.'||p_status,'survey',p_id::text);
end $$;
create function public.athar_admin_delete_survey(p_id uuid) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  delete from surveys where id=p_id and status='draft'; if not found then raise exception 'not_draft'; end if;
  perform athar.log_as(auth.uid(),'survey.delete','survey',p_id::text);
end $$;
create function public.athar_admin_respondents(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  return jsonb_build_object('total',(select count(*) from survey_respondents where survey_id=p_id),
    'with_contact',(select coalesce(jsonb_agg(jsonb_build_object('name',name,'email',email,'phone',phone,'at',created_at) order by created_at),'[]') from survey_respondents where survey_id=p_id and (name is not null or email is not null or phone is not null)));
end $$;

-- 9) نتائج مجمّعة (للمدير) والدراسات
create function public.athar_survey_results(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; n int; minr int; el int; items jsonb; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  n := athar.survey_n(p_id); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_id);
  if n < minr then return jsonb_build_object('survey',jsonb_build_object('id',s.id,'title',s.title,'audience',s.audience,'status',s.status),'participants',n,'eligible',el,'hidden',true,'min',minr); end if;
  items := athar.survey_items(p_id, true);
  return jsonb_build_object('survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'status',s.status,'closed_at',s.closed_at),
    'participants',n,'eligible',el,'rate_pct',case when coalesce(el,0)>0 then least(100,round(100.0*n/el)) end,'hidden',false,'items',items);
end $$;
create function public.athar_admin_generate_study(p_survey uuid) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; n int; minr int; el int; items jsonb; overall numeric; lvl text; doms jsonb; strengths jsonb; gaps jsonb; recs jsonb; sid uuid; ex studies; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_survey; if not found then raise exception 'not_found'; end if;
  if s.status<>'closed' then raise exception 'survey_not_closed'; end if;
  select * into ex from studies where survey_id=p_survey; if found and ex.status='approved' then raise exception 'study_approved'; end if;
  n := athar.survey_n(p_survey); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_survey);
  if n < minr then raise exception 'insufficient_data'; end if;
  items := athar.survey_items(p_survey, false);
  select round(avg((e->>'mean')::numeric),2) into overall from jsonb_array_elements(items) e where e->>'kind'='scale' and e->>'mean' is not null;
  lvl := case when overall is null then 'غير متاح' when overall>=4.2 then 'مستوى مرتفع' when overall>=3.5 then 'مستوى جيد' when overall>=3.0 then 'مستوى متوسط يحتاج تحسيناً' else 'مستوى منخفض يحتاج تدخلاً' end;
  select coalesce(jsonb_agg(jsonb_build_object('code',d.dm,'name',athar.domain_name(d.dm),'mean',d.m,'items',d.c) order by d.m desc),'[]') into doms from (
    select coalesce(e->>'domain','general') dm, round(avg((e->>'mean')::numeric),2) m, count(*) c from jsonb_array_elements(items) e where e->>'kind'='scale' and e->>'mean' is not null group by 1) d;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m,'domain',athar.domain_name(x.dm),'text',x.t) order by x.m desc),'[]') into strengths from (
    select e->>'prompt' p, (e->>'mean')::numeric m, e->>'domain' dm, q.strength t from jsonb_array_elements(items) e join survey_questions q on q.id=(e->>'id')::uuid
    where e->>'kind'='scale' and (e->>'mean')::numeric>=4 order by m desc limit 4) x;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m,'domain',athar.domain_name(x.dm)) order by x.m),'[]') into gaps from (
    select e->>'prompt' p, (e->>'mean')::numeric m, e->>'domain' dm from jsonb_array_elements(items) e
    where e->>'kind'='scale' and (e->>'mean')::numeric<3.5 order by m limit 6) x;
  select coalesce(jsonb_agg(jsonb_build_object('priority',case when x.m<3 then 'عالية' else 'متوسطة' end,'text',coalesce(x.r,'مراجعة «'||x.p||'» ووضع خطة تحسين بمؤشر قياس واضح'),'basis','متوسط '||x.m||' من 5 في «'||x.p||'»') order by x.m),'[]') into recs from (
    select e->>'prompt' p, (e->>'mean')::numeric m, q.recommendation r from jsonb_array_elements(items) e join survey_questions q on q.id=(e->>'id')::uuid
    where e->>'kind'='scale' and (e->>'mean')::numeric<3.5 order by m limit 6) x;
  if jsonb_array_length(recs)=0 then recs := jsonb_build_array(jsonb_build_object('priority','متابعة','text','المحافظة على المستوى الحالي وتوثيق الممارسات الناجحة ومشاركتها.','basis','لا توجد بنود دون 3.5 من 5')); end if;
  recs := recs || jsonb_build_array(jsonb_build_object('priority','متابعة','text','إعادة القياس بالأداة نفسها بعد فصل دراسي لمتابعة أثر الإجراءات.','basis','قياس الأثر'));
  insert into studies(survey_id,status,snapshot,recommendations,created_by)
    values (p_survey,'draft',jsonb_build_object('generated_at',now(),'survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'closed_at',s.closed_at),
      'participants',n,'eligible',el,'rate_pct',case when coalesce(el,0)>0 then least(100,round(100.0*n/el)) end,'overall_mean',overall,'level',lvl,'domains',doms,'strengths',strengths,'gaps',gaps,'items',items),recs,auth.uid())
    on conflict (survey_id) do update set snapshot=excluded.snapshot, recommendations=excluded.recommendations, updated_at=now(), created_by=auth.uid()
    returning id into sid;
  perform athar.log_as(auth.uid(),'study.generate','study',sid::text);
  return sid;
end $$;
create function public.athar_admin_studies() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  return (select coalesce(jsonb_agg(x order by x.updated_at desc),'[]') from (
    select st.id, st.status, st.updated_at, st.approved_at, s.title, s.audience, (st.snapshot->>'participants')::int participants, st.snapshot->>'overall_mean' overall_mean, st.snapshot->>'level' level
    from studies st join surveys s on s.id=st.survey_id) x);
end $$;
create function public.athar_study_get(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare st studies; mgr boolean; begin perform athar.require_active('staff');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  mgr := athar.can('surveys:manage');
  if not mgr and not (st.status='approved' and exists(select 1 from survey_participation where survey_id=st.survey_id and account_id=auth.uid())) then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object('id',st.id,'status',st.status,'survey_id',st.survey_id,'approved_at',st.approved_at,'note',st.note,'recommendations',st.recommendations,'snapshot',st.snapshot,'can_manage',mgr);
end $$;
create function public.athar_admin_update_study(p_id uuid, p_note text, p_recommendations jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare st studies; begin perform athar.require('surveys:manage');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  if st.status<>'draft' then raise exception 'not_draft'; end if;
  if jsonb_typeof(p_recommendations)<>'array' or jsonb_array_length(p_recommendations)>20 or exists(select 1 from jsonb_array_elements(p_recommendations) r where jsonb_typeof(r->'text')<>'string' or char_length(r->>'text') not between 3 and 600) then raise exception 'invalid_input'; end if;
  update studies set note=nullif(trim(coalesce(p_note,'')),''), recommendations=p_recommendations, updated_at=now() where id=p_id;
  perform athar.log_as(auth.uid(),'study.update','study',p_id::text);
end $$;
create function public.athar_admin_approve_study(p_id uuid) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare st studies; ti text; r record; begin perform athar.require('surveys:manage');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  if st.status='approved' then return; end if;
  update studies set status='approved', approved_by=auth.uid(), approved_at=now(), updated_at=now() where id=p_id;
  select title into ti from surveys where id=st.survey_id;
  for r in select account_id from survey_participation where survey_id=st.survey_id loop
    perform athar.notify(r.account_id,'system','اعتُمدت دراسة شاركت فيها',ti,'study.html?id='||p_id); end loop;
  perform athar.log_as(auth.uid(),'study.approve','study',p_id::text);
end $$;

-- 10) الصلاحيات: كل الدوال للمصادَق عليهم، وللزائر ثلاث دوال فقط
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'athar\_%'
  loop execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.proname in ('athar_public_info','athar_public_survey_info','athar_public_survey_submit') then execute format('grant execute on function %s to anon, authenticated', f.sig);
    else execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
