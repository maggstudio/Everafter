# WEDLY v0.9 — Dashboard și checklist recomandat

## Funcții
- Panou cu buget depășit, programări trecute, programări viitoare și statusul invitaților.
- Sugestii de checklist diferite pentru nuntă și botez, adăugate numai la apăsarea butonului.
- Respectă permisiunile de citire/scriere ale modulelor; nu adaugă tabele noi.
- Datele existente nu sunt modificate automat. Nu există notificări email sau joburi programate.

## Instalare
1. Backup al proiectului și al datelor Supabase. Creează branch pornind din main.
2. Înlocuiește app/dashboard/page.tsx și app/style.css cu fișierele din arhivă.
3. Verifică build-ul și testează în Preview cu variabilele Supabase configurate.
4. Testează separat proprietar și colaborator cu permisiuni restrânse.
5. Abia apoi fă merge în main. Nu este necesară migrare SQL.

## Limite
- Programările cu dată trecută sunt semnalate informativ, nu sunt automat considerate restante.
- Recomandările sunt fixe, nu calculate după data evenimentului.
- Modificările simultane folosesc comportamentul de sincronizare deja existent.
