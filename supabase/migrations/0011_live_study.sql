-- 0011: الدراسة مسودة حية من فتح الاستبانة، وتُغلق تلقائياً باكتمال العدد المستهدف
alter table athar.studies add column if not exists recs_edited boolean not null default false;

-- دراسة مسودة لكل استبانة مفتوحة أو مغلقة (تُحدَّث لحظياً عند العرض)
create or replace function athar.study_seed() returns trigger language plpgsql security definer set search_path=athar,pg_temp as $$
begin
  if new.status in ('open','closed') then
    insert into studies(survey_id,status,snapshot,recommendations) values (new.id,'draft','{}'::jsonb,'[]'::jsonb) on conflict (survey_id) do nothing;
  end if; return new; end $$;
drop trigger if exists surveys_study_seed on athar.surveys;
create trigger surveys_study_seed after insert or update of status on athar.surveys for each row execute function athar.study_seed();
insert into athar.studies(survey_id,status,snapshot,recommendations)
  select id,'draft','{}'::jsonb,'[]'::jsonb from athar.surveys where status in ('open','closed') on conflict (survey_id) do nothing;

-- إغلاق تلقائي عند بلوغ العدد المستهدف
create or replace function athar.survey_autoclose() returns trigger language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; begin
  select * into s from surveys where id=new.survey_id;
  if s.status='open' and s.target_count is not null and athar.survey_n(s.id) >= s.target_count then
    update surveys set status='closed', closed_at=now() where id=s.id;
    perform athar.log_as(null,'survey.autoclose','survey',s.id::text);
  end if; return null; end $$;
drop trigger if exists participation_autoclose on athar.survey_participation;
create trigger participation_autoclose after insert on athar.survey_participation for each row execute function athar.survey_autoclose();
drop trigger if exists respondents_autoclose on athar.survey_respondents;
create trigger respondents_autoclose after insert on athar.survey_respondents for each row execute function athar.survey_autoclose();

-- التوليد يعمل على الاستبانة المفتوحة وبلا حد أدنى للمديرين؛ والتوصيات المحرَّرة يدوياً لا تُستبدل
create or replace function public.athar_admin_generate_study(p_survey uuid) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; n int; minr int; el int; items jsonb; overall numeric; lvl text; doms jsonb; strengths jsonb; gaps jsonb; recs jsonb; sid uuid; ex studies; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_survey; if not found then raise exception 'not_found'; end if;
  if s.status='draft' then raise exception 'survey_not_open'; end if;
  select * into ex from studies where survey_id=p_survey; if found and ex.status='approved' then raise exception 'study_approved'; end if;
  n := athar.survey_n(p_survey); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_survey);
  items := athar.survey_items(p_survey, false);
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
  insert into studies(survey_id,status,snapshot,recommendations,created_by)
    values (p_survey,'draft',jsonb_build_object('generated_at',now(),'scale_max',4,'target',s.target_count,'live',s.status='open','min',minr,'survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'closed_at',s.closed_at),
      'participants',n,'eligible',el,'rate_pct',case when coalesce(el,0)>0 then least(100,round(100.0*n/el)) end,'overall_mean',overall,'level',lvl,'domains',doms,'strengths',strengths,'gaps',gaps,'items',items),recs,auth.uid())
    on conflict (survey_id) do update set snapshot=excluded.snapshot, recommendations=case when studies.recs_edited then studies.recommendations else excluded.recommendations end, updated_at=now(), created_by=auth.uid()
    returning id into sid;
  perform athar.log_as(auth.uid(),'study.generate','study',sid::text);
  return sid;
end $$;

create or replace function public.athar_admin_update_study(p_id uuid, p_note text, p_recommendations jsonb) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare st studies; begin perform athar.require('surveys:manage');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  if st.status<>'draft' then raise exception 'not_draft'; end if;
  if jsonb_typeof(p_recommendations)<>'array' or jsonb_array_length(p_recommendations)>20 or exists(select 1 from jsonb_array_elements(p_recommendations) r where jsonb_typeof(r->'text')<>'string' or char_length(r->>'text') not between 3 and 600) then raise exception 'invalid_input'; end if;
  update studies set note=nullif(trim(coalesce(p_note,'')),''), recommendations=p_recommendations, recs_edited=true, updated_at=now() where id=p_id;
  perform athar.log_as(auth.uid(),'study.update','study',p_id::text);
end $$;

-- النتائج للمديرين: تُعرض دائماً مجمَّعة، والنصوص الحرة بعد الحد الأدنى فقط
create or replace function public.athar_survey_results(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare s surveys; n int; minr int; el int; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  n := athar.survey_n(p_id); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_id);
  return jsonb_build_object('survey',jsonb_build_object('id',s.id,'title',s.title,'audience',s.audience,'status',s.status),'participants',n,'min',minr,'texts_hidden',n<minr,
    'items',athar.survey_items(p_id, n>=minr));
end $$;

create or replace function public.athar_admin_study_overview() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare minr int := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); begin perform athar.require('surveys:manage');
  return jsonb_build_object('min',minr,'rows',(select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.audience, s.status, s.created_at, s.target_count, athar.survey_n(s.id) participants, athar.survey_eligible(s.id) eligible,
      (select round(avg(a.num),2) from survey_answers a join survey_questions q on q.id=a.question_id and q.kind='scale' where a.survey_id=s.id) mean,
      st.id study_id, st.status study_status
    from surveys s left join studies st on st.survey_id=s.id where s.status<>'draft') x));
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('athar_admin_generate_study','athar_admin_update_study','athar_survey_results','athar_admin_study_overview')
  loop execute format('revoke all on function %s from public, anon', f.sig); execute format('grant execute on function %s to authenticated', f.sig); end loop; end $$;
