# WEDLY – sincronizare fără întreruperea interfeței

Corecție în `lib/store.tsx`: sincronizarea periodică la 30 secunde nu mai setează `ready=false`, nu mai afișează mesajul de încărcare și nu mai suprascrie editările locale nesalvate detectate înainte de aplicarea datelor. Nu schimbă schema SQL.

Arhiva conține proiectul complet bazat pe pachetul anterior `WEDLY-v1.0.1-fix-meniu-furnizori.zip`. Dacă ai schimbări ulterioare pe GitHub, compară înainte de înlocuire. Nu a fost executat un build Next.js complet.
