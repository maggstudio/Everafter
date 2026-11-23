# Distribuirea invitațiilor din conturile organizatorilor

Schimbare: Resend rămâne pentru emailurile operaționale WEDLY (conturi, digest, sarcini, programări, plăți). WEDLY nu mai trimite invitații prin email și nu mai trimite notificare la fiecare răspuns RSVP.

- Formularul invitaților nu mai colectează email; editarea unui invitat șterge valoarea email legacy din înregistrarea respectivă.
- Pentru fiecare invitat, organizatorul generează un link RSVP individual în panoul „Invită / RSVP”, apoi alege WhatsApp, Instagram, Messenger sau Email personal.
- WhatsApp deschide linkul `wa.me` cu textul personalizat; numărul de telefon, dacă există, este precompletat.
- Instagram și Messenger **nu permit garantat** completarea automată a unui mesaj privat dintr-o aplicație web. Textul este copiat în clipboard și se deschide inboxul; organizatorul lipește și trimite.
- Email personal folosește `mailto:`, adică aplicația de email configurată de organizator; WEDLY nu expediază nimic.
- Endpointul de trimitere email invitații returnează HTTP 410. Cronul RSVP a fost eliminat din `vercel.json`, iar endpointul vechi returnează HTTP 410.
- Linkul RSVP este secret și poate fi afișat numai imediat după generare; emiterea unui link nou invalidează linkul anterior. Nu generați automat un nou link la fiecare click de distribuire.
- **Important pentru migrare:** valorile email salvate anterior în JSON pot exista în continuare până la editarea invitatului. Pentru eliminarea completă a datelor legacy trebuie o migrare controlată și un backup. Setările `rsvp_immediate` existente în baza de date rămân stocate, dar nu mai sunt expuse în UI și nu mai sunt procesate.
- Nu există integrare API oficială de trimitere automată Instagram/Messenger; nu pretindem că un mesaj a fost trimis doar pentru că aplicația a fost deschisă.
- **Verificări înainte de merge:** `npm ci && npx tsc --noEmit && npm run build`, test manual pe Android/iOS/desktop pentru cele patru canale, verificarea accesului la RSVP și a vechilor endpointuri 410.
