# WEDLY — Audit tehnic preliminar și plan de dezvoltare

Data: 23 noiembrie 2026  
Repository: `maggstudio/Everafter`  
Bază: `main`, commit `18ec9aa9cbbf153d56c5371fc50d555c0c6c6ccf`

> Audit static parțial. Au fost inspectate direct fișierele-cheie din aplicație și istoricul recent al commiturilor; nu a fost posibilă enumerarea exhaustivă a arborelui repository-ului prin instrumentele disponibile. Nu s-au executat build, teste, migrări SQL sau verificări în producție.

## Situația actuală

Identitatea comercială folosită de codul actual este **WEDLY** (`app/layout.tsx`, `app/components/BrandLogo.tsx`, `app/page.tsx`), cu domeniul `wedly.ro`. Numele repository-ului și documentația principală păstrează denumirea EVERAFTER. Nu reintroduceți brandingul EVERAFTER în interfață fără o decizie explicită.

### Module observate în sursă

- Conturi: `app/login/page.tsx` și `lib/supabase.ts` — autentificare, înregistrare, resetare parolă prin Supabase.
- Evenimente: `app/events/page.tsx` — creare nunți/botezuri, selecție, ștergere cu confirmare.
- Stare și colaborare: `lib/store.tsx` — date pe eveniment, permisiuni și sincronizare.
- Dashboard: `app/dashboard/page.tsx` — overview, checklist, buget, invitați, calendar, furnizori, invitații, mese, setări.
- Buget: `app/dashboard/BudgetPanel.tsx` — categorii, înregistrări, filtre.
- Invitați: `app/dashboard/GuestsPanel.tsx` — gestionare invitați și citirea răspunsurilor RSVP.
- Invitații: `app/dashboard/InvitationsPanel.tsx` — șabloane, personalizare, fotografii, preview.
- Mese: `app/dashboard/SeatingPanel.tsx` — capacități, alocări, export prin print/PDF.
- Furnizori: `app/dashboard/VendorsPanel.tsx` — contracte, plăți, scadențe, documente PDF; semnătura electronică este explicit amânată.
- Calendar: `app/dashboard/CalendarPanel.tsx` — programări și export ICS.
- Notificări: `app/dashboard/NotificationSettingsPanel.tsx`, `app/dashboard/RemindersPanel.tsx`, `vercel.json` — preferințe, alerte și definiții cron.
- Identitate: `app/components/BrandLogo.tsx`, `lib/brand-email.ts` — WEDLY. Invitațiile pentru invitați nu trebuie să primească brandingul platformei, conform istoricului commiturilor.

## Probleme și riscuri de verificat

1. **Documentație depășită (confirmat):** `README.md` descrie versiunea 0.3 și afirmă că nu există conturi/Supabase; codul actual conține aceste integrări. `supabase/schema.sql` este o schiță veche, nu trebuie tratată ca schema de producție.
2. **Migrații și RLS (nevalidat):** inventarierea tuturor migrațiilor, ordinea aplicării, politicile RLS și funcțiile SECURITY DEFINER trebuie auditate în raport cu accesul owner/partner/planner.
3. **Ștergere eveniment (nevalidat end-to-end):** ruta `app/api/events/delete/route.ts` folosește verificarea proprietarului și cheia de serviciu pentru ștergere; trebuie testate izolarea între evenimente, cascadele și curățarea fișierelor.
4. **Emailuri și cron (nevalidat operațional):** `vercel.json` definește cron pentru digest, RSVP și remindere. Verificați protecția endpointurilor, planul Vercel, secretele, idempotency, fusul orar și rezultatele efective.
5. **Calendar ICS (necesită test):** verificați validitatea expresiei regulate pentru oră și formatul DTSTART, folosind un parser ICS real; evitați schimbări fără reproducerea problemei.
6. **Confidențialitate (nevalidat):** invitații, fotografiile și registrul darurilor conțin date personale; verificați accesul, retenția, exportul și ștergerea conform GDPR.
7. **Testare (de adăugat):** `package.json` expune doar `dev`, `build`, `start`; nu sunt configurate scripturi dedicate pentru teste, lint sau typecheck.
8. **Semnături electronice (lipsă explicită):** panoul furnizorilor indică integrare ulterioară.
9. **Plăți și abonamente (de verificat):** oferta de lansare afișează prețuri orientative și gratuitate; nu presupuneți că există checkout real.

## Plan propus, în ordine

### P0 — Siguranță și verificare înainte de lansare
- Inventar complet fișiere, API routes și migrații SQL.
- Rulează `npm ci`, `npx tsc --noEmit` și `npm run build` într-un mediu de dezvoltare.
- Teste de izolare multi-eveniment, RLS și autorizare pe roluri.
- Teste pentru token RSVP unic, acces la fotografii și ștergere definitivă.
- Verifică secretele cron și livrarea emailurilor, fără trimitere către invitați reali.

### P1 — Calitate și documentație
- Actualizează README pentru WEDLY, păstrând istoricul EVERAFTER și cerințele de configurare.
- Introdu scripturi de typecheck și test și teste automate pentru funcțiile critice.
- Adaugă documentație de migrare și checklist de deploy/rollback.
- Testează experiența mobilă, accesibilitatea și mesajele de eroare.

### P2 — Funcționalități comerciale
- Semnături electronice prin furnizor conform cerințelor legale.
- Pachete și entitlements validate pe server, apoi plăți și webhookuri.
- Flux complet furnizori/organizatori și monitorizare operațională.

## Reguli de lucru
- Nu modificați direct `main` fără verificare.
- Nu executați migrații SQL de producție automat.
- Nu expuneți chei Supabase sau date personale în repository.
- Păstrați invitațiile de nuntă/botez fără logo WEDLY.
- Implementați schimbările în PR-uri mici, cu teste și pași de rollback.
