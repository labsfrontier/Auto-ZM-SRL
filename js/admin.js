/* Admin Auto ZM — login + CRUD.
   Con Firebase configurato: login con email/password, salvataggio CONDIVISO
   (visibile a tutti i visitatori in tempo reale). Senza Firebase: solo locale. */
const AUTH_KEY = "autoZM_auth_v1";
function getAuth(){
  try{ return JSON.parse(localStorage.getItem(AUTH_KEY)) || {user:"admin", pass:"autozm123"}; }
  catch(e){ return {user:"admin", pass:"autozm123"}; }
}
function isLogged(){ return sessionStorage.getItem("autoZM_session")==="1"; }
function cloudOn(){ return (typeof FIREBASE_CONFIG !== "undefined") && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && DB.isCloud(); }

const $ = id => document.getElementById(id);
let uploadedImages = [];
let editingId = null;
let CARS = [];
let fbUser = null;

function show(view){
  $("login-view").style.display = view==="login" ? "block" : "none";
  $("dash-view").style.display = view==="dash" ? "block" : "none";
}
function msg(t, ok=true){
  $("msg").innerHTML = `<div class="alert ${ok?'success':''}">${t}</div>`;
  setTimeout(()=>$("msg").innerHTML="", 4000);
}
function syncBadge(){
  return cloudOn()
    ? `<span>☁️ Online — le modifiche sono visibili a tutti</span>`
    : `<span>💾 Solo locale — configura Firebase (vedi README)</span>`;
}

// TABS
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click", ()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  ["lista","adauga","backup"].forEach(k=>$("tab-"+k).style.display = k===t.dataset.tab?"block":"none");
}));
function goTab(name){ document.querySelector(`.tab[data-tab="${name}"]`).click(); }

// LOGIN
$("login-form").addEventListener("submit", async e=>{
  e.preventDefault();
  if(cloudOn()){
    try{
      await DB.getAuth().signInWithEmailAndPassword($("l-user").value.trim(), $("l-pass").value);
    }catch(err){ $("login-err").style.display = "block"; }
    return; // onAuthStateChanged entra in dashboard
  }
  const a = getAuth();
  if($("l-user").value.trim()===a.user && $("l-pass").value===a.pass){
    sessionStorage.setItem("autoZM_session","1");
    enterDash();
  } else $("login-err").style.display = "block";
});
$("btn-logout").onclick = async ()=>{
  sessionStorage.removeItem("autoZM_session");
  if(cloudOn()){ try{ await DB.getAuth().signOut(); }catch(e){} }
  show("login");
};
$("btn-pass").onclick = ()=>{ goTab("backup"); window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>$("s-pass")?.focus(),150); };

// COPIA LINK ANNUNCIO (da condividere / promuovere)
window.copyLink = id=>{
  const url = new URL("../detalii.html?id="+encodeURIComponent(id), location.href).href;
  const done = ()=>msg("✅ Link copiato, pronto da condividere:<br><small>"+url+"</small>");
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(()=>fallbackCopy(url, done));
  } else fallbackCopy(url, done);
};
function fallbackCopy(text, done){
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); done(); }catch(e){ prompt("Copia il link:", text); }
  document.body.removeChild(ta);
}

// LISTA
async function refresh(){
  CARS = await DB.getCars();
  renderList();
}
function renderList(){
  const q = ($("a-search").value||"").toLowerCase();
  const f = $("a-filter").value;
  const list = CARS.filter(c=>(!f||c.status===f) && (!q || (c.marca+" "+c.model).toLowerCase().includes(q)));
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
  const disp = CARS.filter(c=>c.status==="disponibil").length;
  $("stats-bar").innerHTML = syncBadge()+`<span>📦 Totale: <b>${CARS.length}</b></span><span>✅ Disponibili: <b>${disp}</b></span><span>💰 Valore stock: <b>${formatPrice(CARS.reduce((s,c)=>s+Number(c.pret||0),0))}</b></span>`;
}
$("a-search").addEventListener("input", renderList);
$("a-filter").addEventListener("change", renderList);

async function persist(cars){
  try{
    await DB.saveAll(cars);
    CARS = [...cars];
    renderList();
    return true;
  }catch(e){
    msg("⛔ Scrittura rifiutata. Rieffettua il login e riprova.", false);
    return false;
  }
}
window.delCar = async id=>{
  if(!confirm("Eliminare sicura questa auto?")) return;
  if(await persist(CARS.filter(c=>String(c.id)!==String(id)))) msg("🗑 Auto eliminata.");
};
window.editCar = id=>{
  const c = CARS.find(x=>String(x.id)===String(id));
  if(!c) return;
  editingId = id; uploadedImages = [...(c.imagini||[])];
  $("c-id").value = id; $("c-marca").value = c.marca; $("c-model").value = c.model;
  $("c-an").value = c.an; $("c-pret").value = c.pret; $("c-km").value = c.km;
  $("c-carburant").value = c.carburant; $("c-cutie").value = c.cutie;
  $("c-putere").value = c.putere||""; $("c-culoare").value = c.culoare||"";
  $("c-tractiune").value = c.tractiune||"Anteriore"; $("c-locuri").value = c.locuri||5;
  $("c-status").value = c.status; $("c-descriere").value = c.descriere||"";
  $("c-dotari").value = (c.dotari||[]).join(", ");
  $("c-imagini-url").value = (c.imagini||[]).filter(u=>u.startsWith("http")).join("\n");
  renderPreview();
  $("form-title").textContent = "✏️ Modifica: " + c.marca + " " + c.model;
  goTab("adauga"); window.scrollTo({top:0,behavior:"smooth"});
};
$("btn-new").onclick = ()=>{ editingId = null; uploadedImages = []; $("car-form").reset(); $("img-preview").innerHTML = ""; $("form-title").textContent = "➕ Aggiungi nuova auto"; goTab("adauga"); };
$("btn-cancel").onclick = ()=>{ editingId = null; $("car-form").reset(); goTab("lista"); };

// Upload immagini -> base64
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

// SALVA
$("car-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const urls = $("c-imagini-url").value.split("\n").map(s=>s.trim()).filter(Boolean);
  const dataUrls = uploadedImages.filter(u=>u.startsWith("data:"));
  const imagini = [...urls, ...dataUrls];
  const obj = {
    id: editingId || ("car-"+Date.now()),
    createdAt: Date.now(),
    marca: $("c-marca").value.trim(), model: $("c-model").value.trim(),
    an: Number($("c-an").value), pret: Number($("c-pret").value), km: Number($("c-km").value),
    carburant: $("c-carburant").value, cutie: $("c-cutie").value,
    putere: $("c-putere").value.trim(), culoare: $("c-culoare").value.trim(),
    tractiune: $("c-tractiune").value, locuri: Number($("c-locuri").value)||5,
    status: $("c-status").value,
    descriere: $("c-descriere").value.trim(),
    dotari: $("c-dotari").value.split(",").map(s=>s.trim()).filter(Boolean),
    imagini: imagini.length ? imagini : ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop"]
  };
  if(!obj.marca || !obj.model || !obj.an || !obj.pret){ msg("⚠️ Compila Marca, Modello, Anno e Prezzo.", false); return; }
  let cars = [...CARS];
  if(editingId){
    const old = cars.find(c=>String(c.id)===String(editingId));
    if(old && old.createdAt) obj.createdAt = old.createdAt;
    cars = cars.map(c=>String(c.id)===String(editingId)?obj:c);
  } else cars.unshift(obj);
  try{ await DB.saveAll(cars); }
  catch(err){ msg("⚠️ Troppe foto grandi — rimuovi qualche foto caricata e usa i link.", false); return; }
  editingId = null; uploadedImages = []; $("car-form").reset(); $("img-preview").innerHTML = "";
  $("form-title").textContent = "➕ Aggiungi nuova auto";
  CARS = [...cars]; renderList(); goTab("lista");
  msg(cloudOn() ? "✅ Auto salvata e già visibile a tutti sul sito." : "✅ Auto salvata (solo locale).");
});

// BACKUP
$("btn-export").onclick = ()=>{
  const blob = new Blob([JSON.stringify(CARS)],{type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "autozm-stock-backup.json"; a.click();
};
$("import-file").addEventListener("change", e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = async ()=>{
    try{
      const arr = JSON.parse(r.result);
      if(!Array.isArray(arr)) throw 0;
      if(await persist(arr)) msg("✅ Backup importato: " + arr.length + " auto.");
    }catch{ msg("❌ File non valido.", false); }
  };
  r.readAsText(f);
});
$("btn-reset").onclick = async ()=>{
  if(!confirm("Ripristinare i dati demo? Le modifiche andranno perse.")) return;
  if(await persist([...DEFAULT_CARS])) msg("↺ Dati demo ripristinati.");
};
$("btn-save-pass").onclick = async ()=>{
  if(cloudOn() && fbUser){
    const email = $("s-user").value.trim() || fbUser.email;
    try{
      await DB.getAuth().sendPasswordResetEmail(email);
      msg("📧 Email per reimpostare la password inviata a <b>" + email + "</b>. Controlla la casella e segui il link.");
    }catch(e){ msg("❌ " + (e.message || e), false); }
    return;
  }
  const u = $("s-user").value.trim(), p = $("s-pass").value.trim();
  if(u.length < 3 || p.length < 6){ msg("⚠️ Utente minimo 3, password minimo 6 caratteri.", false); return; }
  localStorage.setItem(AUTH_KEY, JSON.stringify({user:u, pass:p}));
  msg("✅ Dati di accesso aggiornati.");
};

// AVVIO
function enterDash(){
  show("dash");
  if(cloudOn() && fbUser){
    $("s-user").value = fbUser.email || "";
    $("s-pass").value = "";
    $("s-pass").disabled = true;
    $("s-pass").placeholder = "reset via email";
    $("btn-save-pass").textContent = "Invia email di reset";
  } else {
    const a = getAuth(); $("s-user").value = a.user;
  }
  refresh();
}
(async function boot(){
  await DB.ready;
  if(cloudOn()){
    // login con email Firebase
    $("l-user").type = "email";
    $("l-user").placeholder = "admin@tuaemail.it";
    document.querySelector('#login-form .field label').textContent = "Email admin";
    document.querySelectorAll("#login-view .alert")[0].innerHTML = "🔐 Accesso protetto con Firebase.<br><small>Usa l'email e la password create nella console Firebase.</small>";
    DB.getAuth().onAuthStateChanged(u=>{
      fbUser = u;
      if(u) enterDash(); else show("login");
    });
  } else {
    if(isLogged()) enterDash(); else show("login");
  }
})();
