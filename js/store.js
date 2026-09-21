/* Store Auto ZM — stock condiviso via repo GitHub (data/stock.json) + fallback locale.
   - Sito pubblico: legge SEMPRE prima data/stock.json (fresco, no-cache) -> visibile a tutti.
   - Admin: salva in locale + se c'è il token GitHub, pubblica (commit) nel repo.
   - Senza rete/file:// : fallback a localStorage + demo. */
const GH_REPO = "labsfrontier/Auto-ZM-SRL";
const GH_BRANCH = "main";
const GH_TOKEN_KEY = "autoZM_gh_token";

const Store = {
  remote: null,
  remoteOk: false,

  async init(){
    try{
      const r = await fetch("data/stock.json?v=" + Date.now(), {cache:"no-store"});
      if(!r.ok) throw 0;
      const arr = await r.json();
      if(!Array.isArray(arr)) throw 0;
      this.remote = arr; this.remoteOk = true;
    }catch(e){ this.remote = null; this.remoteOk = false; }
  },

  getCars(){
    if(this.remote) return JSON.parse(JSON.stringify(this.remote));
    return loadCars();
  },

  getToken(){ return (localStorage.getItem(GH_TOKEN_KEY)||"").trim(); },
  setToken(t){ localStorage.setItem(GH_TOKEN_KEY, (t||"").trim()); },
  clearToken(){ localStorage.removeItem(GH_TOKEN_KEY); },
  isOnline(){ return !!this.getToken(); },

  async pull(){
    await this.init();
    if(this.remote) saveCars(this.remote);
    return this.remote;
  },

  ghHeaders(){
    return {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + this.getToken(),
      "X-GitHub-Api-Version": "2022-11-28"
    };
  },

  async testToken(){
    const r = await fetch("https://api.github.com/repos/" + GH_REPO, {headers: this.ghHeaders()});
    if(r.status === 401) throw new Error("Token non valido (401).");
    if(r.status === 403) throw new Error("Permessi insufficienti (403): servono Contents read+write sul repo.");
    if(r.status === 404) throw new Error("Repo non trovato (404).");
    if(!r.ok) throw new Error("Errore GitHub: " + r.status);
    return true;
  },

  b64(str){ return btoa(unescape(encodeURIComponent(str))); },

  async ghPut(path, base64Content, message){
    const api = "https://api.github.com/repos/" + GH_REPO + "/contents/" + path;
    let sha;
    try{
      const g = await fetch(api + "?ref=" + GH_BRANCH, {headers: this.ghHeaders()});
      if(g.ok) sha = (await g.json()).sha;
    }catch(e){}
    const body = {message, content: base64Content, branch: GH_BRANCH};
    if(sha) body.sha = sha;
    const r = await fetch(api, {method:"PUT", headers:this.ghHeaders(), body:JSON.stringify(body)});
    if(!r.ok) throw new Error("GitHub PUT " + r.status + ": " + (await r.text()).slice(0,160));
    return r.json();
  },

  /* Pubblica stock: carica foto nuove nel repo, poi committa data/stock.json */
  async publish(cars){
    const out = JSON.parse(JSON.stringify(cars));
    let n = 0;
    for(const c of out){
      const imgs = [];
      for(const u of (c.imagini||[])){
        if(typeof u === "string" && u.startsWith("data:image/")){
          n++;
          const ext = u.includes("data:image/png") ? "png" : (u.includes("data:image/webp") ? "webp" : "jpg");
          const name = "assets/img/stock/" + c.id + "-" + Date.now() + "-" + n + "." + ext;
          await this.ghPut(name, u.split(",")[1], "Auto ZM: foto " + c.marca + " " + c.model);
          imgs.push(name);
        } else imgs.push(u);
      }
      if(imgs.length) c.imagini = imgs;
    }
    await this.ghPut("data/stock.json", this.b64(JSON.stringify(out, null, 2)), "Auto ZM: aggiorna stock (" + out.length + " auto)");
    this.remote = out; this.remoteOk = true;
    return out;
  }
};
