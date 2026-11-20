# WEDLY v1.1.3 – livrarea emailurilor

## Supabase
Execută migrarea `supabase/migrations/20261120150000_invitation_delivery_tracking.sql` în SQL Editor. Nu șterge jurnalul existent.

## Resend
În Resend → Webhooks, adaugă endpointul:
`https://wedly.ro/api/webhooks/resend`

Selectează evenimentele:
- `email.delivered`
- `email.bounced`
- `email.complained`
- `email.failed` (dacă este disponibil)

Copiază secretul de semnare al webhookului (`whsec_...`), nu cheia API.

## Vercel
Settings → Environment Variables → Production:
`RESEND_WEBHOOK_SECRET` = secretul webhookului.
Fă Redeploy pentru ca serverul să preia variabila.

## Verificare
Creează un invitat nou, generează RSVP, trimite emailul și apasă «Actualizează istoricul emailurilor» în Dashboard → Invitați. Statusul «Trimis către Resend» se schimbă în «Livrat» după webhookul `email.delivered`. În Resend → Webhooks poți verifica livrarea evenimentelor.

## Note
Nu este implementată încă retransmiterea automată sau schimbarea adresei unui invitat deja expediat. Nu publica secretul webhookului. Evenimentele pentru emailuri fără provider_id cunoscut sunt ignorate; pot apărea curse rare când evenimentul ajunge înaintea salvării ID-ului providerului.
