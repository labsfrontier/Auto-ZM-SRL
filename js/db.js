/* DB Auto ZM — cloud Firebase Realtime (se configurato), altrimenti locale.
   - Lettura: tutti (sito pubblico, aggiornamenti in tempo reale).
   - Scrittura: solo admin autenticato (regole Firebase) oppure locale. */
const DB = (()=>{
  let useFb = false, db = null, auth = null, cache = null;

  function loadScript(src){
    return new Promise((res, rej)=>{
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const ready = (async ()=>{
    try{
      if(typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey){
        const V = "https://www.gstatic.com/firebasejs/10.12.0/";
        await loadScript(V + "firebase-app-compat.js");
        await loadScript(V + "firebase-database-compat.js");
        await loadScript(V + "firebase-auth-compat.js");
        if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();
        auth = firebase.auth();
        useFb = true;
      }
    }catch(e){ useFb = false; }

    cache = loadCars(); // copia locale (fallback + cache)
    if(useFb){
      try{
        const snap = await db.ref("cars").get();
        if(snap.exists()){
          const arr = Object.values(snap.val()).filter(Boolean);
          arr.sort((a,b)=>((b.createdAt||0)-(a.createdAt||0)));
          if(arr.length){ cache = arr; try{ saveCars(cache); }catch(e){} }
        }
      }catch(e){ /* resta locale */ }
    }
    return [...cache];
  })();

  async function writeAll(cars){
    const map = {};
    cars.forEach(c=>{ map[c.id] = c; });
    await db.ref("cars").set(map);
  }

  return {
    ready,
    isCloud: ()=>useFb,
    getAuth: ()=>auth,
    async getCars(){ const c = await ready; return [...c]; },
    async saveAll(cars){
      cache = [...cars];
      try{ saveCars(cache); }catch(e){}
      if(useFb) await writeAll(cache);
    },
    subscribe(cb){
      if(!useFb) return ()=>{};
      const ref = db.ref("cars");
      const h = ref.on("value", snap=>{
        if(!snap.exists()) return;
        const arr = Object.values(snap.val()).filter(Boolean);
        arr.sort((a,b)=>((b.createdAt||0)-(a.createdAt||0)));
        cache = arr;
        try{ saveCars(cache); }catch(e){}
        cb([...arr]);
      });
      return ()=>ref.off("value", h);
    }
  };
})();
