# WEDLY — panou owner-only

Acces exclusiv: utilizator Supabase Auth cu email verificat `ioan.romulus@gmail.com`, validat **în baza de date** prin `auth.uid()` și `auth.users`. Nu există endpoint public de agregare și nu sunt expuse credențiale service-role în browser.

## Lansare

1. Execută integral `supabase/platform_admin.sql` în Supabase SQL Editor.
2. Publică branch-ul în Vercel / merge în main.
3. Autentifică-te cu adresa autorizată, verificată, apoi deschide `/dashboard`: linkul „Monitorizare WEDLY” apare numai dacă `wedly_platform_admin()` returnează true.
4. Deschide `/admin`. Testează și cu alt cont: trebuie să arate „Acces restricționat”. Testează RPC direct cu alt cont: trebuie să returneze 42501.
5. Verifică statisticile cu Supabase Dashboard și datele de bază.

## Indicatori

- Conturi totale și utilizatori cu conectare în ultimele 7/30 zile. **Nu este DAU/MAU real**, ci proxy bazat pe `last_sign_in_at`.
- Evenimente totale/noi în 30 zile, numărul intrărilor din modulele `guests`, dimensiunea bazei de date.
- Praguri 70%/85% raportate la 500 MB **doar ca reper Supabase Free**; configurația planului real trebuie conectată ulterior.
- Catalog Free / Plus / Premium stocat în DB, dar planurile Plus/Premium sunt inactive și nu sunt folosite pentru autorizarea funcțiilor. Nu există facturare sau trimitere emailuri invitaților.

## Ce nu este încă implementat

- Metrici live Vercel/Resend/Storage, costuri exacte, monitorizare performanță și alerte automate.
- Activare pachete, checkout, abonamente, limitare efectivă a funcțiilor pe plan, notificări comerciale.
- Cozi de emailuri, batching la notificări, teste de încărcare, telemetrie evenimente.
- Evită afișarea unor estimări ca valori măsurate.

**Notă:** migrarea necesită aplicare manuală; doar merge-ul GitHub nu modifică Supabase. Pentru un sistem de producție, securitatea trebuie testată și cu un cont neautorizat înainte de a considera panoul lansat.
