/* JM BOTS · Resiliencia universal
   Capa 1: rotación de claves Gemini + reintento con espera (ante 429/5xx/red).
   Capa 2: banco OFFLINE combinatorio (millones de combos, sin repetir) si fallan todas las claves.
   Se carga en todas las apps; no toca el motor propio de cada una. */
(function(){
  if(window.__jmResil) return; window.__jmResil=true;
  var _f = window.fetch;
  var $ = function(id){ return document.getElementById(id); };

  /* ---------- claves ---------- */
  function keys(){
    var out=[];
    try{
      var k=JSON.parse(localStorage.getItem('jmbots_keys')||'{}');
      if(Array.isArray(k.ans)) k.ans.forEach(function(x){ if(x) out.push(String(x).trim()); });
      if(k.an) String(k.an).split(/[\s,;\n]+/).forEach(function(x){ x=x.trim(); if(x) out.push(x); });
    }catch(e){}
    var seen={}, uniq=[];
    out.forEach(function(x){ if(x && !seen[x]){ seen[x]=1; uniq.push(x); } });
    return uniq;
  }
  function setKey(url, key){ return url.replace(/([?&]key=)[^&]*/, '$1'+encodeURIComponent(key)); }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  /* ---------- banco offline (piezas genéricas; el sabor lo dan los selectores del nicho) ---------- */
  var POOL = {
    prota: ["una joven decidida","un anciano de mirada serena","un niño curioso","una guerrera marcada por el pasado","un viajero solitario","dos hermanos enfrentados","una madre incansable","un forastero misterioso","un aprendiz ambicioso","una líder reticente","un héroe caído","una científica obstinada","un artista incomprendido","un soldado cansado","una huérfana valiente","un rey sin corona","una sanadora silenciosa","un ladrón con código","una rival inesperada","un mentor de pocas palabras"],
    acomp: ["su fiel acompañante","un aliado improbable","su sombra del pasado","una criatura leal","un viejo amigo","una desconocida clave","su mayor rival","un guía enigmático","un grupo de extraños","su propio reflejo"],
    conf: ["debe elegir entre el deber y el corazón","enfrenta una pérdida que lo cambia todo","persigue una verdad que otros quieren ocultar","intenta reparar un error imperdonable","corre contra el tiempo","se enfrenta a un poder mayor que ella","busca un lugar al que pertenecer","carga con un secreto que pesa","quiere demostrar su valía","debe sobrevivir una noche imposible"],
    giro: ["nada es lo que parecía","el aliado era el verdadero enemigo","el sacrificio cambia el destino","una segunda oportunidad aparece","el final es apenas el comienzo","la victoria tiene un costo amargo","el pasado regresa transformado","la verdad libera y duele","el más débil resulta ser la clave","todo cierra en un círculo perfecto"],
    accEN: ["walks slowly forward","turns to face the camera","reacts in shock","reaches out a hand","looks up to the sky","steps into the light","clenches a fist","whispers something","breaks into a run","stands firm against the wind"]
  };
  function pick(a, r){ return a[Math.floor(r()*a.length)]; }
  function rng(seed){ var s=seed>>>0||1; return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)/4294967296); }; }
  function val(id, d){ var e=$(id); return (e && e.value) ? e.value : d; }
  function offKey(){ return 'jmbots_off_'+((location.pathname.split('/').pop()||'app').replace('.html','')); }
  function usedAdd(sig){ try{ var u=JSON.parse(localStorage.getItem(offKey())||'[]'); u.unshift(sig); localStorage.setItem(offKey(), JSON.stringify(u.slice(0,500))); }catch(e){} }
  function usedHas(sig){ try{ return (JSON.parse(localStorage.getItem(offKey())||'[]')).indexOf(sig)>-1; }catch(e){ return false; } }

  function fence(s){ return "```\n"+s+"\n```"; }
  function buildOffline(){
    var fourLote = !!$("txtGuion");
    var clipsBox = $("clips");
    if(!fourLote && !clipsBox) return null; // no es generador de guion: no inventamos

    var sub=val("subgenero","escena"), esc=val("escenario","un escenario evocador"),
        tono=val("tono","emotivo"), pal=val("paleta","cinematic, dramatic lighting, 8K"),
        n=parseInt(val("tomas","8"),10)||8, pers=val("personajes","auto");
    // semilla única no repetida
    var r, sig, tries=0, p, ac, cf, gi;
    do{
      r=rng((Date.now()^Math.floor(Math.random()*1e9))+tries);
      p=pick(POOL.prota,r); ac=pick(POOL.acomp,r); cf=pick(POOL.conf,r); gi=pick(POOL.giro,r);
      sig=p+'|'+cf+'|'+gi; tries++;
    } while(usedHas(sig) && tries<40);
    usedAdd(sig);
    try{ if(typeof _pushHist==='function') _pushHist(p+' — '+cf); }catch(e){}

    var multi = (pers!=='1');
    var elenco = multi ? (p+' y '+ac) : p;

    if(fourLote){
      var guion = "【MODO OFFLINE · sin conexión a la API — guía base, editá a gusto】\n\n"+
        "TÍTULO: "+sub.charAt(0).toUpperCase()+sub.slice(1)+" — "+gi.charAt(0).toUpperCase()+gi.slice(1)+"\n\n"+
        "PREMISA ("+tono+"): En "+esc+", "+elenco+" "+cf+". A lo largo de las escenas, "+gi+".\n\n";
      for(var i=1;i<=n;i++){
        guion += "Escena "+i+": "+(multi?("Ana y su acompañante "):("El protagonista "))+pick(["avanza","duda","descubre algo","se enfrenta a un obstáculo","toma una decisión","encuentra una señal","recuerda el pasado","da un paso final"],r)+" en "+esc+".\n";
      }
      var personaje = (multi
        ? "MAIN CHARACTERS (keep identical across all shots): Character A = "+p+", define exact face, hair, outfit and palette once and repeat; Character B = "+ac+", clearly distinct, consistent design. They interact in the scenes."
        : "MAIN CHARACTER (keep identical across all shots): "+p+", define exact face, hair, outfit, body and palette once and repeat in every shot.");
      var imgs=[], anim=[];
      for(var j=1;j<=n;j++){
        imgs.push("Cinematic still, "+(multi?"the same two characters as before":"the same character as before")+", "+pick(POOL.accEN,r)+", "+esc+" setting, "+pal+", dramatic lighting, vertical 9:16, consistent character design.");
        anim.push("Animate shot "+j+": slow cinematic camera, "+(multi?"both characters interacting":"the character")+" with subtle natural motion, "+pal+", 9:16, smooth, consistent.");
      }
      return fence(guion)+"\n"+fence(personaje)+"\n"+fence(imgs.join("\n\n"))+"\n"+fence(anim.join("\n\n"));
    } else {
      // formato P: n párrafos
      var out=[];
      for(var c=1;c<=Math.max(1,n);c++){
        out.push(fence("【OFFLINE】 Exactly 8 seconds. "+p+" in "+esc+", "+pick(POOL.accEN,r)+"; "+pal+"; handheld cinematic camera, vertical 9:16, high detail, self-contained clip."));
      }
      return out.join("\n");
    }
  }
  function offlineResponse(){
    var text=buildOffline();
    if(text==null) return null;
    var body={ candidates:[{ content:{ parts:[{ text:text }] } }], __jmOffline:true };
    return new Response(JSON.stringify(body), { status:200, headers:{ 'Content-Type':'application/json' } });
  }

  /* ---------- fetch con rotación + reintento + offline ---------- */
  window.fetch=function(input,opts){
    var url=(typeof input==='string')?input:((input&&input.url)||'');
    var isGem = url.indexOf('generativelanguage.googleapis.com')>-1 && /generateContent/.test(url);
    if(!isGem) return _f.call(this,input,opts);

    var ks=keys();
    if(!ks.length) return _f.call(this,input,opts); // que la app muestre su propio "falta clave"

    var self=this, delays=[0,500,1200];
    function attempt(i){
      var idx=i % ks.length;
      var u=setKey(url, ks[idx]);
      var wait = i<ks.length ? 0 : (delays[Math.min(i-ks.length,delays.length-1)]||1500);
      return (wait?sleep(wait):Promise.resolve()).then(function(){
        return _f.call(self, (typeof input==='string'?u:Object.assign({},input,{url:u})), opts).then(function(r){
          if(r.ok) return r;
          // 429 cuota, 403, 5xx → rotar
          if((r.status===429||r.status===403||r.status>=500) && i < ks.length*2-1) return attempt(i+1);
          // agotado: intentar offline
          var off=offlineResponse(); return off||r;
        }).catch(function(err){
          if(i < ks.length*2-1) return attempt(i+1);
          var off=offlineResponse(); if(off) return off; throw err;
        });
      });
    }
    return attempt(0);
  };
})();
