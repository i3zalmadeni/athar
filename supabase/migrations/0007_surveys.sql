-- 0007: الاستبانات: تعبئة المنسوبين، ونتائج وتحليل وصفي مجمّع. المشاركة مفصولة عن الإجابات (لا رابط بينهما في الجداول).
create table athar.surveys(
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 160),
  description text check (char_length(description) <= 1000),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  required boolean not null default true,
  closes_at timestamptz,
  created_by uuid references athar.accounts(id) on delete set null,
  created_at timestamptz not null default now(), opened_at timestamptz, closed_at timestamptz);
create table athar.survey_questions(
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references athar.surveys(id) on delete cascade,
  position int not null,
  kind text not null check (kind in ('scale','choice','text')),
  prompt text not null check (char_length(prompt) between 3 and 300),
  options jsonb, required boolean not null default true,
  unique(survey_id, position));
create table athar.survey_participation(
  survey_id uuid not null references athar.surveys(id) on delete cascade,
  account_id uuid not null references athar.accounts(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  primary key(survey_id, account_id));
create table athar.survey_answers(
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references athar.surveys(id) on delete cascade,
  set_id uuid not null,
  question_id uuid not null references athar.survey_questions(id) on delete cascade,
  num int, txt text);
create index on athar.survey_answers(question_id);
alter table athar.surveys enable row level security; alter table athar.survey_questions enable row level security;
alter table athar.survey_participation enable row level security; alter table athar.survey_answers enable row level security;
revoke all on athar.surveys, athar.survey_questions, athar.survey_participation, athar.survey_answers from public, anon, authenticated;

insert into athar.permissions(code,name_ar,grp) values ('surveys:manage','إدارة الاستبانات ونتائجها','الاستبانات') on conflict do nothing;
insert into athar.role_permissions values ('admin','surveys:manage'),('athar_coordinator','surveys:manage'),('school_manager','surveys:manage') on conflict do nothing;
insert into athar.system_settings(key,value,description) values ('surveys.min_respondents','5','أقل عدد مشاركين لعرض نتائج استبانة (حماية لخصوصية المشاركين)') on conflict do nothing;

-- استبانات المنسوب: المطلوبة منه، وما شارك فيه
create function public.athar_surveys_me() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require_active('staff');
  return jsonb_build_object(
    'pending', (select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
      select s.id, s.title, s.description, s.required, s.closes_at, s.created_at, (select count(*) from survey_questions q where q.survey_id=s.id) questions
      from surveys s where s.status='open' and (s.closes_at is null or s.closes_at>now())
        and not exists(select 1 from survey_participation p where p.survey_id=s.id and p.account_id=auth.uid())) x),
    'participated', (select coalesce(jsonb_agg(x order by x.submitted_at desc),'[]') from (
      select s.id, s.title, s.status, p.submitted_at, (s.status='closed') results_ready
      from survey_participation p join surveys s on s.id=p.survey_id where p.account_id=auth.uid()) x));
end $$;

create function public.athar_survey_get(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; begin perform athar.require_active('staff');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if not athar.can('surveys:manage') and (s.status<>'open' or (s.closes_at is not null and s.closes_at<=now())) then raise exception 'survey_closed'; end if;
  if exists(select 1 from survey_participation where survey_id=p_id and account_id=auth.uid()) then raise exception 'already_submitted'; end if;
  return jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'required',s.required,'closes_at',s.closes_at,'status',s.status,
    'questions',(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'kind',q.kind,'prompt',q.prompt,'options',q.options,'required',q.required) order by q.position),'[]') from survey_questions q where q.survey_id=p_id));
end $$;

create function public.athar_survey_submit(p_id uuid, p_answers jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; q record; v jsonb; sid uuid := gen_random_uuid(); t text; k int; rows_ jsonb := '[]'; begin
  perform athar.require_active('staff');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if s.status<>'open' or (s.closes_at is not null and s.closes_at<=now()) then raise exception 'survey_closed'; end if;
  p_answers := coalesce(p_answers,'{}');
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
  begin insert into survey_participation(survey_id,account_id) values (p_id,auth.uid());
  exception when unique_violation then raise exception 'already_submitted'; end;
  insert into survey_answers(survey_id,set_id,question_id,num,txt)
    select p_id, sid, (e->>'q')::uuid, (e->>'n')::int, e->>'t' from jsonb_array_elements(rows_) e;
  perform athar.log_as(auth.uid(),'survey.submit','survey',p_id::text);
end $$;

-- نتائج مجمّعة وتحليل وصفي. للمدير دائماً، وللمشارك بعد إغلاق الاستبانة. تُخفى إن قل المشاركون عن الحد.
create function public.athar_survey_results(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; mgr boolean; n int; minr int; staffn int; items jsonb; strengths jsonb; focus jsonb; overall numeric; begin
  perform athar.require_active('staff');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  mgr := athar.can('surveys:manage');
  if not mgr and not (s.status='closed' and exists(select 1 from survey_participation where survey_id=p_id and account_id=auth.uid())) then raise exception 'forbidden' using errcode='42501'; end if;
  n := (select count(*) from survey_participation where survey_id=p_id);
  minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5);
  staffn := (select count(*) from accounts where status='active' and user_type='staff');
  if n < minr then
    return jsonb_build_object('survey',jsonb_build_object('id',s.id,'title',s.title,'status',s.status),'participants',n,'eligible',staffn,'hidden',true,'min',minr); end if;
  select coalesce(jsonb_agg(item order by pos),'[]') into items from (
    select q.position pos, case q.kind
      when 'scale' then jsonb_build_object('id',q.id,'kind','scale','prompt',q.prompt,'answered',sc.cnt,'mean',round(sc.av,2),
         'dist',jsonb_build_array(sc.c1,sc.c2,sc.c3,sc.c4,sc.c5),
         'favorable_pct',case when sc.cnt>0 then round(100.0*(sc.c4+sc.c5)/sc.cnt) end,'unfavorable_pct',case when sc.cnt>0 then round(100.0*(sc.c1+sc.c2)/sc.cnt) end)
      when 'choice' then jsonb_build_object('id',q.id,'kind','choice','prompt',q.prompt,
         'options',(select jsonb_agg(jsonb_build_object('label',o.v,'count',coalesce(k.c,0),'pct',case when tt.tot>0 then round(100.0*coalesce(k.c,0)/tt.tot) else 0 end) order by o.ord)
            from jsonb_array_elements_text(q.options) with ordinality o(v,ord)
            left join (select num, count(*) c from survey_answers where question_id=q.id group by num) k on k.num=o.ord-1
            cross join (select count(*) tot from survey_answers where question_id=q.id) tt))
      else jsonb_build_object('id',q.id,'kind','text','prompt',q.prompt,'answered',(select count(*) from survey_answers where question_id=q.id and txt is not null),
         'texts',case when mgr then (select coalesce(jsonb_agg(txt order by random()),'[]') from survey_answers where question_id=q.id and txt is not null) end)
    end item
    from survey_questions q
    left join lateral (select count(num) cnt, avg(num) av, count(*) filter (where num=1) c1, count(*) filter (where num=2) c2, count(*) filter (where num=3) c3,
        count(*) filter (where num=4) c4, count(*) filter (where num=5) c5 from survey_answers a where a.question_id=q.id) sc on q.kind='scale'
    where q.survey_id=p_id) z;
  select round(avg((e->>'mean')::numeric),2) into overall from jsonb_array_elements(items) e where e->>'kind'='scale' and e->>'mean' is not null;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m) order by x.m desc),'[]') into strengths from (
    select e->>'prompt' p, (e->>'mean')::numeric m from jsonb_array_elements(items) e where e->>'kind'='scale' and (e->>'mean')::numeric>=4 order by m desc limit 3) x;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m) order by x.m),'[]') into focus from (
    select e->>'prompt' p, (e->>'mean')::numeric m from jsonb_array_elements(items) e where e->>'kind'='scale' and (e->>'mean')::numeric<3.5 order by m limit 3) x;
  return jsonb_build_object('survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'status',s.status,'closed_at',s.closed_at),
    'participants',n,'eligible',staffn,'rate_pct',case when staffn>0 then round(100.0*n/staffn) end,'hidden',false,'items',items,
    'analysis',jsonb_build_object('overall_mean',overall,'strengths',strengths,'focus',focus,
      'note','تحليل وصفي آلي من الإجابات المجمّعة: المتوسط على مقياس من 1 إلى 5، والقوة ما بلغ متوسطه 4 فأكثر، والمتابعة ما قل عن 3.5. لا يغني عن القراءة النوعية للإجابات.'));
end $$;

-- إدارة الاستبانات
create function public.athar_admin_surveys() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  return (select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.status, s.required, s.closes_at, s.created_at,
      (select count(*) from survey_questions q where q.survey_id=s.id) questions,
      (select count(*) from survey_participation p where p.survey_id=s.id) participants from surveys s) x);
end $$;
create function public.athar_admin_get_survey(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  return jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'required',s.required,'closes_at',s.closes_at,'status',s.status,
    'questions',(select coalesce(jsonb_agg(jsonb_build_object('kind',q.kind,'prompt',q.prompt,'options',q.options,'required',q.required) order by q.position),'[]') from survey_questions q where q.survey_id=p_id));
end $$;
create function public.athar_admin_save_survey(p_id uuid, p_title text, p_description text, p_required boolean, p_closes timestamptz, p_questions jsonb) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare sid uuid := p_id; st text; e jsonb; i int := 0; k text; opts jsonb; begin
  perform athar.require('surveys:manage');
  p_title := trim(coalesce(p_title,'')); p_description := nullif(trim(coalesce(p_description,'')),'');
  if char_length(p_title) not between 4 and 160 or coalesce(char_length(p_description),0)>1000 then raise exception 'invalid_input'; end if;
  if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not between 1 and 30 then raise exception 'invalid_input'; end if;
  if sid is null then
    insert into surveys(title,description,required,closes_at,created_by) values (p_title,p_description,coalesce(p_required,true),p_closes,auth.uid()) returning id into sid;
  else
    select status into st from surveys where id=sid; if not found then raise exception 'not_found'; end if;
    if st<>'draft' then raise exception 'not_draft'; end if;
    update surveys set title=p_title, description=p_description, required=coalesce(p_required,true), closes_at=p_closes where id=sid;
    delete from survey_questions where survey_id=sid;
  end if;
  for e in select * from jsonb_array_elements(p_questions) loop
    i := i+1; k := e->>'kind';
    if k not in ('scale','choice','text') or char_length(trim(coalesce(e->>'prompt','')))<3 or char_length(e->>'prompt')>300 then raise exception 'invalid_input'; end if;
    opts := null;
    if k='choice' then
      opts := e->'options';
      if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts) not between 2 and 8 or exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or char_length(trim(o#>>'{}')) not between 1 and 100) then raise exception 'invalid_input'; end if;
    end if;
    insert into survey_questions(survey_id,position,kind,prompt,options,required) values (sid,i,k,trim(e->>'prompt'),opts,coalesce((e->>'required')::boolean,true));
  end loop;
  perform athar.log_as(auth.uid(),case when p_id is null then 'survey.create' else 'survey.update' end,'survey',sid::text);
  return sid;
end $$;
create function public.athar_admin_set_survey_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; r record; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if p_status='open' and s.status='draft' then
    if not exists(select 1 from survey_questions where survey_id=p_id) then raise exception 'invalid_input'; end if;
    update surveys set status='open', opened_at=now() where id=p_id;
    for r in select id from accounts where status='active' and user_type='staff' loop
      perform athar.notify(r.id,'system',case when s.required then 'استبانة مطلوبة منك' else 'استبانة جديدة' end,s.title,'dashboard.html'); end loop;
  elsif p_status='closed' and s.status='open' then update surveys set status='closed', closed_at=now() where id=p_id;
  else raise exception 'invalid_value'; end if;
  perform athar.log_as(auth.uid(),'survey.'||p_status,'survey',p_id::text);
end $$;
create function public.athar_admin_delete_survey(p_id uuid) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  delete from surveys where id=p_id and status='draft'; if not found then raise exception 'not_draft'; end if;
  perform athar.log_as(auth.uid(),'survey.delete','survey',p_id::text);
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'athar\_survey%' or p.proname in ('athar_surveys_me','athar_admin_surveys','athar_admin_get_survey','athar_admin_save_survey','athar_admin_set_survey_status','athar_admin_delete_survey'))
  loop execute format('revoke all on function %s from public, anon', f.sig); execute format('grant execute on function %s to authenticated', f.sig); end loop; end $$;
