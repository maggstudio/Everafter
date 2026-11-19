# WEDLY v1.0.1 – Fix navigare Furnizori

Pachet complet bazat pe WEDLY-v1.0.1-fix-build.zip.

Modificari:
- app/dashboard/page.tsx: Furnizori apare in navigarea principala desktop si mobil, numai cu drept de citire.
- app/style.css: stiluri pentru noul link.
- lib/store.tsx: include deja vendors in tipul Module.
- app/team/page.tsx: include deja vendors in lista de permisiuni.

Nu este necesara o migrare SQL suplimentara pentru aceasta corectie.

Atentie: pachetul este o copie completa a arhivei precedente, nu o extragere din ultimul commit GitHub. Daca ai modificat alte fisiere intre timp, compara-le inainte de inlocuire.

Dupa upload: verifica build Vercel, navigarea desktop/mobil, accesul pentru proprietar si lipsa linkului pentru colaboratorii fara permisiune. Nu a fost rulat un build Next.js in acest mediu.
