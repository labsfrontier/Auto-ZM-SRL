# Auto ZM SRL — Site parc auto (fără plăți online)

## 🌍 LIVE (permanent, online 24/7)
- Site: **https://labsfrontier.github.io/Auto-ZM-SRL/**
- Admin: **https://labsfrontier.github.io/Auto-ZM-SRL/admin/** (admin / autozm123)
- Repo: https://github.com/labsfrontier/Auto-ZM-SRL (branch `main` → deploy automat la fiecare `git push`)

### Domeniu propriu (când îl cumperi, ex: autozm.it)
1. La registrar setezi DNS: record CNAME `www` → `labsfrontier.github.io` (+ 4 record A apex către 185.199.108.153 / .109.153 / .110.153 / .111.153)
2. În repo: Settings → Pages → Custom domain → scrii `www.autozm.it` → Save (GitHub emite certificat HTTPS automat)
3. Bifezi „Enforce HTTPS". Gata — fără alte modificări în cod.

### Cum funcționează stocarea partajată: Neon Postgres (branch production, Frankfurt)
Sursa unică de adevăr este **tabelul `cars`** din Neon (migrații în `neon/migrations/`):
- **Site public** (toți vizitatorii): citește din Neon Data API cu JWT anonim automat, fără login. Fără rețea → fallback `data/stock.json` / demo.
- **Admin**: login Neon (email `auto.zm@yahoo.com` + parola stabilită la setup) din tab Backup → scrieri (adaugă/editează/șterge/import) direct în Neon, **vizibile tuturor instant** (fără rebuild).
- RLS: citire publică pentru rolurile `anonymous`+`authenticated`, scriere doar pentru contul admin (policy pe user-id).
- Pozele încărcate de pe PC sunt optimizate automat în browser (max 1280px JPEG) și stocate în Neon.
- Credențiale: `NEON_API_KEY`/chei în CLI local + `.env.local` (ignorat de git). **Dacă stringul de conectare a ajuns în chat, rotește parola din Neon Console (Branches → production → Reset password).**

### Conectarea Neon în panou
 Nimic de configurat în cod: în panou, tab **Backup & Impostazioni → secțiunea Neon**, introdu **parola Neon** → **Connetti a Neon**. Sesiunea ține ~15 min (JWT în sessionStorage); la expirare te reconectezi. Butonul **🔗 Link** copiază linkul public al anunțului (`.../detalii.html?id=...`), gata de distribuit.

### Important: datele adminului
Stocul mașinilor se salvează în browser (localStorage) **separat pe fiecare adresă**. Lucrează pe URL-ul LIVE pentru anunțuri reale; ce e pe localhost rămâne local. Folosește Export/Import JSON pentru mutări.

Site profesional, static (HTML + CSS + JS), fără server propriu.
Datele mașinilor: **`data/stock.json`** în repo (partajat, permanent, vizibil tuturor) + oglindă locală în browser.

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
- Adresă: `admin/index.html` (live: .../admin/)
- Login: utilizator `admin` / parolă `autozm123` (o schimbi din tab-ul Backup & Impostazioni, secțiunea password, sau butonul 🔑 Password de sus)
- Poți: **adăuga / edita / șterge mașini**, scrie **descrieri lungi**, dotări, preț, km, status (Disponibile/Riservata/Venduta), poze prin link SAU încărcare de pe calculator (ajung fișiere în `assets/img/stock/` la publicare).
- Buton **🔗 Link** la fiecare mașină → copiază linkul public al anunțului pentru distribuire/promovare (+ buton de share și pe pagina publică Detalii).
- Tot ce salvezi (cu GitHub conectat) se publică automat și apare tuturor pe site în ~1 min (Home + Stock + Dettagli).
- Backup: Export / Import JSON + Reset demo + Sincronizare din stock-ul online.

## Poze (deja instalate în `assets/img/`)
- `footer-birou.jpg` → biroul (fundal footer) • `panorama-cover.jpg` / `panorama-sede.jpg` → bannere panoramice
- `parc-1/2/3.jpg`, `parc-cover.jpg` → parc • `logo.svg` → logo • `assets/img/stock/` → pozele încărcate din panou (create automat la publicare)

## Date firmă (de pe cartea de vizită)
- Telefon/WhatsApp: +39 366 548 3387 (Mario)
- Email: auto.zm@yahoo.com • Adresă: Via Castelleone, 130R - 26100 Cremona
- P.IVA 01854340195 · Codice SDI: USAL8PV
- Temă culori: albastru `#0f6cb2` + gri `#8d939c` (după logo) • Logo: `assets/img/logo.svg`

## Personalizări rapide
- Culori: `css/style.css` → variabilele `:root` (--navy, --brand, --silver...).

## Publicare
Live pe GitHub Pages din branch `main` — fiecare `git push` republică automat. Fără build.
