# Șeptică — plan de produs până la alfa

**Data de pornire:** 10 octombrie 2026
**Stare:** direcția alfa confirmată; prima corecție responsive/animații a trecut verificarea locală în Chromium, dar QA pe Safari iOS, Chrome Android și macOS reale rămâne deschisă înainte de playtest extern.
**Principiu:** lansăm o experiență mică, coerentă și testabilă; monetizarea vine după ce vedem că oamenii vor să revină.

## 1. Ce construim

**Ipoteză de produs:** Șeptică este jocul mobil de cărți pe care îl pornești rapid cu un prieten din grupul tău, oriunde, fără download obligatoriu și fără să cauți adversari la întâmplare. Regulile sunt familiare; masa și atmosfera îi dau identitate românească.

**Promisiune pentru primul jucător:** „Încep o partidă în mai puțin de un minut, înțeleg de ce am câștigat sau pierdut și pot invita ușor un prieten la următoarea.” Timpul și formularea sunt ipoteze, nu rezultate demonstrate.

### Public inițial propus

Grupuri de prieteni români care au mai jucat Șeptică și vor să joace 1-la-1, pe rând, de pe telefoanele lor. Nu cerem să fie instalat jocul pentru a deschide invitația; instalarea pe ecranul principal rămâne opțională. Nu optimizăm încă pentru public internațional, matchmaking aleatoriu sau clasamente globale.

### Bucla principală propusă

Un prieten creează masa → trimite un link care identifică acea masă → celălalt intră și joacă imediat → termină partida → cere revanșă sau pasează telefonul/invitația următorului prieten din grup.

Tutorialul obligatoriu nu este ipoteza inițială, fiindcă testerii cunosc deja jocul. Păstrăm regulile pe scurt ca ajutor opțional. Validăm dacă linkul, intrarea la masă și revanșa sunt clare prin observarea unor prieteni care joacă de pe dispozitive diferite.

## 2. Unde suntem acum

Proiectul are deja regulile și pachetul cu 32 de cărți fizice cu ID-uri stabile, joc PvE împotriva AI-ului, camere multiplayer Socket.IO și un manifest PWA. Prima corecție a reparat surse de cărți fantomă, a făcut secvența vizibilă înainte de colectare și a potrivit layout-ul la viewport-uri de telefon și desktop. Interfața nu este încă acceptată pe dispozitivele reale din matrice. Suitele locale documentate acoperă regulile și runde PvE.

Încă este un prototip web, nu un serviciu de joc live:

- serverul ține camerele și progresul doar în memorie; o repornire pierde starea;
- nu există cont sau profil persistent, istoric de partide ori matchmaking public;
- există creare cameră și cod de copiat; am reparat linkul distribuit ca să includă codul mesei, să-l completeze automat și să lase jucătorul să confirme intrarea;
- nu există evenimente de analytics, funnel măsurat, telemetrie de crash ori panou de operare;
- clientul înregistrează acum `public/sw.js`, iar cache-ul shell a fost versionat; instalarea PWA și comportamentul pe telefoane încă trebuie verificate practic;
- nu există economie, magazin, integrare de plăți sau conținut meta-game;
- distribuția pentru alfa este aleasă: web mobil/PWA privată, link-first, instalare opțională; nu trimitem invitații externe până nu trece poarta de calitate UI/mobil și animații.

## 3. Decizia de lansare rapidă

### Alfa: link mobil privat, fără bani reali

Alfa va rula pe web mobil, accesibilă prin link; instalarea PWA este opțională. Domeniul nu este criteriu de lansare. Înainte de invitații externe închidem animațiile și layout-ul pe telefoane, apoi facem QA intern pe hosting privat. Abia după criteriile de acceptare invităm cele cinci perechi.

**Poarta de ieșire din QA intern:** zero suprapuneri sau cărți fantomă; fiecare carte jucată rămâne vizibilă cât să poată fi citită înainte de rezolvarea secvenței; mișcările valide sunt evidente, iar dacă regulile obligă o singură mutare posibilă, acea carte este evidențiată; acțiunile invalide nu pornesc animații optimiste care apoi se întorc; masa, mâna, pachetul și grămezile rămân vizibile pe ecranele din matrice; butoanele sunt ușor de atins și textul lizibil. Respectăm și preferința sistemului pentru mișcare redusă.

Alfa nu va cere plată, nu va afișa oferte și nu va folosi reclame. Putem testa concepte de cosmetice prin prototipuri sau un magazin dezactivat, fără tranzacții.

### Beta: distribuție în magazine după validarea alfa

Pentru Android, conturile personale Google Play create după 13 noiembrie 2023 au de îndeplinit, înainte de solicitarea accesului la producție, un test închis cu minimum 12 testeri înscriși continuu timp de 14 zile. Pentru iOS, TestFlight permite grupuri interne și externe; primul build pentru testeri externi poate necesita review. Acestea sunt constrângeri de planificare, deci conturile de developer și recrutarea testerilor trebuie pornite înainte de „gata de beta”.

Nu ambalăm acum PWA-ul într-un wrapper nativ. După ce vedem revenire și invitații reale, comparăm Android/iOS cu timpul, billing-ul, analytics-ul și costul de mentenanță.

## 4. Gamification și monetizare

### Alfa — măsurăm dorința de revanșă și invitație

- invitație la masă și revanșă vizibile la final de partidă;
- reguli pe scurt, opționale; fără tutorial care întrerupe jucătorii cunoscători;
- profil cosmetic și progresul rămân în afara primei versiuni alfa până știm dacă partida socială e satisfăcătoare;
- fără streak care pedepsește absența, energie, paywall pentru jocul de bază sau monedă premium;
- fără reclame și fără achiziții aleatoare.

### Beta — un singur experiment comercial, dacă retenția justifică asta

Ipoteza inițială este vânzarea directă de cosmetice: fețe de cărți, spate de cărți, teme de masă și rame/avataruri. Jocul rămâne echitabil: nimic cumpărabil nu schimbă regulile, șansele sau viteza de progres competitiv. Începem cu produse cu preț clar, nu cu un sistem complicat de monede.

Adăugăm IAP după ce există conturi/profiluri persistente, inventar server-side, restaurarea cumpărăturilor și validarea bonurilor pe backend. Google recomandă backend securizat pentru verificarea și administrarea tranzacțiilor. Pentru Apple și Google, obiectele digitale folosite în joc trebuie proiectate în jurul regulilor de billing ale magazinului aplicabil.

**Nu lansăm inițial:** abonament, loot boxes, oferte temporizate agresive, pachete care ascund prețul real, reclame forțate sau mecanici care vând înapoi soluția la o fricțiune introdusă intenționat.

## 5. Cum știm dacă alfa merită continuată

### Metrică principală de alfa

**Partide 1-la-1 terminate pe săptămână între prieteni invitați**. PvE-ul poate rămâne mod de probă, dar nu validează promisiunea socială.

### Măsurăm de la primul build extern

- activare: a deschis invitația și a început partida fără ajutor?
- timp de la deschiderea linkului până la start și rata de abandon la join;
- câte invitații se deschid și câte devin partide terminate;
- câte partide au revanșă și câți prieteni din grup joacă ulterior;
- revenire la ziua 1 și ziua 7 pe cohorte;
- partide terminate per jucător activ;
- reconectări nereușite, mutări respinse, erori și sesiuni întrerupte;
- răspuns scurt după joc: „Ai mai juca?” și „Ce te-a făcut să te oprești?”

Nu fixăm praguri de retenție sau venit din benchmark-uri copiate. În alfa stabilim baseline-ul, apoi decidem praguri explicite înaintea următorului test. Un grup mic de 10–30 de jucători oferă indicii calitative, nu dovadă statistică de product-market fit.

### Evenimente minime de produs

`session_start`, `room_created`, `invite_shared`, `invite_opened`, `invite_joined`, `match_start`, `match_end`, `rematch_started`, `match_abandon`, `reconnect_attempt`, `reconnect_success`, `reconnect_failure`, `error_shown`.

Folosim identificatori pseudonimi, colectăm strict ce ne ajută să răspundem la întrebări de produs și nu importăm agenda/contactele. Nu introducem chat liber în alfa.

## 6. Ordinea de lucru

### Felia 0 — terminăm experiența mobilă înaintea recrutării externe

1. Publicul și platforma sunt confirmate: PWA mobilă, prieteni care cunosc Șeptică, 1-la-1 pe rând.
2. Reparăm layout-ul, zona de atingere, lizibilitatea și animațiile pentru aceeași masă scalabilă; matrice QA: portret pe iOS/Safari și Android/Chrome, webapp pe laptop/monitor și macOS (Safari și Chrome unde sunt disponibile).
3. Facem QA local: PvE și multiplayer, secvențe animate, viewport-uri înguste și mișcare redusă; notăm bugurile cu pași de reproducere și capturi. Prima verificare în browser local a acoperit 320×568, 375×667, 390×844, 1366×768, 1920×1080 și 2560×1440; browserul real pe iOS/Android/Mac rămâne de verificat.
4. După poarta internă publicăm un build privat și verificăm invitația/PWA pe telefoane reale.
5. Abia apoi facem cinci sesiuni observate în perechi; testăm revanșa și invitația în grup. Provocările și economia rămân în afara primului test.

### Felia 1 — alfa utilizabilă de oameni din afara echipei

1. Build-ul trece poarta de calitate UI/animații pentru matricea de telefoane.
2. Găzduire stabilă, loguri și alerte pentru server.
3. Link de invitație `?join=COD`; deschiderea lui completează codul mesei, iar jucătorul confirmă intrarea. Implementat; mai trebuie validat pe telefon și pe hosting.
4. Reconectare după refresh/revenire din background și restaurarea mesei după restartul serverului ori mesaj clar dacă masa a expirat.
5. Flux mobil clar: creează masa, trimite invitația, joacă 1-la-1, termină, revanșă.
6. Înregistrarea service worker-ului și verificarea instalării PWA pe telefoane; jocul online continuă să ceară rețea.
7. Evenimentele de măsurare și un sumar săptămânal.
8. Playtest extern pe telefoane reale: iPhone și Android, portret, ecrane mici, rețea slabă, revenire din background.
9. Politică de confidențialitate și informațiile necesare testerilor înainte de a colecta date externe.

### Felia 2 — progresia care face revenirea plăcută

Adăugăm un singur set de provocări recurente și recompense cosmetice. Îl păstrăm doar dacă testele arată că oamenii îl observă, îl înțeleg și revine mai multă lume fără să simtă că trebuie să facă grind.

### Felia 3 — beta și primul test de IAP

După alegerea platformei: distribuție închisă prin magazin, backend de profil/inventar, billing oficial, verificare server-side și un test de cosmetice la prețuri clare. Venitul per utilizator este metrică de diagnostic, nu motivul pentru care declarăm alfa reușită.

## 7. Rolul tău de Product Manager

Tu ești owner-ul produsului și al contactului cu jucătorii. Eu pot face auditul, propunerile, implementarea, instrumentarea și pregătirea builds; nu pot înlocui recrutarea reală, observațiile tale sau deciziile de produs.

### Ce faci în fiecare săptămână

1. **Acum:** confirmi că testăm telefoane în portret pe iOS și Android, plus webapp pe laptop/monitor și Mac. Dacă ai la îndemână, trimite modelele și browserele concrete; încă nu programezi sesiuni externe.
2. **În QA intern:** alegi o întrebare și un rezultat observabil: „Se vede și se poate juca masa pe telefoane mici fără suprapuneri sau animații care ascund cărțile?”
3. **După poarta internă:** recrutezi cinci perechi. Fiecare pereche aduce două telefoane și primește linkul și timpul rezervat; nu le spui unde să apese.
4. **În sesiune:** urmărești tăcut fluxul de la creare la join, prima mutare, finalul partidei și revanșă; notezi timpul și locurile unde cer ajutor.
5. **După sesiune:** întrebi ce a fost neclar/satisfăcător și dacă ar juca revanșa sau ar invita un prieten. Nu întrebi „ți-ar plăcea funcția X?” și nu folosești complimente drept validare.
6. **Vineri:** alegi maximum trei probleme pentru următoarea felie; fiecare are observație, impact, condiție de acceptare și owner.
7. **La finalul feliei:** decizi pe baza notițelor și metricilor: continuăm, schimbăm ipoteza sau oprim funcția.

### Ce trebuie să hotărăști tu, nu eu

- cine sunt primii 10–20 de testeri și cum îi contactezi;
- ce promisiune și ce compromisuri de monetizare accepți;
- dacă datele din test susțin investiția în progresie, magazin și lansare beta.

### Ce faci tu imediat

1. Pentru moment, trimite-mi modelele de telefoane și browsere disponibile în cercul tău și spune dacă testăm în principal în portret. Nu trebuie să cumperi/înregistrezi domeniul ca să reparăm UI-ul.
2. După ce build-ul trece QA intern, scrii 10–20 de nume și îi grupezi în perechi; programezi 20 de minute per pereche.
3. În testul extern nu ajuți la share/join. Notezi link deschis, join reușit, timpul până la prima mutare, partidă terminată, revanșă și blocaje.
4. Îmi trimiți notițele fără nume reale: `ID pereche | modele telefoane/browser | a intrat prin link? | secunde până la prima mutare | partidă terminată? | revanșă? | blocaj/citat`.

**Decizie la capătul celor cinci sesiuni:** alegem cel mai mare blocaj comun și îl reparăm înainte de a proiecta progresie. Dacă perechile termină o partidă dar nu cer revanșă și nu vor invita următorul prieten, nu construim magazinul ca să mascăm problema.

## 8. Mindset de studio mare, adaptat unei echipe mici

Nu copiem organigrama sau economy tuning-ul Supercell/Miniclip. Împrumutăm disciplina care se potrivește proiectului: test extern devreme, echipă mică și responsabilă, focus pe jucător, decizii rapide când dovada contrazice planul. Supercell a descris public testarea mai devreme cu jucători reali și libertatea echipelor de a pivota; Miniclip pune accent public pe jocuri sociale ușor de pornit, multiplayer și experiențe mobile. Pentru noi traducerea este: un build jucabil la fiecare felie, testatori reali în fiecare săptămână și nicio economie construită înainte să știm de ce revine lumea.

## 9. Primele livrabile de echipă

- **PM (tu):** confirmi matricea de telefoane și criteriile de acceptare, apoi recrutezi perechile și conduci sesiunile externe după QA intern.
- **Engineering (eu):** repară UI-ul mobil/animațiile, verifică fluxul de joc și pregătește mediul privat, logurile și build-ul candidat.
- **Împreună:** aprobăm o pagină de produs și criteriile de acceptare pentru alfa înainte să începem magazinul, moneda sau sezonul.

## 10. Surse publice și constrângeri

- Supercell despre validare externă timpurie, echipe independente și pivotare: [Comfortable Feeling Uncomfortable](https://supercell.com/en/news/comfortable-feeling-uncomfortable/).
- Miniclip despre jocuri mobile și multiplayer cu prietenii: [Our Story](https://www.miniclip.com/our-story) și [Web Games](https://www.miniclip.com/games/web).
- Apple recomandă alegerea modelului de business devreme și descrie tipurile de IAP: [App Store Get Started](https://developer.apple.com/app-store/get-started/).
- Google Play descrie testele închise și cerința aplicabilă anumitor conturi personale: [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- Google recomandă backend securizat pentru verificarea și administrarea achizițiilor: [Google Play Billing](https://developer.android.com/google/play/billing) și [backend integration](https://developer.android.com/google/play/billing/backend).
- Apple descrie distribuția beta cu TestFlight: [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

---

**Confirmat de PM:** alfa web mobil/PWA, link-first; publicul este grupuri de prieteni care au mai jucat Șeptică; joacă 1-la-1, pe rând. IAP rămâne în afara alfa. Următoarea decizie după playtest este dacă validarea susține progresie cosmetică și o versiune beta în magazine.
