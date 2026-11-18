-- 0012: إعادة فتح الاستبانة بجولات جديدة، وتقارير: جديد (الجولة) أو تراكمي (كل الجولات)
alter table athar.surveys add column if not exists round int not null default 1;
alter table athar.survey_answers add column if not exists round int not null default 1;
alter table athar.survey_participation add column if not exists round int not null default 1;
alter table athar.survey_respondents add column if not exists round int not null default 1;
alter table athar.studies add column if not exists round int not null default 1;
alter table athar.studies add column if not exists scope text not null default 'round';
do $$ begin alter table athar.studies add constraint studies_scope_chk check (scope in ('round','cumulative')); exception when duplicate_object then null; end $$;
alter table athar.studies drop constraint if exists studies_survey_id_key;
create unique index if not exists studies_survey_scope_round on athar.studies(survey_id, scope, round);

-- كل صف جديد يأخذ رقم جولة الاستبانة الحالية
create or replace function athar.set_round() returns trigger language plpgsql security definer set search_path=athar,pg_temp as $$
begin new.round := (select round from surveys where id=new.survey_id); return new; end $$;
drop trigger if exists answers_round on athar.survey_answers; create trigger answers_round before insert on athar.survey_answers for each row execute function athar.set_round();
drop trigger if exists participation_round on athar.survey_participation; create trigger participation_round before insert on athar.survey_participation for each row execute function athar.set_round();
drop trigger if exists respondents_round on athar.survey_respondents; create trigger respondents_round before insert on athar.survey_respondents for each row execute function athar.set_round();

create or replace function athar.survey_n(p_id uuid, rf int, rt int) returns int language sql stable security definer set search_path=athar,pg_temp as $$
  select (select count(*) from survey_participation where survey_id=p_id and round between rf and rt)::int + (select count(*) from survey_respondents where survey_id=p_id and round between rf and rt)::int $$;
create or replace function athar.survey_items(p_id uuid, p_texts boolean, rf int, rt int) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select coalesce(jsonb_agg(item order by pos),'[]') from (
    select q.position pos, case q.kind
      when 'scale' then jsonb_build_object('id',q.id,'kind','scale','domain',q.domain,'prompt',q.prompt,'options',q.options,'answered',sc.cnt,'mean',round(sc.av,2),
         'dist',jsonb_build_array(sc.c1,sc.c2,sc.c3,sc.c4),
         'favorable_pct',case when sc.cnt>0 then round(100.0*(sc.c3+sc.c4)/sc.cnt) end,'unfavorable_pct',case when sc.cnt>0 then round(100.0*(sc.c1+sc.c2)/sc.cnt) end)
      when 'choice' then jsonb_build_object('id',q.id,'kind','choice','domain',q.domain,'prompt',q.prompt,
         'options',(select jsonb_agg(jsonb_build_object('label',o.v,'count',coalesce(k.c,0),'pct',case when tt.tot>0 then round(100.0*coalesce(k.c,0)/tt.tot) else 0 end) order by o.ord)
            from jsonb_array_elements_text(q.options) with ordinality o(v,ord)
            left join (select num, count(*) c from survey_answers where question_id=q.id and round between rf and rt group by num) k on k.num=o.ord-1
            cross join (select count(*) tot from survey_answers where question_id=q.id and round between rf and rt) tt))
      else jsonb_build_object('id',q.id,'kind','text','domain',q.domain,'prompt',q.prompt,'answered',(select count(*) from survey_answers where question_id=q.id and txt is not null and round between rf and rt),
         'texts',case when p_texts then (select coalesce(jsonb_agg(txt order by random()),'[]') from survey_answers where question_id=q.id and txt is not null and round between rf and rt) end)
    end item
    from survey_questions q
    left join lateral (select count(num) cnt, avg(num) av, count(*) filter (where num=1) c1, count(*) filter (where num=2) c2, count(*) filter (where num=3) c3,
        count(*) filter (where num=4) c4 from survey_answers a where a.question_id=q.id and a.round between rf and rt) sc on q.kind='scale'
    where q.survey_id=p_id) z $$;

create or replace function athar.survey_items(p_id uuid, p_texts boolean) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$ select athar.survey_items(p_id, p_texts, 1, 1000000) $$;

create or replace function athar.study_seed() returns trigger language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  if new.status in ('open','closed') then
    insert into studies(survey_id,scope,round,status,snapshot,recommendations) values (new.id,'round',new.round,'draft','{}'::jsonb,'[]'::jsonb) on conflict (survey_id,scope,round) do nothing;
  end if; return new; end $$;
drop trigger if exists surveys_study_seed on athar.surveys;
create trigger surveys_study_seed after insert or update of status, round on athar.surveys for each row execute function athar.study_seed();

-- الإغلاق التلقائي يعدّ مشاركي الجولة الحالية فقط
create or replace function athar.survey_autoclose() returns trigger language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; begin
  select * into s from surveys where id=new.survey_id;
  if s.status='open' and s.target_count is not null and athar.survey_n(s.id, s.round, s.round) >= s.target_count then
    update surveys set status='closed', closed_at=now() where id=s.id;
    perform athar.log_as(null,'survey.autoclose','survey',s.id::text);
  end if; return null; end $$;

drop function if exists public.athar_admin_generate_study(uuid);
create function public.athar_admin_generate_study(p_survey uuid, p_scope text default 'round', p_round int default null) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; rf int; rt int; n int; minr int; el int; items jsonb; overall numeric; lvl text; doms jsonb; strengths jsonb; gaps jsonb; recs jsonb; sid uuid; ex studies; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_survey; if not found then raise exception 'not_found'; end if;
  if s.status='draft' then raise exception 'survey_not_open'; end if;
  if p_scope not in ('round','cumulative') then raise exception 'invalid_input'; end if;
  rt := coalesce(p_round, s.round); if rt<1 or rt>s.round then raise exception 'invalid_input'; end if; rf := case p_scope when 'cumulative' then 1 else rt end;
  select * into ex from studies where survey_id=p_survey and scope=p_scope and round=rt; if found and ex.status='approved' then raise exception 'study_approved'; end if;
  n := athar.survey_n(p_survey, rf, rt); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_survey);
  items := athar.survey_items(p_survey, false, rf, rt);
  select round(avg((e->>'mean')::numeric),2) into overall from jsonb_array_elements(items) e where e->>'kind'='scale' and e->>'mean' is not null;
  lvl := case when overall is null then 'غير متاح' when overall>=3.4 then 'مستوى مرتفع' when overall>=2.8 then 'مستوى جيد' when overall>=2.4 then 'مستوى متوسط يحتاج تحسيناً' else 'مستوى منخفض يحتاج تدخلاً' end;
  select coalesce(jsonb_agg(jsonb_build_object('code',d.dm,'name',athar.domain_name(d.dm),'mean',d.m,'items',d.c) order by d.m desc),'[]') into doms from (
    select coalesce(e->>'domain','general') dm, round(avg((e->>'mean')::numeric),2) m, count(*) c from jsonb_array_elements(items) e where e->>'kind'='scale' and e->>'mean' is not null group by 1) d;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m,'domain',athar.domain_name(x.dm),'text',x.t) order by x.m desc),'[]') into strengths from (
    select e->>'prompt' p, (e->>'mean')::numeric m, e->>'domain' dm, q.strength t from jsonb_array_elements(items) e join survey_questions q on q.id=(e->>'id')::uuid
    where e->>'kind'='scale' and (e->>'mean')::numeric>=3.3 order by m desc limit 4) x;
  select coalesce(jsonb_agg(jsonb_build_object('prompt',x.p,'mean',x.m,'domain',athar.domain_name(x.dm)) order by x.m),'[]') into gaps from (
    select e->>'prompt' p, (e->>'mean')::numeric m, e->>'domain' dm from jsonb_array_elements(items) e
    where e->>'kind'='scale' and (e->>'mean')::numeric<2.8 order by m limit 6) x;
  select coalesce(jsonb_agg(jsonb_build_object('priority',case when x.m<2.4 then 'عالية' else 'متوسطة' end,'text',coalesce(x.r,'مراجعة «'||x.p||'» ووضع خطة تحسين بمؤشر قياس واضح'),'basis','متوسط '||x.m||' من 4 في «'||x.p||'»') order by x.m),'[]') into recs from (
    select e->>'prompt' p, (e->>'mean')::numeric m, q.recommendation r from jsonb_array_elements(items) e join survey_questions q on q.id=(e->>'id')::uuid
    where e->>'kind'='scale' and (e->>'mean')::numeric<2.8 order by m limit 6) x;
  if jsonb_array_length(recs)=0 then recs := jsonb_build_array(jsonb_build_object('priority','متابعة','text','المحافظة على المستوى الحالي وتوثيق الممارسات الناجحة ومشاركتها.','basis','لا توجد بنود دون 2.8 من 4')); end if;
  recs := recs || jsonb_build_array(jsonb_build_object('priority','متابعة','text','إعادة القياس بالأداة نفسها بعد فصل دراسي لمتابعة أثر الإجراءات.','basis','قياس الأثر'));
  insert into studies(survey_id,scope,round,status,snapshot,recommendations,created_by)
    values (p_survey,p_scope,rt,'draft',jsonb_build_object('generated_at',now(),'scale_max',4,'scope',p_scope,'round',rt,'rounds',case p_scope when 'cumulative' then rt else 1 end,'live',s.status='open' and rt=s.round,'target',s.target_count,'min',minr,'survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'closed_at',s.closed_at),
      'participants',n,'eligible',el,'rate_pct',case when coalesce(el,0)>0 then least(100,round(100.0*n/el)) end,'overall_mean',overall,'level',lvl,'domains',doms,'strengths',strengths,'gaps',gaps,'items',items),recs,auth.uid())
    on conflict (survey_id, scope, round) do update set snapshot=excluded.snapshot, recommendations=case when studies.recs_edited then studies.recommendations else excluded.recommendations end, updated_at=now(), created_by=auth.uid()
    returning id into sid;
  perform athar.log_as(auth.uid(),'study.generate','study',sid::text);
  return sid;
end $$;

-- إعادة فتح استبانة مغلقة (حتى لو اعتُمدت دراستها) كجولة جديدة بهدف جديد اختياري
create function public.athar_admin_reopen_survey(p_id uuid, p_target int default null, p_closes timestamptz default null) returns int language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; r record; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if s.status<>'closed' then raise exception 'invalid_value'; end if;
  if p_target is not null and p_target<1 then raise exception 'invalid_input'; end if;
  if p_closes is not null and p_closes<=now() then raise exception 'invalid_input'; end if;
  update surveys set status='open', round=s.round+1, closed_at=null, target_count=p_target, closes_at=p_closes where id=p_id;
  if s.audience in ('teacher','administrative') then
    for r in select a.id from accounts a where a.status='active' and a.user_type='staff' and athar.audience_ok(s.audience, a.category)
        and not exists(select 1 from survey_participation p where p.survey_id=p_id and p.account_id=a.id) loop
      perform athar.notify(r.id,'system','أُعيد فتح استبانة',s.title,'dashboard.html'); end loop;
  end if;
  perform athar.log_as(auth.uid(),'survey.reopen','survey',p_id::text);
  return s.round+1;
end $$;

create or replace function public.athar_admin_approve_study(p_id uuid) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare st studies; ti text; r record; begin perform athar.require('surveys:manage');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  if st.status='approved' then return; end if;
  update studies set status='approved', approved_by=auth.uid(), approved_at=now(), updated_at=now() where id=p_id;
  select title into ti from surveys where id=st.survey_id;
  for r in select account_id from survey_participation where survey_id=st.survey_id and round between (case st.scope when 'cumulative' then 1 else st.round end) and st.round loop
    perform athar.notify(r.account_id,'system','اعتُمدت دراسة شاركت فيها',ti,'study.html?id='||p_id); end loop;
  perform athar.log_as(auth.uid(),'study.approve','study',p_id::text);
end $$;

create or replace function public.athar_study_get(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare st studies; mgr boolean; s surveys; begin perform athar.require_active('staff');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  mgr := athar.can('surveys:manage');
  if not mgr and not (st.status='approved' and exists(select 1 from survey_participation where survey_id=st.survey_id and account_id=auth.uid() and round between (case st.scope when 'cumulative' then 1 else st.round end) and st.round)) then raise exception 'forbidden' using errcode='42501'; end if;
  select * into s from surveys where id=st.survey_id;
  return jsonb_build_object('id',st.id,'status',st.status,'survey_id',st.survey_id,'approved_at',st.approved_at,'note',st.note,'recommendations',st.recommendations,'snapshot',st.snapshot,'can_manage',mgr,
    'scope',st.scope,'round',st.round,'survey_status',s.status,'survey_round',s.round,
    'siblings',case when mgr then (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'scope',x.scope,'round',x.round,'status',x.status) order by x.round desc, x.scope),'[]') from studies x where x.survey_id=st.survey_id) else '[]'::jsonb end);
end $$;

create or replace function public.athar_admin_surveys() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
begin perform athar.require('surveys:manage');
  return (select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.audience, s.status, s.required, s.closes_at, s.created_at, s.token, s.target_count, s.round,
      (select count(*) from survey_questions q where q.survey_id=s.id) questions,
      athar.survey_n(s.id) responses, athar.survey_n(s.id, s.round, s.round) round_responses, st.id study_id, st.status study_status
    from surveys s left join lateral (select id, status from studies where survey_id=s.id order by round desc, (scope='round') desc limit 1) st on true) x);
end $$;

create or replace function public.athar_admin_study_overview() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare minr int := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); begin perform athar.require('surveys:manage');
  return jsonb_build_object('min',minr,'rows',(select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.audience, s.status, s.created_at, s.target_count, s.round, athar.survey_n(s.id) participants, athar.survey_n(s.id, s.round, s.round) round_participants, athar.survey_eligible(s.id) eligible,
      (select round(avg(a.num),2) from survey_answers a join survey_questions q on q.id=a.question_id and q.kind='scale' where a.survey_id=s.id) mean,
      st.id study_id, st.status study_status, (select count(*) from studies z where z.survey_id=s.id) studies_count
    from surveys s left join lateral (select id, status from studies where survey_id=s.id order by round desc, (scope='round') desc limit 1) st on true where s.status<>'draft') x));
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('athar_admin_generate_study','athar_admin_reopen_survey','athar_admin_approve_study','athar_study_get','athar_admin_surveys','athar_admin_study_overview')
  loop execute format('revoke all on function %s from public, anon', f.sig); execute format('grant execute on function %s to authenticated', f.sig); end loop; end $$;
