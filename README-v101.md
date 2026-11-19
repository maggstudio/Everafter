# WEDLY v1.0.1 – Furnizori și contracte

## Conținut
- Pagina `/vendors`, cu furnizori independenți pentru fiecare eveniment.
- Categorie, contact, valoare contract, total plătit, scadență și note.
- Control acces: reutilizează permisiunea `expenses` (Buget). Nu există încă permisiune distinctă pentru furnizori.
- Datele sunt salvate în modulul JSON `vendors` al tabelului `wedding_modules`.
- Valorile furnizorilor NU sunt sincronizate automat cu lista de cheltuieli; evită dublarea manuală.
- Nu există upload de contracte sau documente în această versiune.

## Ordine sigură de instalare
1. Exportă un backup Supabase al tabelelor `weddings`, `wedding_members`, `wedding_modules` și fă un tag Git pentru v0.9.
2. Testează într-un proiect Supabase staging separat, cu variabile Vercel Preview configurate corect.
3. Rulează `supabase/v101.sql` în SQL Editor (staging mai întâi), după `v08.sql`.
4. Publică fișierele din ZIP în branch-ul `wedly-v101`; build/test pe Vercel Preview.
5. Verifică: create, edit, delete, persist, două evenimente, cont cu Buget read-only, cont fără Buget, logout/login, schimbarea evenimentului cu modificări nesalvate.
6. Numai după testare aplică migrarea în producție și fă merge în `main`.

## Limitări / riscuri
- Schema păstrează `wedding_modules.content` JSONB: nu există validare de câmp la nivel de SQL, iar editările simultane rămân last-write-wins.
- În UI `paidAmount` este totalul plătit introdus manual, nu un registru de tranzacții; soldul este `contractAmount - paidAmount`.
- RLS pentru `vendors` folosește `expenses`; un colaborator cu acces la buget are acces echivalent la furnizori.
- Migrarea schimbă politicile RLS pentru `wedding_modules`: verifică în staging înainte de producție.
- Nu a fost executat un build Next.js complet în mediul de generare.
