-- 0010: أسئلة موضوعية باختيار من 4 مستويات (1-4) بعبارات تناسب كل سؤال، روابط نشر مختصرة قابلة للتحديد، ونظرة عامة للدراسات.
create or replace function athar.survey_rows(p_id uuid, p_answers jsonb) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare q record; v jsonb; t text; k int; rows_ jsonb := '[]'; begin
  p_answers := coalesce(p_answers,'{}');
  if jsonb_typeof(p_answers)<>'object' then raise exception 'invalid_input'; end if;
  for q in select * from survey_questions where survey_id=p_id order by position loop
    v := p_answers->(q.id::text);
    if v is null or v='null'::jsonb or (jsonb_typeof(v)='string' and trim(v#>>'{}')='') then
      if q.required then raise exception 'invalid_input'; else continue; end if; end if;
    if q.kind='scale' then
      if jsonb_typeof(v)<>'number' or (v#>>'{}') !~ '^[1-4]$' then raise exception 'invalid_input'; end if;
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
create or replace function athar.survey_items(p_id uuid, p_texts boolean) returns jsonb language sql stable security definer set search_path=athar,pg_temp as $$
  select coalesce(jsonb_agg(item order by pos),'[]') from (
    select q.position pos, case q.kind
      when 'scale' then jsonb_build_object('id',q.id,'kind','scale','domain',q.domain,'prompt',q.prompt,'options',q.options,'answered',sc.cnt,'mean',round(sc.av,2),
         'dist',jsonb_build_array(sc.c1,sc.c2,sc.c3,sc.c4),
         'favorable_pct',case when sc.cnt>0 then round(100.0*(sc.c3+sc.c4)/sc.cnt) end,'unfavorable_pct',case when sc.cnt>0 then round(100.0*(sc.c1+sc.c2)/sc.cnt) end)
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
        count(*) filter (where num=4) c4 from survey_answers a where a.question_id=q.id) sc on q.kind='scale'
    where q.survey_id=p_id) z $$;

create or replace function public.athar_admin_save_survey(p_id uuid, p_title text, p_description text, p_audience text, p_required boolean, p_closes timestamptz, p_target int, p_questions jsonb) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
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
    if k='scale' then
      opts := e->'options';
      if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts)<>4 or exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or char_length(trim(o#>>'{}')) not between 1 and 60) then raise exception 'invalid_input'; end if;
    elsif k='choice' then
      opts := e->'options';
      if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts) not between 2 and 8 or exists(select 1 from jsonb_array_elements(opts) o where jsonb_typeof(o)<>'string' or char_length(trim(o#>>'{}')) not between 1 and 100) then raise exception 'invalid_input'; end if;
    end if;
    insert into survey_questions(survey_id,position,kind,domain,prompt,options,required,recommendation,strength)
      values (sid,i,k,dm,trim(e->>'prompt'),opts,coalesce((e->>'required')::boolean,true),nullif(trim(coalesce(e->>'recommendation','')),''),nullif(trim(coalesce(e->>'strength','')),''));
  end loop;
  perform athar.log_as(auth.uid(),case when p_id is null then 'survey.create' else 'survey.update' end,'survey',sid::text);
  return sid;
end $$;

create or replace function public.athar_admin_set_survey_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; r record; t text; begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if p_status='open' and s.status='draft' then
    if not exists(select 1 from survey_questions where survey_id=p_id) then raise exception 'invalid_input'; end if;
    t := s.token;
    if t is null and s.audience in ('student','parent','supervisor') then
      loop t := substr(md5(gen_random_uuid()::text||clock_timestamp()::text),1,8); exit when not exists(select 1 from surveys where token=t); end loop;
    end if;
    update surveys set status='open', opened_at=now(), token=t where id=p_id;
    if s.audience in ('teacher','administrative') then
      for r in select id from accounts where status='active' and user_type='staff' and athar.audience_ok(s.audience, category) loop
        perform athar.notify(r.id,'system',case when s.required then 'استبانة مطلوبة منك' else 'استبانة جديدة' end,s.title,'dashboard.html'); end loop;
    end if;
  elsif p_status='closed' and s.status='open' then update surveys set status='closed', closed_at=now() where id=p_id;
  else raise exception 'invalid_value'; end if;
  perform athar.log_as(auth.uid(),'survey.'||p_status,'survey',p_id::text);
end $$;

create function public.athar_admin_set_survey_slug(p_id uuid, p_slug text) returns text language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; v text := lower(trim(coalesce(p_slug,''))); begin perform athar.require('surveys:manage');
  select * into s from surveys where id=p_id; if not found then raise exception 'not_found'; end if;
  if s.audience not in ('student','parent','supervisor') or s.status='closed' then raise exception 'invalid_value'; end if;
  if v !~ '^[a-z0-9][a-z0-9-]{3,29}$' then raise exception 'invalid_slug'; end if;
  begin update surveys set token=v where id=p_id; exception when unique_violation then raise exception 'slug_taken'; end;
  perform athar.log_as(auth.uid(),'survey.slug','survey',p_id::text);
  return v;
end $$;

create function public.athar_admin_study_overview() returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare minr int := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); begin perform athar.require('surveys:manage');
  return jsonb_build_object('min',minr,'rows',(select coalesce(jsonb_agg(x order by x.created_at desc),'[]') from (
    select s.id, s.title, s.audience, s.status, s.created_at, athar.survey_n(s.id) participants, athar.survey_eligible(s.id) eligible,
      case when athar.survey_n(s.id)>=minr then (select round(avg(a.num),2) from survey_answers a join survey_questions q on q.id=a.question_id and q.kind='scale' where a.survey_id=s.id) end mean,
      st.id study_id, st.status study_status
    from surveys s left join studies st on st.survey_id=s.id where s.status<>'draft') x));
end $$;

create or replace function public.athar_admin_generate_study(p_survey uuid) returns uuid language plpgsql security definer set search_path=athar,pg_temp as $$
declare s surveys; n int; minr int; el int; items jsonb; overall numeric; lvl text; doms jsonb; strengths jsonb; gaps jsonb; recs jsonb; sid uuid; ex studies; begin
  perform athar.require('surveys:manage');
  select * into s from surveys where id=p_survey; if not found then raise exception 'not_found'; end if;
  if s.status<>'closed' then raise exception 'survey_not_closed'; end if;
  select * into ex from studies where survey_id=p_survey; if found and ex.status='approved' then raise exception 'study_approved'; end if;
  n := athar.survey_n(p_survey); minr := coalesce((athar.setting('surveys.min_respondents')#>>'{}')::int,5); el := athar.survey_eligible(p_survey);
  if n < minr then raise exception 'insufficient_data'; end if;
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
    values (p_survey,'draft',jsonb_build_object('generated_at',now(),'scale_max',4,'survey',jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'audience',s.audience,'closed_at',s.closed_at),
      'participants',n,'eligible',el,'rate_pct',case when coalesce(el,0)>0 then least(100,round(100.0*n/el)) end,'overall_mean',overall,'level',lvl,'domains',doms,'strengths',strengths,'gaps',gaps,'items',items),recs,auth.uid())
    on conflict (survey_id) do update set snapshot=excluded.snapshot, recommendations=excluded.recommendations, updated_at=now(), created_by=auth.uid()
    returning id into sid;
  perform athar.log_as(auth.uid(),'study.generate','study',sid::text);
  return sid;
end $$;

-- تحويل الاستبانات المبذورة: حذف الأسئلة النصية، وإعطاء كل سؤال أربع عبارات (موافقة أو تكرار)
delete from athar.survey_questions where kind='text' and survey_id in (select id from athar.surveys where status='draft');
update athar.survey_questions set options = case
  when prompt ~ '^(أشارك|أحصل|أستخدم|أجد|أتواصل|يتابع|تتابع|تُبلغني)' then '["نادراً","أحياناً","غالباً","دائماً"]'::jsonb
  else '["لا أوافق بشدة","لا أوافق","أوافق","أوافق بشدة"]'::jsonb end
  where kind='scale' and options is null;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'athar\_%'
  loop execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if f.proname in ('athar_public_info','athar_public_survey_info','athar_public_survey_submit') then execute format('grant execute on function %s to anon, authenticated', f.sig);
    else execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
