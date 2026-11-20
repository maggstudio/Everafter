# WEDLY – activare rezumat zilnic prin email

1. Aplică migrarea `supabase/migrations/20261121110000_notification_delivery.sql` în Supabase.
2. Configurează în Vercel variabilele `CRON_SECRET` (secret aleator puternic), `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` și `NEXT_PUBLIC_SUPABASE_URL`.
3. Configurează un scheduler de încredere să trimită **GET** către `https://wedly.ro/api/notifications/digest` la fiecare oră, cu antetul `Authorization: Bearer <CRON_SECRET>`. În funcție de planul Vercel, cronurile frecvente pot avea limitări; folosește un scheduler compatibil cu planul.
4. Fiecare membru activează **Rezumat zilnic** din Dashboard → Notificări și alege ora (Europe/Bucharest). Opțiunea este dezactivată implicit.
5. Verifică răspunsul endpointului (`sent`, `skipped`, `failed`) și logurile Vercel. Fiecare membru primește maximum un email per eveniment și zi. Înregistrările eșuate nu se reîncearcă automat, pentru a evita dublarea emailurilor în cazul unui timeout după expediere.

**Securitate:** endpointul refuză apelurile fără `CRON_SECRET`. Nu expune secretul în frontend. Rezumatul respectă permisiunile de citire ale fiecărui membru. Ora este interpretată în fusul orar al României, inclusiv schimbările DST.

**Limite curente:** endpointul procesează maximum 500 de abonamente pe oră; dacă platforma depășește acest volum, trebuie adăugată paginare. Emailurile imediate RSVP și reminderele de sarcini/programări/plăți nu sunt încă conectate la expediere.
