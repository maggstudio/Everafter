# WEDLY v1.0.2 — RSVP

## Instalare sigură
1. Fă backup la `wedding_modules`, `weddings`, `wedding_members` și invitații.
2. Instalează codul pe un branch de test; folosește un proiect Supabase separat pentru Preview.
3. Rulează `supabase/v102.sql` în proiectul Supabase de test, apoi testează.
4. Pentru producție, rulează `v102.sql` înainte de a publica codul în `main`. Nu rerula `schema.sql`.
5. Testează cu un invitat fictiv: generează link în `/rsvp/manage`, deschide `/rsvp?token=...` în incognito, confirmă/refuză, reîncarcă lista și verifică starea invitatului. Testează revocarea și expirarea.

## Detalii și limite
- Linkurile sunt tokenuri aleatoare de 256 biți; în DB se păstrează doar SHA-256. Linkul este vizibil numai la generare; emiterea altuia invalidează linkul precedent.
- Invitatul nu are nevoie de cont. Nu trimitem automat emailuri/SMS; organizatorul copiază linkul.
- Răspunsurile actualizează și statusul în `wedding_modules.guests`. Totuși, un editor care păstrează pagina deschisă cu date vechi poate suprascrie ulterior statusul; înainte de editare, reîmprospătează datele.
- Fiecare link este individual, nu se pot folosi linkurile pentru a vedea alte evenimente. Deținătorul linkului poate actualiza răspunsul până la expirare/revocare.
- Lipsesc încă rate limiting la nivel infrastructură, jurnalul de consimțământ și trimiterea automată a mesajelor. Nu distribui linkuri public.
- `v102.sql` creează un tabel nou și funcții RPC, nu șterge datele existente.
