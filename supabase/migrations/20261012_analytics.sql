-- Additive migration. Historical rows and inquiry/image data are preserved.
begin;
-- Original schema required IP even when the browser could not obtain it.
alter table public.visit_logs alter column ip drop not null;
alter table public.visit_logs add column if not exists event_id uuid;
alter table public.visit_logs add column if not exists event_type text;
alter table public.visit_logs add column if not exists session_id uuid;
alter table public.visit_logs add column if not exists visitor_id uuid;
alter table public.visit_logs add column if not exists event_data jsonb;
alter table public.visit_logs add column if not exists tracking_version integer;
create unique index if not exists visit_logs_event_id_uq on public.visit_logs(event_id);
create index if not exists visit_logs_v2_date on public.visit_logs(created_at,id) where tracking_version=2;
create index if not exists visit_logs_v2_session on public.visit_logs(session_id,created_at) where tracking_version=2;
alter table public.quotes add column if not exists submission_id uuid;
create unique index if not exists quotes_submission_id_uq on public.quotes(submission_id);

-- Private implementation: public callers cannot claim a confirmed submission.
create or replace function public.write_analytics_event(p_event jsonb, p_confirmed boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare
  sid uuid; vid uuid; eid uuid; kind text; meta jsonb='{}'; first_row public.visit_logs;
  k text; v text; ids jsonb='{}';
begin
  if p_event is null or public.is_site_admin() then return; end if;
  if pg_column_size(p_event)>12000 then raise exception 'Event too large'; end if;
  sid := (p_event->>'session_id')::uuid; vid := (p_event->>'visitor_id')::uuid; eid := (p_event->>'event_id')::uuid;
  kind := p_event->>'event_type';
  if sid is null or vid is null or eid is null or kind is null or
     kind not in ('page_view','phone_click','quote_click','quote_submit') or
     (kind='quote_submit' and not p_confirmed) then raise exception 'Invalid event'; end if;
  if coalesce(p_event->>'page_url','') !~ '^https://(www\.daejinwnc\.com|daejinwnc\.com|daejin-str\.vercel\.app)(/|$)' or
     coalesce(p_event->>'landing_url','') !~ '^https://(www\.daejinwnc\.com|daejinwnc\.com|daejin-str\.vercel\.app)(/|$)'
     then raise exception 'Invalid site URL'; end if;
  perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
  if exists(select 1 from public.visit_logs where event_id=eid) then return; end if;
  if (select count(*) from public.visit_logs where session_id=sid and created_at>now()-interval '1 minute') >= 120 then raise exception 'Event rate exceeded'; end if;
  foreach k in array array['source','medium','keyword','keyword_status','utm_source','utm_medium','utm_campaign','utm_term','utm_content','landing_url','page_url','referrer','first_referrer'] loop
    v := left(coalesce(p_event->>k,''),case when k in ('landing_url','page_url','referrer','first_referrer') then 2000 else 300 end);
    meta := meta || jsonb_build_object(k,v);
  end loop;
  foreach k in array array['gclid','gbraid','wbraid','n_clk','n_ad','n_ad_group','n_campaign','n_keyword','n_keyword_id','n_media','n_query','NVADID'] loop
    if p_event->'click_ids' ? k then ids := ids || jsonb_build_object(k,left(p_event->'click_ids'->>k,300)); end if;
  end loop;
  meta := meta || jsonb_build_object('click_ids',ids);
  select * into first_row from public.visit_logs where session_id=sid and tracking_version=2 order by created_at,id limit 1;
  if found then
    vid := first_row.visitor_id;
    meta := first_row.event_data || jsonb_build_object('page_url',meta->>'page_url','referrer',meta->>'referrer');
  end if;
  insert into public.visit_logs(id,event_id,event_type,session_id,visitor_id,event_data,tracking_version,path,referrer,created_at)
  values(gen_random_uuid(),eid,kind,sid,vid,meta,2,meta->>'source',meta->>'referrer',clock_timestamp());
end $$;
revoke all on function public.write_analytics_event(jsonb,boolean) from public,anon,authenticated;

create or replace function public.record_analytics_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform public.write_analytics_event(p_event,false);
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.record_analytics_event(jsonb) from public;
grant execute on function public.record_analytics_event(jsonb) to anon,authenticated;

create or replace function public.submit_site_quote_v2(p_submission uuid,p_quote jsonb,p_event jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare saved uuid;
begin
  if p_submission is null or length(coalesce(p_quote->>'name','')) not between 1 and 200 or
     length(coalesce(p_quote->>'phone','')) not between 7 and 50 or pg_column_size(p_quote)>15000 then raise exception 'Invalid inquiry'; end if;
  insert into public.quotes(submission_id,name,phone,service,message,status,created_at)
  values(p_submission,p_quote->>'name',p_quote->>'phone',left(p_quote->>'service',300),left(p_quote->>'message',10000),'신규 접수',clock_timestamp())
  on conflict(submission_id) do nothing returning id into saved;
  if saved is not null and p_event is not null then
    -- Same transaction: failed telemetry must never discard a valid customer inquiry.
    begin
      perform public.write_analytics_event(p_event || jsonb_build_object('event_id',p_submission,'event_type','quote_submit'),true);
    exception when others then
      raise warning 'Inquiry saved, attribution rejected: %',SQLSTATE;
    end;
  end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.submit_site_quote_v2(uuid,jsonb,jsonb) from public;
grant execute on function public.submit_site_quote_v2(uuid,jsonb,jsonb) to anon,authenticated;

-- Restrictive SELECT applies even in presence of legacy permissive public policies.
alter table public.visit_logs enable row level security;
drop policy if exists analytics_read_guard on public.visit_logs;
create policy analytics_read_guard on public.visit_logs as restrictive for select to anon,authenticated using (coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false));
drop policy if exists analytics_admin_read on public.visit_logs;
create policy analytics_admin_read on public.visit_logs for select to authenticated using(public.is_site_admin());
drop policy if exists analytics_insert_guard on public.visit_logs;
create policy analytics_insert_guard on public.visit_logs as restrictive for insert to anon,authenticated with check(false);
drop policy if exists analytics_update_guard on public.visit_logs;
create policy analytics_update_guard on public.visit_logs as restrictive for update to anon,authenticated using(false);
drop policy if exists analytics_delete_guard on public.visit_logs;
create policy analytics_delete_guard on public.visit_logs as restrictive for delete to anon,authenticated using(false);
-- Quotes remain insertable through the existing form, but inquiry contents are private.
alter table public.quotes enable row level security;
drop policy if exists analytics_quotes_admin on public.quotes;
create policy analytics_quotes_admin on public.quotes for all to authenticated using(public.is_site_admin()) with check(public.is_site_admin());
drop policy if exists analytics_quotes_legacy_insert on public.quotes;
create policy analytics_quotes_legacy_insert on public.quotes for insert to anon,authenticated with check(submission_id is null);
drop policy if exists analytics_quotes_read_guard on public.quotes;
create policy analytics_quotes_read_guard on public.quotes as restrictive for select to anon,authenticated using(coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false));
-- Historical aggregate values are preserved; browser clients can no longer forge counters.
alter table public.visitors enable row level security;
drop policy if exists analytics_visitors_admin on public.visitors;
create policy analytics_visitors_admin on public.visitors for all to authenticated using(public.is_site_admin()) with check(public.is_site_admin());
drop policy if exists analytics_visitors_guard on public.visitors;
create policy analytics_visitors_guard on public.visitors as restrictive for all to anon,authenticated using(coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false)) with check(coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false));
notify pgrst,'reload schema';
commit;
