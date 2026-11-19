# EVERAFTER v0.4 — Autentificare și salvare în Supabase

1. Supabase > SQL Editor > New query: execută `supabase/v04.sql` (nu schema veche `schema.sql`).
2. Supabase > Authentication > URL Configuration: setează Site URL la URL-ul Vercel și adaugă în Redirect URLs `https://DOMENIUL-TAU.vercel.app/**`.
3. Supabase > Authentication > Providers > Email: activează Email; pentru test, păstrează confirmarea prin email și verifică livrarea.
4. Vercel > Project > Settings > Environment Variables: setează `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pentru Production. **Nu adăuga `service_role`/secret key în variabile NEXT_PUBLIC**.
5. GitHub: înlocuiește fișierele proiectului cu cele din arhivă; păstrează `package.json` în rădăcina repository-ului. Vercel va declanșa un deployment nou.
6. Deschide `/login`, creează un cont, confirmă emailul, autentifică-te, apoi accesează `/setup` și `/dashboard`.
7. Verifică în Supabase > Table Editor > `wedding_workspaces` că apare o înregistrare după modificarea datelor.

**Limite ale v0.4:** un workspace per cont; accesul comun al partenerilor nu este implementat. Calendarul rămâne temporar în memoria paginii. Nu există plăți sau mesaje trimise. Nu utiliza încă date reale ale invitaților sau documente sensibile. `/admin` a fost dezactivat intenționat. Pentru lansare comercială sunt necesare audit de securitate, migrarea la tabele normalizate, validare pe server și testarea RLS.
