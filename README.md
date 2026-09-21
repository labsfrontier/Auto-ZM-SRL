# Auto ZM SRL — Site parc auto (fără plăți online)

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
