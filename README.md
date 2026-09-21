# Auto ZM SRL — Site parc auto (fără plăți online)

## 🌍 LIVE (permanent, online 24/7)
- Site: **https://labsfrontier.github.io/Auto-ZM-SRL/**
- Admin: **https://labsfrontier.github.io/Auto-ZM-SRL/admin/** (admin / autozm123)
- Repo: https://github.com/labsfrontier/Auto-ZM-SRL (branch `main` → deploy automat la fiecare `git push`)

### Domeniu propriu (când îl cumperi, ex: autozm.it)
1. La registrar setezi DNS: record CNAME `www` → `labsfrontier.github.io` (+ 4 record A apex către 185.199.108.153 / .109.153 / .110.153 / .111.153)
2. În repo: Settings → Pages → Custom domain → scrii `www.autozm.it` → Save (GitHub emite certificat HTTPS automat)
3. Bifezi „Enforce HTTPS". Gata — fără alte modificări în cod.

### Database condiviso (Firebase) — ca anunțurile adminului să le vadă TOȚI
Fără asta, anunțurile se salvează doar în browserul adminului. Pași (gratuit, ~10 min):

1. Intră pe **console.firebase.google.com** (cont Google) → **Add project** → nume `Auto-ZM` → Continue (Analytics poți să-l dezactivezi).
2. Meniu **Build → Realtime Database** → **Create Database** → locație `europe-west1 (Belgia)` → **Start in locked mode**.
3. Tab **Rules** → lipește și **Publish**:
```
{"rules":{".read":true,".write":false,"cars":{".write":"auth != null"}}}
```
4. **Project Overview → </> (web)** → nickname `site` → **Register** → copiază obiectul `firebaseConfig` și **trimite-mi-l mie** — îl montez eu în `js/firebase-config.js` și public automat.
5. Meniu **Build → Authentication → Sign-in method** → **Email/Password → Enable** → tab **Users → Add user** → email + parolă puternică → acestea devin **datele de login în panoul admin** (în locul admin/autozm123).

Cum funcționează după: adminul se loghează cu emailul, tot ce salvează ajunge instant în baza comună, iar site-ul public se actualizează **live, fără refresh**, pentru toți vizitatorii. Planul gratuit ajunge lejer (1 GB, 100 conexiuni simultane).

### Important: datele adminului
Stocul mașinilor se salvează în browser (localStorage) **separat pe fiecare adresă**. Lucrează pe URL-ul LIVE pentru anunțuri reale; ce e pe localhost rămâne local. Folosește Export/Import JSON pentru mutări.

Site profesional, static (HTML + CSS + JS), fără server, fără bază de date.
Datele mașinilor se salvează în browser (localStorage) — perfect pentru un parc auto mic.

## Cum deschizi site-ul
- Deschide `index.html` în browser, sau
- Rulează local: `python3 -m http.server 8000` în acest folder → http://localhost:8000

## Pagini publice
- `index.html` — Home (hero, ricerca, in evidenza, servizi, testimonianze, banner panoramico)
- `stoc.html` — Stoc cu filtre (marcă, carburant, cutie, buget, an, status) + sortare
- `detalii.html?id=...` — Dettagli auto: foto, descrizione, optional, tabella specs, pulsanti Chiama / WhatsApp
- `despre.html` — Chi siamo (+ banner panoramico + galleria sede)
- `contact.html` — Contact + formular programare test drive (fără plată)

> Fără metode de plată, conform cerinței. Plata se face la sediu, cu contract + factură.

## Interfața de administrator (separată)
- Adresă: `admin/index.html`
- Login demo: utilizator `admin` / parolă `autozm123` (o schimbi din tab-ul Backup & Setări)
- Poți: **adăuga / edita / șterge mașini**, scrie **descrieri lungi**, dotări, preț, km, status (Disponibil/Rezervat/Vândut), poze prin link SAU încărcare de pe calculator.
- Tot ce salvezi apare instant pe site (Home + Stock + Dettagli).
- Backup: Export / Import JSON + Reset demo.

## Poza de fundal din footer (biroul Auto ZM)
1. Salvează poza din chat ca `footer-birou.jpg`
2. Pune-o în `assets/img/footer-birou.jpg`
3. Gata — footerul o folosește automat cu overlay bleumarin peste.

## Date firmă (de pe cartea de vizită)
- Telefon/WhatsApp: +39 366 548 3387 (Mario)
- Email: auto.zm@yahoo.com • Adresă: Via Castelleone, 130R - 26100 Cremona
- P.IVA 01854340195 · Codice SDI: USAL8PV
- Temă culori: albastru `#0f6cb2` + gri `#8d939c` (după logo) • Logo: `assets/img/logo.svg`

## Personalizări rapide
- Culori: `css/style.css` → variabilele `:root` (--navy, --brand, --silver...).

## Publicare gratuită
Poți urca tot folderul pe Netlify Drop / Vercel / GitHub Pages — merge direct, fără build.
