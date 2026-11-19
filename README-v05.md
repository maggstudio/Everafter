# EVERAFTER v0.5 — colaborare, permisiuni pe module

## Instalare (fără pierderea datelor)
1. Înainte de orice schimbare, exportă `public.wedding_workspaces` din Supabase (și păstrează backup local criptat dacă sunt date personale).
2. În **Supabase > SQL Editor**, rulează integral `supabase/v05.sql` o singură dată. Scriptul este rerulabil; **nu șterge** `wedding_workspaces`.
3. În GitHub, înlocuiește fișierele din v0.4 cu cele din arhivă; commit/push pe branch-ul de deployment. Păstrează variabilele Vercel existente. Verifică build-ul în Vercel.
4. Autentifică-te cu utilizatorul v0.4. `ensure_my_wedding()` creează nunta și copiază datele JSON din `wedding_workspaces` în `wedding_modules` **numai la prima accesare**. Datele originale rămân în tabelul v0.4.
5. În `Supabase > Table Editor`, verifică `weddings`, `wedding_members`, `wedding_modules` (6 module). Compară datele cu `wedding_workspaces`.
6. Deschide `/team` ca proprietar; invită **un cont existent cu email confirmat**. Invitatul deschide `/team` în propriul cont și acceptă invitația.
7. Invitatul deschide `/dashboard?wedding=UUID` (UUID din invitația sa, afișat în pagina Echipă). Testează vizualizare/modificare permisă și acces interzis pe alt modul.

## Observații și limitări
- Migrarea este **lazy per utilizator**: fiecare proprietar existent își migrează datele la prima autentificare după v0.5. Nu rulează o migrare globală a tuturor conturilor.
- Noua structură separă modulele în rânduri JSONB; **nu** normalizează încă fiecare invitat, sarcină și cheltuială în tabele individuale. Acesta este un pas intermediar.
- V0.5 folosește politici RLS pe modul, însă editările simultane în același modul sunt **last-write-wins**. Este necesar control de versiuni/conflicte înainte de producție.
- Invitațiile sunt **în aplicație**, nu trimit email. Utilizatorul invitat trebuie să aibă cont confirmat.
- Fiecare cont deține implicit o nuntă proprie; pentru a accesa nunta partajată folosește `?wedding=UUID`.
- Înainte de lansarea comercială: audit de securitate SQL și RPC, teste automatizate RLS cu două conturi, politici de confidențialitate/GDPR, backup verificat, migrare la tabele relaționale, limitarea ratei invitațiilor.
- Panoul admin rămâne dezactivat; plățile, RSVP și semnăturile nu sunt încă implementate.
