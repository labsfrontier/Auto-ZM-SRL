/* Store Auto ZM — Neon Postgres (Data API) + fallback locale/offline.
   - Letture pubbliche: JWT anonimo automatico, nessun login.
   - Scritture admin: login Neon (email+password) -> JWT in sessione.
   - Senza rete: fallback a localStorage + demo. */
const NEON_DATA_API = "https://ep-cold-wind-b18onpdg.apirest.c-5.eu-central-1.aws.neon.tech/neondb/rest/v1";
const NEON_AUTH_URL = "https://ep-cold-wind-b18onpdg.neonauth.c-5.eu-central-1.aws.neon.tech/neondb/auth";
const NEON_ADMIN_EMAIL = "auto.zm@yahoo.com";
const NEON_JWT_KEY = "autoZM_neon_jwt";

const Store = {
  remote: null,
  remoteOk: false,
  _anon: null,
  _anonExp: 0,

  /* ---------- lettura pubblica (anonima) ---------- */
  async anonToken(){
    if(this._anon && this._anonExp > Date.now() + 60000) return this._anon;
    const r = await fetch(NEON_AUTH_URL + "/token/anonymous", {headers: {Origin: location.origin}});
    if(!r.ok) throw new Error("anon token " + r.status);
    const j = await r.json();
    this._anon = j.token;
    try{ this._anonExp = JSON.parse(atob(j.token.split(".")[1])).exp * 1000; }
    catch(e){ this._anonExp = Date.now() + 10 * 60 * 1000; }
    return this._anon;
  },

  async neonRead(){
    const t = await this.anonToken();
    const r = await fetch(NEON_DATA_API + "/cars?select=*&order=updated_at.desc", {
      headers: {Authorization: "Bearer " + t}, cache: "no-store"
    });
    if(!r.ok) throw new Error("read " + r.status);
    return r.json();
  },

  async init(){
    try{
      const arr = await this.neonRead();
      if(!Array.isArray(arr)) throw 0;
      this.remote = arr; this.remoteOk = true;
      try{ saveCars(arr); }catch(e){}
    }catch(e){ this.remote = null; this.remoteOk = false; }
  },

  getCars(){
    if(this.remote) return JSON.parse(JSON.stringify(this.remote));
    return loadCars();
  },

  async pull(){ await this.init(); return this.remote; },

  /* ---------- auth admin Neon ---------- */
  getJwt(){ try{ return sessionStorage.getItem(NEON_JWT_KEY) || ""; }catch(e){ return ""; } },
  setJwt(t){ try{ if(t) sessionStorage.setItem(NEON_JWT_KEY, t); else sessionStorage.removeItem(NEON_JWT_KEY); }catch(e){} },
  isOnline(){ return !!this.getJwt(); },

  async adminLogin(password){
    const r = await fetch(NEON_AUTH_URL + "/sign-in/email", {
      method: "POST",
      headers: {"Content-Type": "application/json", Origin: location.origin},
      credentials: "include",
      body: JSON.stringify({email: NEON_ADMIN_EMAIL, password})
    });
    if(!r.ok) throw new Error("Login fallito (" + r.status + "): controlla la password.");
    const s = await fetch(NEON_AUTH_URL + "/get-session", {
      headers: {Origin: location.origin}, credentials: "include"
    });
    const jwt = s.headers.get("set-auth-jwt");
    if(!jwt) throw new Error("Sessione creata ma JWT non leggibile — ricarica e riprova.");
    this.setJwt(jwt);
    return true;
  },

  adminLogout(){ this.setJwt(""); },

  async neonWrite(method, path, body){
    const run = (token)=>fetch(NEON_DATA_API + path, {
      method,
      headers: {"Authorization": "Bearer " + token, "Content-Type": "application/json", "Prefer": "return=representation"},
      body: body ? JSON.stringify(body) : undefined
    });
    let r = await run(this.getJwt());
    if(r.status === 401){ this.setJwt(""); throw new Error("UNAUTHORIZED"); }
    if(!r.ok) throw new Error("Neon " + r.status + ": " + (await r.text()).slice(0, 160));
    const txt = await r.text();
    return txt ? JSON.parse(txt) : [];
  },

  toRow(c){
    return {
      id: String(c.id), marca: c.marca || "", model: c.model || "",
      an: Number(c.an) || new Date().getFullYear(), pret: Number(c.pret) || 0, km: Number(c.km) || 0,
      carburant: c.carburant || "", cutie: c.cutie || "", putere: c.putere || "",
      culoare: c.culoare || "", tractiune: c.tractiune || "", locuri: Number(c.locuri) || 5,
      status: c.status || "disponibil", descriere: c.descriere || "",
      dotari: c.dotari || [], imagini: c.imagini || []
    };
  },

  async upsertCar(c){
    const patched = await this.neonWrite("PATCH", "/cars?id=eq." + encodeURIComponent(c.id), this.toRow(c));
    if(Array.isArray(patched) && patched.length) return patched[0];
    const ins = await this.neonWrite("POST", "/cars", this.toRow(c));
    return ins[0];
  },

  async deleteCar(id){
    await this.neonWrite("DELETE", "/cars?id=eq." + encodeURIComponent(id));
  },

  async replaceAll(cars){
    const cur = await this.neonRead();
    for(const c of cur){ await this.neonWrite("DELETE", "/cars?id=eq." + encodeURIComponent(c.id)); }
    if(cars.length) await this.neonWrite("POST", "/cars", cars.map(c=>this.toRow(c)));
    try{
      this.remote = await this.neonRead();
      this.remoteOk = true;
      saveCars(this.remote);
    }catch(e){}
  },

  /* ---------- foto: ottimizza nel browser (max 1280px JPEG) ---------- */
  optimizeImage(file){
    return new Promise((res, rej)=>{
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = ()=>{
        URL.revokeObjectURL(url);
        try{
          const max = 1280;
          const sc = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.width * sc));
          cv.height = Math.max(1, Math.round(img.height * sc));
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          res(cv.toDataURL("image/jpeg", 0.82));
        }catch(e){ rej(e); }
      };
      img.onerror = rej;
      img.src = url;
    });
  }
};
