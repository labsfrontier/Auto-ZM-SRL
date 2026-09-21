/* Logica pagine pubbliche Auto ZM — dati da Store (stock condiviso online) */
function cardHTML(c){
  const s = statusLabel(c.status);
  const img = (c.imagini && c.imagini[0]) || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop";
  return `
  <article class="card">
    <div class="card-img">
      <img src="${img}" alt="${c.marca} ${c.model}" loading="lazy">
      <span class="badge ${s.c}">${s.t}</span>
      <span class="price-tag">${formatPrice(c.pret)}</span>
    </div>
    <div class="card-body">
      <h3>${c.marca} ${c.model}</h3>
      <div class="specs">
        <span>📅 ${c.an}</span><span>🛣 ${formatKm(c.km)}</span>
        <span>⛽ ${c.carburant||"-"}</span><span>⚙️ ${c.cutie||"-"}</span>
        <span>🔋 ${c.putere||"-"}</span>
      </div>
      <p style="color:#6b7689;font-size:.9rem">${(c.descriere||"").slice(0,110)}...</p>
      <div class="card-actions">
        <a class="btn btn-dark" href="detalii.html?id=${encodeURIComponent(c.id)}">Dettagli</a>
        <a class="btn btn-light" href="tel:+393665483387">📞 Chiama</a>
      </div>
    </div>
  </article>`;
}

// HEADER mobile
document.addEventListener("click", e=>{
  if(e.target.closest(".burger")){
    document.querySelector("nav.links")?.classList.toggle("open");
  }
});

// HOME: in evidenza
function renderFeatured(){
  const el = document.getElementById("featured");
  if(!el) return;
  const cars = Store.getCars().filter(c=>c.status!=="vandut").slice(0,6);
  el.innerHTML = cars.map(cardHTML).join("");
  const n = document.getElementById("stat-stoc");
  if(n) n.textContent = Store.getCars().filter(c=>c.status==="disponibil").length + "+";
}

// Ricerca rapida hero -> stoc.html con parametri
function initQuickSearch(){
  const f = document.getElementById("quick-search");
  if(!f) return;
  f.addEventListener("submit", e=>{
    e.preventDefault();
    const q = new URLSearchParams({
      marca: document.getElementById("qs-marca").value,
      buget: document.getElementById("qs-buget").value,
      carburant: document.getElementById("qs-carb").value
    }).toString();
    location.href = "stoc.html?" + q;
  });
}

// STOCK: filtri + ordinamento + ricerca
function initStock(){
  const grid = document.getElementById("stoc-grid");
  if(!grid) return;
  const params = new URLSearchParams(location.search);
  const fMarca = document.getElementById("f-marca");
  const fCarb = document.getElementById("f-carb");
  const fCutie = document.getElementById("f-cutie");
  const fBuget = document.getElementById("f-buget");
  const fAn = document.getElementById("f-an");
  const fSearch = document.getElementById("f-search");
  const fSort = document.getElementById("f-sort");
  const fStatus = document.getElementById("f-status");

  const all = Store.getCars();
  // popola marche
  const marci = [...new Set(all.map(c=>c.marca))].sort();
  marci.forEach(m=>{
    const o=document.createElement("option");o.value=m;o.textContent=m;fMarca.appendChild(o);
  });
  if(params.get("marca")) fMarca.value = params.get("marca");
  if(params.get("carburant")) fCarb.value = params.get("carburant");
  if(params.get("buget")) fBuget.value = params.get("buget");

  function apply(){
    let list = [...all];
    const q = (fSearch.value||"").toLowerCase();
    if(fMarca.value) list = list.filter(c=>c.marca===fMarca.value);
    if(fCarb.value) list = list.filter(c=>c.carburant===fCarb.value);
    if(fCutie.value) list = list.filter(c=>c.cutie===fCutie.value);
    if(fStatus.value) list = list.filter(c=>c.status===fStatus.value);
    if(fBuget.value){
      const max = Number(fBuget.value);
      list = list.filter(c=>Number(c.pret)<=max);
    }
    if(fAn.value){
      const minAn = Number(fAn.value);
      list = list.filter(c=>Number(c.an)>=minAn);
    }
    if(q) list = list.filter(c=>(c.marca+" "+c.model+" "+c.descriere).toLowerCase().includes(q));
    if(fSort.value==="pret-asc") list.sort((a,b)=>a.pret-b.pret);
    if(fSort.value==="pret-desc") list.sort((a,b)=>b.pret-a.pret);
    if(fSort.value==="an-desc") list.sort((a,b)=>b.an-a.an);
    if(fSort.value==="km-asc") list.sort((a,b)=>a.km-b.km);

    document.getElementById("stoc-count").textContent = list.length + (list.length===1?" auto":" auto");
    grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<p style="color:#6b7689">Nessuna auto trovata con questi filtri. Chiamaci al <b>+39 366 548 3387</b> — procuriamo su ordinazione.</p>`;
  }
  ["change","input"].forEach(ev=>{
    [fMarca,fCarb,fCutie,fBuget,fAn,fSearch,fSort,fStatus].forEach(el=>el.addEventListener(ev,apply));
  });
  document.getElementById("f-reset")?.addEventListener("click", ()=>{
    [fMarca,fCarb,fCutie,fBuget,fAn,fStatus,fSort].forEach(el=>el.value="");fSearch.value="";apply();
  });
  apply();
}

// DETTAGLI
function initDetails(){
  const wrap = document.getElementById("detalii-wrap");
  if(!wrap) return;
  const id = new URLSearchParams(location.search).get("id");
  const cars = Store.getCars();
  const c = cars.find(x=>String(x.id)===String(id)) || cars[0];
  if(!c){ wrap.innerHTML="<p>Auto non trovata.</p>"; return; }
  document.title = `${c.marca} ${c.model} ${c.an} | Auto ZM`;
  const s = statusLabel(c.status);
  const imgs = (c.imagini&&c.imagini.length?c.imagini:["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop"]);
  wrap.innerHTML = `
  <div class="detail-layout">
    <div>
      <div class="gallery">
        <img class="main" id="gal-main" src="${imgs[0]}" alt="${c.marca} ${c.model}">
        <div class="thumbs">${imgs.map((u,i)=>`<img src="${u}" class="${i===0?'active':''}" data-i="${i}">`).join("")}</div>
      </div>
      <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:1.3rem;margin-top:1rem;box-shadow:var(--shadow)">
        <h3>Descrizione</h3>
        <p style="margin-top:.6rem;color:#33415c;white-space:pre-line">${c.descriere||"Nessuna descrizione."}</p>
        <h3 style="margin-top:1rem">Optional</h3>
        <div class="dotari">${(c.dotari||[]).map(d=>`<span>✓ ${d}</span>`).join("")||"<span>—</span>"}</div>
      </div>
    </div>
    <div>
      <div class="price-box">
        <span class="badge ${s.c}">${s.t}</span>
        <h2 style="margin:.6rem 0">${c.marca} ${c.model}</h2>
        <div class="price">${formatPrice(c.pret)}</div>
        <div style="color:#cbd5e1;font-size:.92rem">Nessun pagamento online — si paga in sede, con contratto e fattura.</div>
      </div>
      <table class="spec-table" style="margin-top:1rem">
        <tr><td>Anno</td><td><b>${c.an}</b></td></tr>
        <tr><td>Chilometri</td><td><b>${formatKm(c.km)}</b></td></tr>
        <tr><td>Alimentazione</td><td><b>${c.carburant||"-"}</b></td></tr>
        <tr><td>Cambio</td><td><b>${c.cutie||"-"}</b></td></tr>
        <tr><td>Potenza</td><td><b>${c.putere||"-"}</b></td></tr>
        <tr><td>Colore</td><td><b>${c.culoare||"-"}</b></td></tr>
        <tr><td>Trazione</td><td><b>${c.tractiune||"-"}</b></td></tr>
        <tr><td>Posti</td><td><b>${c.locuri||5}</b></td></tr>
      </table>
      <div class="contact-box">
        <h4>Ti interessa quest'auto?</h4>
        <p style="color:#6b7689;font-size:.92rem">Chiamaci o scrivici su WhatsApp per un test drive e maggiori dettagli.</p>
        <div style="display:flex;gap:.6rem;margin-top:.8rem;flex-wrap:wrap">
          <a class="btn btn-dark" href="tel:+393665483387">📞 +39 366 548 3387</a>
          <a class="btn btn-whatsapp" href="https://wa.me/393665483387?text=${encodeURIComponent('Buongiorno! Mi interessa '+c.marca+' '+c.model+' '+c.an+' ('+formatPrice(c.pret)+')')}" target="_blank">WhatsApp</a>
        </div>
        <div style="display:flex;gap:.6rem;margin-top:.6rem;flex-wrap:wrap">
          <a class="btn btn-light" style="flex:1" href="contact.html">Richiedi offerta / prenota</a>
          <button class="btn btn-light" style="flex:1" id="btn-share" type="button">🔗 Copia link annuncio</button>
        </div>
      </div>
    </div>
  </div>
  <h3 style="margin:2rem 0 1rem">Auto simili</h3>
  <div class="grid-cars" id="similare"></div>`;

  document.querySelectorAll(".thumbs img").forEach(t=>{
    t.addEventListener("click", ()=>{
      document.querySelectorAll(".thumbs img").forEach(x=>x.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("gal-main").src = t.src;
    });
  });
  document.getElementById("btn-share")?.addEventListener("click", async ()=>{
    const url = location.href;
    try{ await navigator.clipboard.writeText(url); document.getElementById("btn-share").textContent = "✅ Link copiato!"; }
    catch(e){ prompt("Copia il link:", url); }
  });
  const sim = cars.filter(x=>x.id!==c.id && (x.marca===c.marca || x.carburant===c.carburant)).slice(0,3);
  document.getElementById("similare").innerHTML = (sim.length?sim:cars.filter(x=>x.id!==c.id).slice(0,3)).map(cardHTML).join("");
}

// Modulo contatti (demo, senza backend)
function initContact(){
  const f = document.getElementById("contact-form");
  if(!f) return;
  f.addEventListener("submit", e=>{
    e.preventDefault();
    document.getElementById("contact-ok").style.display="block";
    f.reset();
  });
}

// Avvio: prima lo stock condiviso, poi il rendering
Store.init().catch(()=>{}).finally(()=>{
  renderFeatured(); initQuickSearch(); initStock(); initDetails(); initContact();
});
