# Link RSVP reutilizabil

Modificare frontend: butonul „Invită” / „Trimite invitația” reutilizează linkul RSVP pentru fiecare invitat, inclusiv după reîncărcarea paginii sau autentificarea de pe alt dispozitiv. Distribuirea prin WhatsApp, Instagram, Messenger sau email personal nu mai cere emiterea unui link nou. „Revocă linkul” devine „Anulează invitația”.

## Ordinea de lansare

1. Execută manual în Supabase SQL Editor fișierul `supabase/rsvp_share_links.sql`.
2. Verifică drepturile RPC și faptul că `rsvp_list`, `rsvp_issue` și `rsvp_revoke` au semnăturile utilizate în SQL.
3. Publică frontendul pe Vercel.
4. Testează: generează invitația, distribuie-o pe două canale, reîncarcă pagina, apasă din nou „Trimite invitația” și verifică identitatea URL-urilor; testează și alt dispozitiv.
5. Testează anularea, reemiterea, răspunsul invitatului și accesul unui utilizator fără drepturi.

**Atenție:** dacă schema RSVP actuală aplică o expirare automată prin `expires_at`, această migrare nu o elimină; linkul este refolosit doar cât timp tokenul de bază este încă valid. Pentru garanția cerută „până la răspuns” trebuie adaptată separat durata de valabilitate în funcția/tabela RSVP existentă. Nu pretindeți că această condiție este rezolvată fără verificarea SQL-ului existent.

**Securitate:** tokenurile sunt secrete; tabela nu acordă SELECT direct rolurilor anon/authenticated, iar funcția de citire verifică drepturile de editare a invitaților. Backupurile și administratorii bazei de date pot accesa valorile brute.
