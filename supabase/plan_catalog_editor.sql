begin;
alter table public.platform_plan_catalog drop constraint if exists platform_plan_catalog_code_check;
alter table public.platform_plan_catalog add constraint platform_plan_catalog_code_check check(code ~ '^[a-z][a-z0-9_-]{0,39}$');
create or replace function public.wedly_admin_save_plan(p_code text,p_label text,p_price integer,p_features jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 if p_code is null or p_code !~ '^[a-z][a-z0-9_-]{0,39}$' or coalesce(length(btrim(p_label)),0) not between 1 and 80 or p_price is null or p_price not between 0 and 100000 or jsonb_typeof(p_features) is distinct from 'object' then raise exception 'Invalid plan'; end if;
 if exists(select 1 from jsonb_each(p_features) f where jsonb_typeof(f.value)<>'boolean') then raise exception 'Invalid features'; end if;
 insert into public.platform_plan_catalog(code,label,price_ron,features,enabled) values(p_code,btrim(p_label),p_price,p_features,false)
 on conflict(code) do update set label=excluded.label,price_ron=excluded.price_ron,features=excluded.features,updated_at=now();
end $$;
revoke all on function public.wedly_admin_save_plan(text,text,integer,jsonb) from public,anon;
grant execute on function public.wedly_admin_save_plan(text,text,integer,jsonb) to authenticated;
commit;
notify pgrst, 'reload schema';
