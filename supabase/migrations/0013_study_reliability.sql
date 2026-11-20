-- 0013: مؤشرات الصدق والثبات للدراسة التفصيلية (قراءة فقط، أرقام مجمّعة لا تكشف إجابة أي مشارك)
-- تُحسب من مجموعات الإجابات المكتملة (المشارك أجاب كل عبارات المقياس) ضمن جولات الدراسة:
--   ألفا كرونباخ للأداة ولكل محور، والانحراف المعياري لدرجات المشاركين، وارتباط بيرسون لكل عبارة بمحورها وبالدرجة الكلية (صدق الاتساق الداخلي).
-- الصلاحية مطابقة لـ athar_study_get: من يدير الاستبانات، أو مشارك في دراسة معتمدة.
create or replace function public.athar_study_reliability(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=athar,pg_temp as $$
declare st studies; mgr boolean; rf int; rt int; res jsonb; begin
  perform athar.require_active('staff');
  select * into st from studies where id=p_id; if not found then raise exception 'not_found'; end if;
  mgr := athar.can('surveys:manage');
  rf := case st.scope when 'cumulative' then 1 else st.round end; rt := st.round;
  if not mgr and not (st.status='approved' and exists(select 1 from survey_participation where survey_id=st.survey_id and account_id=auth.uid() and round between rf and rt)) then raise exception 'forbidden' using errcode='42501'; end if;
  with q as (select id, coalesce(domain,'general') dm from survey_questions where survey_id=st.survey_id and kind='scale'),
  a as (select sa.set_id, sa.question_id qid, sa.num::numeric v, q.dm from survey_answers sa join q on q.id=sa.question_id
        where sa.survey_id=st.survey_id and sa.round between rf and rt and sa.num between 1 and 4),
  fs as (select set_id from a group by set_id having count(distinct qid)=(select count(*) from q)),
  x as (select a.* from a join fs using(set_id)),
  tot as (select set_id, sum(v) t, avg(v) m from x group by set_id),
  dt as (select set_id, dm, sum(v) t, avg(v) m from x group by set_id, dm),
  iv as (select qid, dm, var_samp(v) vi from x group by qid, dm),
  dk as (select dm, count(*) k from q group by dm),
  dom as (select d.dm, dk.k, (select sum(vi) from iv where iv.dm=d.dm) svi, var_samp(d.t) vt, stddev_samp(d.m) sd from dt d join dk using(dm) group by d.dm, dk.k),
  itm as (select x.qid, corr(x.v, dt.t) r_dom, corr(x.v, tot.t) r_tot from x join dt on dt.set_id=x.set_id and dt.dm=x.dm join tot on tot.set_id=x.set_id group by x.qid)
  select jsonb_build_object(
    'n', (select count(*) from fs), 'k', (select count(*) from q),
    'alpha', (select case when k>1 and vt>0 then round(k/(k-1)*(1-svi/vt),3) end from (select (select count(*) from q)::numeric k, (select sum(vi) from iv) svi, (select var_samp(t) from tot) vt) z),
    'sd', (select round(stddev_samp(m),2) from tot),
    'domains', (select coalesce(jsonb_agg(jsonb_build_object('code',dm,'k',k,'alpha',case when k>1 and vt>0 then round(k::numeric/(k-1)*(1-svi/vt),3) end,'sd',round(sd,2))),'[]') from dom),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id',qid,'r_domain',round(r_dom::numeric,3),'r_total',round(r_tot::numeric,3))),'[]') from itm)
  ) into res;
  return res;
end $$;
revoke all on function public.athar_study_reliability(uuid) from public, anon;
grant execute on function public.athar_study_reliability(uuid) to authenticated;
