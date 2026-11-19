# EVERAFTER v0.6 — Resend, invitations, permissions, audit

## Safe rollout
1. **Backup**: export `wedding_workspaces`, `weddings`, `wedding_members`, `wedding_modules`; tag current GitHub commit `v0.5-stable`.
2. Run ONLY `supabase/v06.sql` in Supabase SQL Editor after v0.5. No table from v0.4 or v0.5 is dropped. Never re-run `schema.sql`.
3. In Resend verify a domain and obtain a Resend API key. The sending address must be on the verified domain.
4. Set in Vercel Production: `NEXT_PUBLIC_SITE_URL` (exact public HTTPS origin, no trailing slash), `RESEND_API_KEY` (server-side secret), `RESEND_FROM_EMAIL` (verified sender). Keep the two existing public Supabase variables. Never prefix Resend key with `NEXT_PUBLIC_`.
5. Commit v0.6 files to GitHub and deploy. Check `/team` and `/invite`.
6. Test with two separate accounts and an email matching the invited address. Confirm token expires after seven days, cannot be reused, and cannot be accepted by another email. Test revoke access, budget denial and existing data.

## Important limits
- Email delivery depends on verified Resend domain, provider quota and sender configuration.
- Email sending is not transactional with database token creation: on delivery failure the invitation remains pending; owner can revoke it and retry.
- Invitation acceptance checks a verified Supabase email. Existing v0.5 pending invitations continue working.
- Module audit logs record metadata only, not old/new field values. Logs start after installation of v0.6.
- Collaboration sync uses conservative 30-second polling when there are no unsaved changes; not realtime push. Multiple simultaneous edits to the same module remain last-write-wins.
- `wedding_workspaces` and all original v0.5 tables remain unchanged; no data backfill required.
- Use a staging deployment and test RLS and abuse controls before production with real customers. Rate limiting and spam protection are not yet implemented; invitation creation should not be exposed to untrusted owners at scale.
