/* Admin Auto ZM — login + CRUD + pubblicazione online (GitHub) */
const AUTH_KEY = "autoZM_auth_v1";
const CARS_KEY = "autoZM_cars_v2";
const PUBLIC_BASE = "https://labsfrontier.github.io/Auto-ZM-SRL"; // cambia qui quando aggiungi il dominio proprio
function getAuth(){
  try{ return JSON.parse(localStorage.getItem(AUTH_KEY)) || {user:"admin", pass:"autozm123"}; }
  catch(e){ return {user:"admin", pass:"autozm123"}; }
}
function isLogged(){ return sessionStorage.getItem("autoZM_session")==="1"; }

const $ = id => document.getElementById(id);
let uploadedImages = [];
let editingId = null;

function show(view){
  $("login-view").style.display = view==="login" ? "block" : "none";
  $("dash-view").style.display = view==="dash" ? "block" : "none";
}
function msg(t, ok=true){
  $("msg").innerHTML = `<div class="alert ${ok?'success':''}">${t}</div>`;
  setTimeout(()=>$("msg").innerHTML="", 6000);
}

// LOGIN
$("login-form").addEventListener("submit", e=>{
  e.preventDefault();
  const a = getAuth();
  if($("l-user").value.trim()===a.user && $("l-pass").value===a.pass){
    sessionStorage.setItem("autoZM_session","1");
    boot();
  } else $("login-err").style.display="block";
});
$("btn-logout").onclick = ()=>{ sessionStorage.removeItem("autoZM_session"); show("login"); };
$("btn-pass").onclick = ()=>{ goTab("backup"); window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>$("s-pass")?.focus(),150); };

// COPIA LINK ANNUNCIO PUBBLICO (da condividere / promuovere ai clienti)
function publicLink(id){ return PUBLIC_BASE + "/detalii.html?id=" + encodeURIComponent(id); }
window.copyLink = id=>{
  const url = publicLink(id);
  const done = ()=>msg("✅ Link pubblico copiato, pronto da condividere:<br><small>"+url+"</small>");
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(()=>fallbackCopy(url, done));
  } else fallbackCopy(url, done);
};
function fallbackCopy(text, done){
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); done(); }catch(e){ prompt("Copia il link:", text); }
  document.body.removeChild(ta);
};

// TABS
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click", ()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  ["lista","adauga","backup"].forEach(k=>$("tab-"+k).style.display = k===t.dataset.tab?"block":"none");
}));
function goTab(name){ document.querySelector(`.tab[data-tab="${name}"]`).click(); }

// LISTA
function renderList(){
  const cars = Store.getCars();
  const q = ($("a-search").value||"").toLowerCase();
  const f = $("a-filter").value;
  let list = cars.filter(c=>(!f||c.status===f) && (!q || (c.marca+" "+c.model).toLowerCase().includes(q)));
  $("a-tbody").innerHTML = list.map(c=>`
    <tr>
      <td><img src="${(c.imagini&&c.imagini[0])||''}" onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop'"></td>
      <td><b>${c.marca} ${c.model}</b><br><small style="color:#6b7689">${c.an} • ${c.carburant} • ${c.cutie}</small></td>
      <td><b>${formatPrice(c.pret)}</b></td>
      <td>${formatKm(c.km)}</td>
      <td>${statusLabel(c.status).t}</td>
      <td><div class="row-actions">
        <button class="btn btn-light btn-sm" onclick="copyLink('${c.id}')">🔗 Link</button>
        <button class="btn btn-edit btn-sm" onclick="editCar('${c.id}')">Modifica</button>
        <button class="btn btn-danger btn-sm" onclick="delCar('${c.id}')">Elimina</button>
      </div></td>
    </tr>`).join("") || `<tr><td colspan="6">Nessuna auto. Premi „Nuova auto".</td></tr>`;

  const disp = cars.filter(c=>c.status==="disponibil").length;
  const mode = Store.isOnline() ? "🌐 Online — le modifiche vanno a tutti" : "💻 Locale — collega GitHub per pubblicare";
  $("stats-bar").innerHTML = `<span><b>${mode}</b></span><span>📦 Totale: <b>${cars.length}</b></span><span>✅ Disponibili: <b>${disp}</b></span><span>💰 Valore stock: <b>${formatPrice(cars.reduce((s,c)=>s+Number(c.pret||0),0))}</b></span>`;
}
$("a-search").addEventListener("input", renderList);
$("a-filter").addEventListener("change", renderList);

/* Salva in locale + pubblica online se collegato */
async function afterLocalChange(cars, label){
  saveCars(cars);
  renderList();
  if(Store.isOnline()){
    msg("⏳ " + label + " — pubblicazione online in corso...");
    try{
      await Store.publish(cars);
      renderList();
      msg("✅ " + label + " — <b>pubblicato online!</b> Visibile a tutti tra ~1 minuto (ricarica il sito).");
    }catch(e){
      msg("⚠️ Salvato in locale, pubblicazione fallita: " + e.message, false);
    }
  } else {
    msg("✅ " + label + " — salvato in <b>locale</b> (solo questo browser). Collega GitHub in Backup per pubblicare a tutti.");
  }
}

window.delCar = id=>{
  if(!confirm("Eliminare sicura questa auto?")) return;
  afterLocalChange(Store.getCars().filter(c=>String(c.id)!==String(id)), "Auto eliminata.");
};
window.editCar = id=>{
  const c = Store.getCars().find(x=>String(x.id)===String(id));
  if(!c) return;
  editingId = id; uploadedImages = [...(c.imagini||[])];
  $("c-id").value=id; $("c-marca").value=c.marca; $("c-model").value=c.model;
  $("c-an").value=c.an; $("c-pret").value=c.pret; $("c-km").value=c.km;
  $("c-carburant").value=c.carburant; $("c-cutie").value=c.cutie;
  $("c-putere").value=c.putere||""; $("c-culoare").value=c.culoare||"";
  $("c-tractiune").value=c.tractiune||"Anteriore"; $("c-locuri").value=c.locuri||5;
  $("c-status").value=c.status; $("c-descriere").value=c.descriere||"";
  $("c-dotari").value=(c.dotari||[]).join(", ");
  $("c-imagini-url").value=(c.imagini||[]).filter(u=>typeof u==="string" && u.startsWith("http")).join("\n");
  renderPreview();
  $("form-title").textContent = "✏️ Modifica: " + c.marca + " " + c.model;
  goTab("adauga"); window.scrollTo({top:0,behavior:"smooth"});
};
$("btn-new").onclick = ()=>{ editingId=null; uploadedImages=[]; $("car-form").reset(); $("img-preview").innerHTML=""; $("form-title").textContent="➕ Aggiungi nuova auto"; goTab("adauga"); };
$("btn-cancel").onclick = ()=>{ editingId=null; $("car-form").reset(); goTab("lista"); };

// Upload immagini -> base64 (in pubblicazione vanno nel repo come file)
$("c-files").addEventListener("change", e=>{
  [...e.target.files].forEach(f=>{
    const r = new FileReader();
    r.onload = ()=>{ uploadedImages.push(r.result); renderPreview(); };
    r.readAsDataURL(f);
  });
});
function renderPreview(){
  const urls = $("c-imagini-url").value.split("\n").map(s=>s.trim()).filter(Boolean);
  const all = [...urls, ...uploadedImages.filter(u=>u.startsWith("data:"))];
  $("img-preview").innerHTML = all.map(u=>`<img src="${u}">`).join("");
}
$("c-imagini-url").addEventListener("input", renderPreview);

// SAVE
$("car-form").addEventListener("submit", e=>{
  e.preventDefault();
  const urls = $("c-imagini-url").value.split("\n").map(s=>s.trim()).filter(Boolean);
  const dataUrls = uploadedImages.filter(u=>u.startsWith("data:"));
  const imagini = [...urls, ...dataUrls];
  const obj = {
    id: editingId || ("car-"+Date.now()),
    marca: $("c-marca").value.trim(), model: $("c-model").value.trim(),
    an: Number($("c-an").value), pret: Number($("c-pret").value), km: Number($("c-km").value),
    carburant: $("c-carburant").value, cutie: $("c-cutie").value,
    putere: $("c-putere").value.trim(), culoare: $("c-culoare").value.trim(),
    tractiune: $("c-tractiune").value, locuri: Number($("c-locuri").value)||5,
    status: $("c-status").value,
    descriere: $("c-descriere").value.trim(),
    dotari: $("c-dotari").value.split(",").map(s=>s.trim()).filter(Boolean),
    imagini: imagini.length?imagini:["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop"]
  };
  if(!obj.marca || !obj.model || !obj.an || !obj.pret){ msg("⚠️ Compila Marca, Modello, Anno e Prezzo.", false); return; }
  let cars = Store.getCars();
  if(editingId) cars = cars.map(c=>String(c.id)===String(editingId)?obj:c);
  else cars.unshift(obj);
  editingId=null; uploadedImages=[]; $("car-form").reset(); $("img-preview").innerHTML="";
  $("form-title").textContent="➕ Aggiungi nuova auto";
  goTab("lista");
  afterLocalChange(cars, "Auto salvata.");
});

// BACKUP
$("btn-export").onclick = ()=>{
  const blob = new Blob([localStorage.getItem(CARS_KEY)||"[]"],{type:"application/json"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="autozm-stock-backup.json"; a.click();
};
$("import-file").addEventListener("change", e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ try{ const arr=JSON.parse(r.result); if(!Array.isArray(arr)) throw 0; afterLocalChange(arr, "Backup importato ("+arr.length+" auto)."); }catch{ msg("❌ File non valido.", false);} };
  r.readAsText(f);
});
$("btn-reset").onclick = ()=>{ if(confirm("Ripristinare i dati demo? Le modifiche andranno perse.")){ afterLocalChange([...DEFAULT_CARS], "Dati demo ripristinati."); } };
$("btn-save-pass").onclick = ()=>{
  const u=$("s-user").value.trim(), p=$("s-pass").value.trim();
  if(u.length<3||p.length<6){ msg("⚠️ Utente minimo 3, password minimo 6 caratteri.", false); return; }
  localStorage.setItem(AUTH_KEY, JSON.stringify({user:u,pass:p}));
  msg("✅ Dati di accesso aggiornati.");
};

// GITHUB: collegamento pubblicazione online
function ghStatus(){
  const el = $("gh-status");
  if(!el) return;
  if(Store.isOnline()){
    el.className = "alert success";
    el.innerHTML = "🌐 <b>Collegato a GitHub</b> — ogni salvataggio viene pubblicato online e diventa visibile a tutti i clienti.";
  } else {
    el.className = "alert";
    el.innerHTML = "💻 <b>Modalità locale</b> — le modifiche restano in questo browser. Incolla un token per pubblicare online.";
  }
}
$("btn-gh-save").onclick = async ()=>{
  const t = $("gh-token").value.trim();
  if(!t){ msg("⚠️ Incolla prima il token GitHub.", false); return; }
  Store.setToken(t);
  msg("⏳ Verifica token...");
  try{
    await Store.testToken();
    await Store.pull();
    renderList(); ghStatus();
    msg("✅ <b>Collegato!</b> Stock sincronizzato dal repo. Ora ogni salvataggio va online.");
  }catch(e){ Store.clearToken(); ghStatus(); msg("❌ " + e.message, false); }
};
$("btn-gh-clear").onclick = ()=>{ Store.clearToken(); $("gh-token").value=""; ghStatus(); renderList(); msg("🔌 Disconnesso — ora lavori in locale."); };
$("btn-sync").onclick = async ()=>{
  if(!Store.isOnline()){ msg("⚠️ Collega prima GitHub (token).", false); return; }
  msg("⏳ Sincronizzazione dallo stock online...");
  try{ await Store.pull(); renderList(); msg("✅ Stock aggiornato dalla versione online."); }
  catch(e){ msg("❌ Sincronizzazione fallita: " + e.message, false); }
};

async function boot(){
  show("dash");
  const a = getAuth(); $("s-user").value=a.user;
  const t = Store.getToken(); if(t) $("gh-token").value = t;
  ghStatus();
  msg("⏳ Caricamento stock...");
  await Store.init().catch(()=>{});
  renderList();
  $("msg").innerHTML = "";
}
if(isLogged()) boot(); else show("login");
