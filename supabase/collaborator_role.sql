begin;
alter table public.wedding_members drop constraint wedding_members_role_check, add constraint wedding_members_role_check check(role in ('owner','partner','planner','collaborator'));
alter table public.wedding_email_invitations drop constraint wedding_email_invitations_role_check, add constraint wedding_email_invitations_role_check check(role in ('partner','planner','collaborator'));
-- Preserve the deployed function bodies, privileges and security settings.
do $migration$
declare fn regprocedure; original text; updated text;
begin
 foreach fn in array array['public.create_email_invitation(uuid,text,text,jsonb)'::regprocedure,'public.invite_wedding_member(uuid,text,text,jsonb)'::regprocedure] loop
 original:=pg_get_functiondef(fn);
 updated:=replace(original, 'p_role not in (''partner'',''planner'')', 'p_role is null or p_role not in (''partner'',''planner'',''collaborator'')');
 if updated=original and position('p_role not in (''partner'',''planner'',''collaborator'')' in original)=0 then raise exception 'Unexpected role validation in %',fn; end if;
 if updated<>original then execute updated; end if;
 end loop;
end $migration$;
notify pgrst, 'reload schema';
commit;
