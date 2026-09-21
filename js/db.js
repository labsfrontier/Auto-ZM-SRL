/* DB Auto ZM — priorità: Firebase (se configurato) > Google Sheet (se ID) > locale.
   - Firebase: lettura pubblica + scrittura admin autenticato, live realtime.
   - Sheet: il FOGLIO è l'admin (lettura pubblica, refresh ogni 5 min).
   - Locale: fallback offline (come prima). */
const DB = (()=>{
  let mode = "local", db = null, auth = null, cache = null;
  const subs = [];
  const SHEET_POLL_MS = 5 * 60 * 1000;

  function loadScript(src){
    return new Promise((res, rej)=>{
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function sheetOn(){
    return (typeof SHEET_ID !== "undefined") && SHEET_ID && SHEET_ID.length > 10;
  }
  function fbOn(){
    return (typeof FIREBASE_CONFIG !== "undefined") && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey;
  }

  /* ---------- Google Sheet ---------- */
  const normH = h => (h||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  function colIndex(cols, names){ for(const n of names){ const i = cols.indexOf(n); if(i>=0) return i; } return -1; }
  function num(v){ const n = String(v==null?"":v).replace(/[^0-9]/g,""); return n===""?0:Number(n); }
  function slug(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60) || ("auto-"+Date.now()); }
  function normStatus(v){
    v = normH(v);
    if(/vend|vandu|sold/.test(v)) return "vandut";
    if(/riserv|rezerv|reserv/.test(v)) return "rezervat";
    return "disponibil";
  }
  function normCarb(v){
    const t = normH(v);
    if(/diesel|motorin|gasolio/.test(t)) return "Diesel";
    if(/ibrid|hibrid|hybrid/.test(t)) return "Ibrida";
    if(/elettric|electric/.test(t)) return "Elettrica";
    if(/gpl/.test(t)) return /benzin/.test(t) ? "Benzina + GPL" : "GPL";
    if(/benzin/.test(t)) return "Benzina";
    return (v||"").trim() || "Benzina";
  }
  function normCutie(v){
    const t = normH(v);
    if(/auto/.test(t)) return "Automatico";
    return "Manuale";
  }
  function splitList(v){ return String(v==null?"":v).split(/[,|\n;]+/).map(s=>s.trim()).filter(Boolean); }

  async function loadSheet(){
    const url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/gviz/tq?tqx=out:json&_=" + Date.now();
    const txt = await (await fetch(url)).text();
    const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
    const cols = (json.table.cols || []).map(c=>normH(c.label));
    const gi = (...names)=>colIndex(cols, names);
    const iId = gi("id"), iMarca = gi("marca"), iModel = gi("modello","model"),
      iAn = gi("anno","an"), iPret = gi("prezzo","pret"), iKm = gi("km","chilometri","kilometri"),
      iCarb = gi("alimentazione","carburant"), iCut = gi("cambio","cutie"),
      iPut = gi("potenza","putere"), iCol = gi("colore","culoare"),
      iTra = gi("trazione","tractiune"), iLoc = gi("posti","locuri"),
      iSta = gi("stato","status"), iDes = gi("descrizione","descriere"),
      iDot = gi("optional","dotari","accessori"), iImg = gi("immagini","imagini","foto");
    const val = (arr,i)=> (i>=0 && arr[i]!=null) ? String(arr[i]) : "";
    const out = [];
    (json.table.rows || []).forEach((r,idx)=>{
      const a = (r.c || []).map(cell => (cell && cell.v != null) ? String(cell.v) : "");
      const marca = val(a,iMarca).trim(), model = val(a,iModel).trim();
      if(!marca || !model) return; // riga vuota
      out.push({
        id: val(a,iId).trim() || slug(marca + " " + model + " " + val(a,iAn)),
        createdAt: Date.now() - idx,
        marca, model,
        an: num(val(a,iAn)) || new Date().getFullYear(),
        pret: num(val(a,iPret)),
        km: num(val(a,iKm)),
        carburant: normCarb(val(a,iCarb)),
        cutie: normCutie(val(a,iCut)),
        putere: val(a,iPut).trim(),
        culoare: val(a,iCol).trim(),
        tractiune: val(a,iTra).trim() || "Anteriore",
        locuri: num(val(a,iLoc)) || 5,
        status: normStatus(val(a,iSta)),
        descriere: val(a,iDes).trim(),
        dotari: splitList(val(a,iDot)),
        imagini: splitList(val(a,iImg)).filter(u=>/^https?:\/\//i.test(u))
      });
    });
    return out;
  }

  function ingest(arr){
    cache = [...arr];
    try{ saveCars(cache); }catch(e){}
    subs.forEach(cb=>{ try{ cb([...arr]); }catch(e){} });
  }

  /* ---------- avvio ---------- */
  const ready = (async ()=>{
    // 1) Firebase
    try{
      if(fbOn()){
        const V = "https://www.gstatic.com/firebasejs/10.12.0/";
        await loadScript(V + "firebase-app-compat.js");
        await loadScript(V + "firebase-database-compat.js");
        await loadScript(V + "firebase-auth-compat.js");
        if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
        auth = firebase.auth();
        mode = "firebase";
      }
    }catch(e){ mode = "local"; }
    cache = loadCars();
    if(mode === "firebase"){
      try{
        const snap = await db.ref("cars").get();
        if(snap.exists()){
          const arr = Object.values(snap.val()).filter(Boolean);
          arr.sort((a,b)=>((b.createdAt||0)-(a.createdAt||0)));
          if(arr.length){ cache = arr; try{ saveCars(cache); }catch(e){} }
        }
      }catch(e){}
    } else if(sheetOn()){
      // 2) Google Sheet
      try{
        const arr = await loadSheet();
        if(arr.length){ mode = "sheet"; cache = arr; try{ saveCars(cache); }catch(e){} }
      }catch(e){}
      if(mode !== "sheet"){ /* sheet non raggiungibile: resta locale */ }
      else {
        setInterval(async ()=>{
          try{
            const arr = await loadSheet();
            if(arr.length && JSON.stringify(arr) !== JSON.stringify(cache)) ingest(arr);
          }catch(e){}
        }, SHEET_POLL_MS);
      }
    }
    return [...cache];
  })();

  async function writeAllFb(cars){
    const map = {};
    cars.forEach(c=>{ map[c.id] = c; });
    await db.ref("cars").set(map);
  }

  return {
    ready,
    isCloud: ()=>mode !== "local",
    isSheet: ()=>mode === "sheet",
    isFirebase: ()=>mode === "firebase",
    getAuth: ()=>auth,
    async getCars(){ const c = await ready; return [...c]; },
    async saveAll(cars){
      cache = [...cars];
      try{ saveCars(cache); }catch(e){}
      if(mode === "firebase") await writeAllFb(cache);
      if(mode === "sheet") throw new Error("sheet-readonly");
    },
    subscribe(cb){
      if(mode === "firebase" && db){
        const ref = db.ref("cars");
        const h = ref.on("value", snap=>{
          if(!snap.exists()) return;
          const arr = Object.values(snap.val()).filter(Boolean);
          arr.sort((a,b)=>((b.createdAt||0)-(a.createdAt||0)));
          ingest(arr);
        });
        return ()=>ref.off("value", h);
      }
      subs.push(cb);
      return ()=>{ const i = subs.indexOf(cb); if(i>=0) subs.splice(i,1); };
    }
  };
})();
