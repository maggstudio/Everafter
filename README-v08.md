# WEDLY v0.8 — multiple events per account

## Deployment order (important)
1. Back up Supabase `weddings`, `wedding_members`, `wedding_modules`, `wedding_email_invitations`, and `wedding_workspaces`. Keep the existing production deployment unchanged.
2. Create a staging Supabase project / copy and test `supabase/v08.sql` **after** v04/v05/v06. Never rerun `schema.sql` on production.
3. Run SQL migration in production only after the staging checks and a recovery plan; the migration removes the old one-owner-one-event unique index, replaces the bootstrap function and adds `create_my_event`.
4. Deploy code to Vercel Preview with the correct Preview Supabase variables. Do not merge to main before migration + tests.
5. Test /events, create two events, switch between them, verify no cross-event data, invite a collaborator to one event, and verify the other is inaccessible.
6. Check old events and old invite URLs still work. Check event switching while there are no unsaved edits.

## Technical details
- `weddings.owner_id` remains the owner; multiple rows per owner are now allowed.
- `wedding_members` and `wedding_modules` remain keyed by `wedding_id`; existing RLS remains in place.
- `ensure_my_wedding()` always returns the oldest owned event and only creates one on first login.
- `create_my_event()` is an authenticated SECURITY DEFINER RPC, validates inputs and creates all six module rows atomically.
- UI lists active memberships with `wedding` read permission, and shows links to independent dashboards.
- No billing or event limit in v0.8. Existing module auto-save behavior is unchanged; last-write-wins concurrent editing remains a known limitation.
- Keep v0.8 in staging until a full SQL and deployment test passes.
