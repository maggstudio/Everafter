begin;
create index if not exists rsvp_share_secrets_token_idx on public.rsvp_share_secrets(token);
create or replace function public.wedly_public_invitation_context(p_token text) returns jsonb
language sql stable security definer set search_path='' as $context$
 select jsonb_build_object('weddingId',s.wedding_id,'wedding',m.content)
 from public.rsvp_share_secrets s
 join public.wedding_modules m on m.wedding_id=s.wedding_id and m.module='wedding'
 where s.token=p_token and length(p_token)<=512
 and exists(select 1 from public.event_rsvp r where r.wedding_id=s.wedding_id and r.guest_id=s.guest_id and r.revoked_at is null and r.responded_at is null and r.expires_at>now())
 limit 1;
$context$;
revoke all on function public.wedly_public_invitation_context(text) from public,anon,authenticated;
grant execute on function public.wedly_public_invitation_context(text) to service_role;
notify pgrst,'reload schema';
commit;
