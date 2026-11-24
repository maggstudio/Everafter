begin;
create or replace function public.wedly_admin_push_overview()
returns jsonb language plpgsql security definer set search_path='' as $metrics$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied' using errcode='42501'; end if;
 return jsonb_build_object(
 'generated_at',now(),
 'devices',(select count(*) from public.push_subscriptions),
 'users',(select count(distinct user_id) from public.push_subscriptions),
 'devices_7d',(select count(*) from public.push_subscriptions where updated_at>=now()-interval '7 days'),
 'pending',(select count(*) from public.wedly_push_queue where state='pending'),
 'sent',(select count(*) from public.wedly_push_queue where state='sent'),
 'cancelled',(select count(*) from public.wedly_push_queue where state='cancelled'),
 'retry',(select count(*) from public.wedly_push_queue where state='pending' and attempts>1),
 'attempts',(select coalesce(sum(attempts),0) from public.wedly_push_queue),
 'legacy',(select count(*) from public.wedly_push_delivery),
 'categories',(select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) from (select split_part(event_key,':',1) as category,count(*) filter(where state='sent') as sent,count(*) filter(where state='pending') as pending,count(*) filter(where state='cancelled') as cancelled from public.wedly_push_queue group by 1 order by 1) c)
 );
end;
$metrics$;
revoke all on function public.wedly_admin_push_overview() from public,anon,authenticated;
grant execute on function public.wedly_admin_push_overview() to authenticated;
commit;
notify pgrst,'reload schema';
