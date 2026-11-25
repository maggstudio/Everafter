-- Read-only inspection of deployed role validation.
select jsonb_pretty(jsonb_build_object(
 'constraints',coalesce((select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid))) from pg_constraint c where c.conrelid in ('public.wedding_members'::regclass,'public.wedding_email_invitations'::regclass) and c.contype='c'),'[]'::jsonb),
 'role_columns',coalesce((select jsonb_agg(to_jsonb(c)) from information_schema.columns c where table_schema='public' and table_name in ('wedding_members','wedding_email_invitations') and column_name='role'),'[]'::jsonb),
 'functions',coalesce((select jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and (p.proname in ('create_email_invitation','accept_email_invitation','invite_wedding_member','accept_wedding_invite','wedding_can','set_wedding_permissions') or p.prosrc ilike '%planner%')),'[]'::jsonb),
 'policies',coalesce((select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public' and (tablename in ('wedding_members','wedding_email_invitations') or coalesce(qual,'') ilike '%planner%' or coalesce(with_check,'') ilike '%planner%')),'[]'::jsonb)
)) as collaborator_role_audit;
