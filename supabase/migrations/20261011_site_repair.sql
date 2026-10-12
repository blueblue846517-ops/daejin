-- Apply in Supabase SQL Editor as project owner BEFORE deploying the new admin.
-- Additive schema changes. No existing portfolio, inquiry, image, or auth user is deleted.
-- Transaction aborts on incompatibility (including duplicate setting_key values).
begin;

create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users where id = auth.uid() and raw_app_meta_data->>'role' = 'admin');
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

alter table public.portfolios add column if not exists thumbnail_url text;
alter table public.portfolios add column if not exists updated_at timestamptz not null default now();
create index if not exists portfolios_display_order_created_at_idx on public.portfolios(display_order asc nulls last, created_at desc, id);
create or replace function public.portfolio_cover(value text) returns text
language plpgsql immutable set search_path = '' as $$
declare parsed jsonb;
begin
 parsed := value::jsonb;
 if jsonb_typeof(parsed)='array' then return parsed->>0; end if;
 return value;
exception when invalid_text_representation then return value;
end $$;
create or replace function public.touch_portfolio() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.updated_at = clock_timestamp();
 -- Legacy clients cannot leave a stale thumbnail when replacing image_data.
 if public.portfolio_cover(new.image_data::text) is distinct from public.portfolio_cover(old.image_data::text)
    and new.thumbnail_url is not distinct from old.thumbnail_url then
   new.thumbnail_url = null;
 end if;
 return new;
end $$;
drop trigger if exists site_portfolio_updated on public.portfolios;
create trigger site_portfolio_updated before update on public.portfolios for each row execute function public.touch_portfolio();

create unique index if not exists settings_setting_key_unique on public.settings(setting_key);
create table if not exists public.private_settings(setting_key text primary key, setting_value text);
insert into public.private_settings(setting_key, setting_value)
select setting_key, setting_value from public.settings where setting_key like 'sms_%'
on conflict(setting_key) do nothing;
alter table public.quotes add column if not exists admin_note text;
alter table public.quotes add column if not exists status_history jsonb default '[]'::jsonb;
alter table public.quotes add column if not exists status_updated_at timestamptz;
create index if not exists site_visit_logs_created_idx on public.visit_logs(created_at desc);
create unique index if not exists visitors_visit_date_unique on public.visitors(visit_date);

-- Restrictive policies are deliberately added alongside existing permissive policies.
-- Existing overly broad permissive policies cannot override these guards.
do $$
declare t text; cmd text; guard text; allow_read text; allow_insert text;
begin
 foreach t in array array['portfolios','settings','private_settings','quotes','visitors','visit_logs','blocked_ips','popups'] loop
  execute format('alter table public.%I enable row level security', t);
  allow_read := case
    when t='portfolios' then 'true'
    when t='popups' then '(is_active = true or public.is_site_admin())'
    when t='settings' then '(public.is_site_admin() or setting_key in (''head_script'',''body_script'',''conversion_script'',''seo_title'',''seo_desc'',''seo_keywords'',''ga_measurement_id'',''kakao_js_key'',''seo_google_verify'',''seo_naver_verify''))'
    else 'public.is_site_admin()' end;
  allow_insert := case when t='quotes' then
    '(public.is_site_admin() or (status = ''신규 접수'' and admin_note is null and status_updated_at is null and coalesce(status_history::text, ''[]'') = ''[]''))'
    else 'public.is_site_admin()' end;
  foreach cmd in array array['select','insert','update','delete'] loop
    guard := case when cmd='select' then allow_read when cmd='insert' then allow_insert else 'public.is_site_admin()' end;
    execute format('drop policy if exists %I on public.%I', 'site_guard_'||cmd, t);
    execute format('drop policy if exists %I on public.%I', 'site_allow_'||cmd, t);
    if cmd='insert' then
      execute format('create policy %I on public.%I as restrictive for insert to anon, authenticated with check (%s)', 'site_guard_'||cmd,t,guard);
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (%s)', 'site_allow_'||cmd,t,guard);
    elsif cmd='update' then
      execute format('create policy %I on public.%I as restrictive for update to anon, authenticated using (%s) with check (%s)', 'site_guard_'||cmd,t,guard,guard);
      execute format('create policy %I on public.%I for update to anon, authenticated using (%s) with check (%s)', 'site_allow_'||cmd,t,guard,guard);
    else
      execute format('create policy %I on public.%I as restrictive for %s to anon, authenticated using (%s)', 'site_guard_'||cmd,t,cmd,guard);
      execute format('create policy %I on public.%I for %s to anon, authenticated using (%s)', 'site_allow_'||cmd,t,cmd,guard);
    end if;
  end loop;
  execute format('grant select, insert, update, delete on public.%I to authenticated',t);
 end loop;
end $$;
grant select on public.portfolios, public.settings, public.popups to anon;
grant insert on public.quotes to anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('portfolio-images','portfolio-images',true,20971520,array['image/webp','image/jpeg','image/png','image/gif'])
on conflict(id) do nothing;
drop policy if exists site_portfolio_storage_admin on storage.objects;
create policy site_portfolio_storage_admin on storage.objects for all to authenticated
using (bucket_id='portfolio-images' and public.is_site_admin())
with check (bucket_id='portfolio-images' and public.is_site_admin());
-- Guard writes even if another broad storage policy exists; other buckets unaffected.
drop policy if exists site_portfolio_storage_insert_guard on storage.objects;
create policy site_portfolio_storage_insert_guard on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id <> 'portfolio-images' or public.is_site_admin());
drop policy if exists site_portfolio_storage_update_guard on storage.objects;
create policy site_portfolio_storage_update_guard on storage.objects as restrictive for update to anon,authenticated
using(bucket_id <> 'portfolio-images' or public.is_site_admin()) with check(bucket_id <> 'portfolio-images' or public.is_site_admin());
drop policy if exists site_portfolio_storage_delete_guard on storage.objects;
create policy site_portfolio_storage_delete_guard on storage.objects as restrictive for delete to anon,authenticated
using(bucket_id <> 'portfolio-images' or public.is_site_admin());

create or replace function public.move_portfolio(p_id text, p_target_id text) returns void
language plpgsql security invoker set search_path = '' as $$
declare a integer; b integer;
begin
 if not public.is_site_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 perform id from public.portfolios order by id for update;
 with ranked as (select id, (row_number() over(order by display_order asc nulls last,created_at desc,id)-1)::integer as n from public.portfolios)
 update public.portfolios p set display_order=r.n from ranked r where p.id=r.id and p.display_order is distinct from r.n;
 select display_order into a from public.portfolios where id::text=p_id;
 select display_order into b from public.portfolios where id::text=p_target_id;
 if a is null or b is null or abs(a-b) <> 1 then raise exception '목록이 변경되었습니다. 새로고침 후 다시 시도해 주세요.'; end if;
 update public.portfolios set display_order=case when id::text=p_id then b else a end where id::text in(p_id,p_target_id);
end $$;
revoke all on function public.move_portfolio(text,text) from public;
grant execute on function public.move_portfolio(text,text) to authenticated;

create table if not exists public.site_visit_sessions(session_id uuid not null,visit_date date not null,primary key(session_id,visit_date));
alter table public.site_visit_sessions enable row level security;
revoke all on public.site_visit_sessions from anon,authenticated;
create or replace function public.record_site_visit(p_session uuid,p_ip text,p_path text,p_referrer text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'Asia/Seoul')::date; inserted integer;
begin
 if exists(select 1 from public.blocked_ips where ip::text=p_ip) then return jsonb_build_object('blocked',true); end if;
 insert into public.site_visit_sessions values(p_session,today) on conflict do nothing;
 get diagnostics inserted = row_count;
 if inserted=1 and p_path <> '내부 이동' then
  insert into public.visit_logs(ip,path,referrer) values(p_ip,p_path,left(p_referrer,2000));
  insert into public.visitors(visit_date,visit_count) values(today,1)
  on conflict(visit_date) do update set visit_count=public.visitors.visit_count+1;
 end if;
 return jsonb_build_object('blocked',false,'recorded',inserted=1);
end $$;
revoke all on function public.record_site_visit(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_site_visit(uuid,text,text,text) to service_role;
commit;
