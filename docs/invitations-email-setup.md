# WEDLY v1.1.1 – activare email invitații

1. În Supabase SQL Editor rulează migrarea `supabase/migrations/20261119113000_invitation_email_log.sql` (dacă nu este aplicată automat de pipeline).
2. În Vercel, la Environment Variables, configurează:
   - `RESEND_API_KEY` – cheia Resend
   - `RESEND_FROM_EMAIL` – adresă de expeditor verificată în Resend (de exemplu, Invitatii WEDLY <invitatii@wedly.ro>)
   - `SUPABASE_SERVICE_ROLE_KEY` – cheia Supabase service role (doar pe server, niciodată NEXT_PUBLIC)
   - `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (deja folosite de aplicație)
3. Configurează SPF/DKIM pentru domeniul de expediere în Resend și redeploy.
4. În Dashboard → Invitați, adaugă emailul invitatului. În Confirmări RSVP, generează un link individual, apoi folosește «Trimite prin email».
5. Verifică jurnalul prin «Actualizează istoricul emailurilor». Statusul `sent` înseamnă acceptat de Resend, nu neapărat livrat în inbox.

Măsuri: API-ul verifică utilizatorul și dreptul de scriere la invitați pe eveniment; emailul destinatarului este citit din baza de date, nu din cererea browserului; linkul trebuie să fie pe domeniul wedly.ro; o înregistrare unică per invitat și eveniment previne expedierea repetată. O trimitere eșuată rămâne blocată până la remediere manuală, pentru a evita dublurile în caz de răspuns ambiguu de la furnizor.

Limitări: nu există încă webhook de livrare, reîncercare controlată, emailuri în masă sau atașamente; șablonul emailului este text + HTML simplu, nu copiază încă aspectul complet al previzualizării din dashboard.
