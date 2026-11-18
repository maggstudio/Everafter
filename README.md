# EVERAFTER v0.3 – Prototip Next.js pentru România

Proiect web demonstrativ cu interfață responsive în română.

## Pornire

Necesită Node.js 20+.

```bash
npm install
npm run dev
```

Deschide `http://localhost:3000`.

## Pagini

- `/` – prezentare EVERAFTER
- `/setup` – configurarea nunții și a pachetului
- `/dashboard` – dashboard, checklist, buget, invitați, calendar
- `/admin` – configurator demo de prețuri și drepturi pe pachet

## Limitări importante

- Datele principale se salvează doar în `localStorage`, pe dispozitivul/browserul curent; programările din calendar sunt doar în memoria paginii.
- `/admin` nu este protejată: **nu publicați acest demo ca aplicație comercială**.
- Nu există conturi, Supabase conectat, plăți, invitații trimise, contracte semnate sau notificări automate.
- Prețurile sunt exemple și nu se încasează bani.
- `supabase/schema.sql` este o schiță de bază de date, cu RLS activat fără politici de acces; trebuie completată și testată înainte de utilizare.
- Pentru producție sunt necesare validare server-side, autentificare, autorizare per eveniment, webhook-uri plăți, audit, GDPR și integrarea furnizorilor externi.

## Etapa următoare

Integrare Supabase Auth, politici RLS, salvare permanentă și rută admin protejată; apoi entitlements validate pe server și integrare plăți.
