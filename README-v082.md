# WEDLY v0.8.2 — Comutare rapidă între evenimente

## Ce se schimbă
- `lib/store.tsx`: noua funcție `selectEvent(id)` încarcă doar colaboratorii și modulele evenimentului selectat, în paralel, fără reinițializarea întregului profil și fără reîncărcarea listei de evenimente.
- `app/events/page.tsx`: butonul Deschide folosește `selectEvent` și navigare client-side în locul reîncărcării întregii aplicații.
- Schimbarea este blocată cât timp există modificări nesalvate sau o salvare în curs, pentru a nu pierde date.

## Instalare
1. Fă backup și creează un branch din `main` (care include deja fixul de login v0.8.1).
2. Copiază cele două fișiere în aceleași căi din proiect. Nu înlocui alte fișiere, mai ales `app/login/page.tsx`.
3. Verifică build-ul și testează schimbarea nuntă ↔ botez, datele separate, permisiunile, salvarea înainte de schimbare, logout/login.
4. Publică doar după testare. Nu este necesară migrare SQL.

## Limite
- Primul login încă execută fluxul complet de încărcare.
- Cererile către Supabase pot dura diferit în funcție de rețea și serviciu.
- Navigarea prin Back/Forward sau linkurile directe către alte evenimente nu sunt optimizate prin acest patch; se recomandă o revizie separată a rutării și a sincronizării query-stringului.
- Patch-ul nu a fost validat pe infrastructura Vercel/Supabase de producție.
