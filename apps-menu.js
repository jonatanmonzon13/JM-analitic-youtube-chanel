/* ════════════════════════════════════════════════════════════════
   JM · Menú lanzador para las apps del repo
   Pegá esta línea ANTES de </body> en cada app (no en index.html):
       <script src="apps-menu.js"></script>
   - Botón flotante "⚡ Mis apps" → abre un PANEL FLOTANTE en cuadrícula
     con cada app como tarjeta (imagen/emoji + nombre).
   - Lee la lista SIEMPRE actual desde autorizados.json (cachea en jm_apps).
   - Candado suave: si nadie inició sesión, vuelve al inicio.
   ════════════════════════════════════════════════════════════════ */
(function(){
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var ABIERTAS = ['', 'index.html', 'app.html'];   // páginas que NO requieren sesión

  var user = null, apps = [], access = 'all';
  try{
    user = localStorage.getItem('jm_user');
    apps = JSON.parse(localStorage.getItem('jm_apps') || '[]');
    var ac = localStorage.getItem('jm_access');
    access = (!ac || ac === 'all') ? 'all' : JSON.parse(ac);
  }catch(e){}

  // Candado suave: en una sub-app, si no hay sesión iniciada, volver al inicio.
  if(ABIERTAS.indexOf(here) === -1 && !user){ location.replace('index.html'); return; }
  if(!user) return;

  // Imagen de referencia (emoji) por app
  var ICONS = {
    outliers:"🔎", analizador:"🎬",
    historias:"🙏", milagros:"✨", relatos:"📖", parabolas:"🕊️", tentacion:"😇",
    proverbios:"🧓", redencion:"🌅", viajealma:"💫", cartas:"✉️",
    glam:"💄", frutas:"🍓", novelas:"📺", mascotas:"🐶", comida:"🍔", zodiaco:"♌",
    animales:"🦁", objetos:"📱", mitologia:"⚡", autos:"🚗", dinosaurios:"🦖", robots:"🤖",
    plantas:"🌹", insectos:"🐝", paises:"🌍", profesiones:"👨‍⚕️", utiles:"✏️", superheroes:"🦸",
    buenasnoches:"🌙", valores:"🤝", datos:"🧠", trabalenguas:"🎵", monstruos:"👾",
    terror:"👻", terrorurbano:"🌃", fabulas:"🐢"
  };
  // Color de fondo por app (degradado suave)
  function tint(id){
    var map={
      analisis:["#E7B85C","#F8DA8E"], viral:["#FF3D9A","#9B5CFF"],
      reflexivo:["#7DA9FF","#26D9FF"], infantil:["#5BF08E","#13E6A0"], terror:["#9B5CFF","#3a1f5c"]
    };
    var cat={outliers:"analisis",analizador:"analisis",
      historias:"reflexivo",milagros:"reflexivo",relatos:"reflexivo",parabolas:"reflexivo",tentacion:"reflexivo",
      proverbios:"reflexivo",redencion:"reflexivo",viajealma:"reflexivo",cartas:"reflexivo",
      buenasnoches:"infantil",valores:"infantil",datos:"infantil",trabalenguas:"infantil",monstruos:"infantil",
      terror:"terror",terrorurbano:"terror"}[id] || "viral";
    return map[cat];
  }

  // Estilos
  var css = '#jmlnch{position:fixed;top:14px;right:14px;z-index:99999;'
    + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
    + '#jmlnch .jmbtn{display:flex;align-items:center;gap:7px;cursor:pointer;'
    + 'border:1px solid rgba(255,255,255,.25);background:rgba(18,18,24,.85);color:#fff;'
    + 'border-radius:999px;padding:9px 15px;font-size:14px;font-weight:600;'
    + '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 22px rgba(0,0,0,.45)}'
    + '#jmlnch .jmbtn:hover{border-color:#E7B85C;color:#F8DA8E}'
    /* overlay flotante */
    + '#jmov{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;'
    + 'background:rgba(4,5,10,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:20px}'
    + '#jmov.open{display:flex}'
    + '#jmpanel{width:100%;max-width:760px;max-height:84vh;overflow:auto;background:#0c0f17;'
    + 'border:1px solid #2a2f45;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.7);padding:20px 20px 24px;'
    + 'animation:jmpop .22s ease}'
    + '@keyframes jmpop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}'
    + '#jmpanel .jmhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}'
    + '#jmpanel .jmttl{font-weight:800;font-size:18px;color:#F6F8FE;display:flex;align-items:center;gap:8px}'
    + '#jmpanel .jmttl small{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#828DA6;font-weight:500}'
    + '#jmpanel .jmx{cursor:pointer;border:1px solid #2a2f45;background:#11141f;color:#C7CEDE;border-radius:9px;'
    + 'width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px}'
    + '#jmpanel .jmx:hover{border-color:#FF7A9C;color:#FF7A9C}'
    + '#jmgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}'
    + '@media (max-width:640px){#jmgrid{grid-template-columns:repeat(3,1fr)}}'
    + '@media (max-width:420px){#jmgrid{grid-template-columns:repeat(2,1fr)}}'
    + '#jmgrid a.jmtile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;'
    + 'text-decoration:none;background:#11141f;border:1px solid #222842;border-radius:14px;padding:14px 10px;'
    + 'transition:transform .15s,border-color .15s,box-shadow .15s}'
    + '#jmgrid a.jmtile:hover{transform:translateY(-3px);border-color:rgba(231,184,92,.5);box-shadow:0 14px 30px rgba(0,0,0,.45)}'
    + '#jmgrid a.jmtile.here{border-color:#E7B85C;box-shadow:0 0 0 1px #E7B85C inset}'
    + '#jmgrid .jmthumb{width:100%;aspect-ratio:1/1;border-radius:11px;display:flex;align-items:center;justify-content:center;'
    + 'font-size:32px;line-height:1}'
    + '#jmgrid .jmname{font-size:12px;font-weight:600;color:#F6F8FE;line-height:1.25}'
    + '#jmgrid a.jmtile.here .jmname{color:#E7B85C}'
    + '#jmpanel .jmexit{display:block;text-align:center;color:#828DA6;text-decoration:none;'
    + 'font-size:12.5px;padding:14px 0 2px;margin-top:16px;border-top:1px solid #20263c}'
    + '#jmpanel .jmexit:hover{color:#FF7A9C}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function escapeHtml(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Botón flotante (una vez)
  var root = document.createElement('div');
  root.id = 'jmlnch';
  root.innerHTML = '<div class="jmbtn" id="jmbtnToggle">⚡ Mis apps</div>';
  document.body.appendChild(root);

  // Overlay flotante (una vez)
  var ov = document.createElement('div');
  ov.id = 'jmov';
  ov.innerHTML = '<div id="jmpanel">'
    + '<div class="jmhead"><div class="jmttl">⚡ Mis apps <small id="jmcount"></small></div>'
    + '<div class="jmx" id="jmclose">✕</div></div>'
    + '<div id="jmgrid"></div>'
    + '<a class="jmexit" href="index.html">← salir al inicio</a></div>';
  document.body.appendChild(ov);

  function buildGrid(list){
    var vis = (list || []).filter(function(a){
      return a && a.archivo && (access === 'all' || (Array.isArray(access) && access.indexOf(a.id) >= 0));
    });
    var grid = document.getElementById('jmgrid');
    document.getElementById('jmcount').textContent = vis.length ? '· ' + vis.length : '';
    grid.innerHTML = vis.map(function(a){
      var cur = (a.archivo || '').toLowerCase() === here;
      var ico = ICONS[a.id] || '🧩';
      var c = tint(a.id);
      return '<a class="jmtile' + (cur ? ' here' : '') + '" href="' + escapeHtml(a.archivo) + '">'
        + '<span class="jmthumb" style="background:linear-gradient(140deg,' + c[0] + '33,' + c[1] + '22);'
        + 'box-shadow:0 0 0 1px ' + c[0] + '33 inset">' + ico + '</span>'
        + '<span class="jmname">' + escapeHtml(a.nombre) + (cur ? ' ·' : '') + '</span></a>';
    }).join('');
  }

  function openPanel(){ ov.classList.add('open'); }
  function closePanel(){ ov.classList.remove('open'); }

  document.getElementById('jmbtnToggle').addEventListener('click', function(e){ e.stopPropagation(); openPanel(); });
  document.getElementById('jmclose').addEventListener('click', closePanel);
  ov.addEventListener('click', function(e){ if(e.target === ov) closePanel(); });   // clic fuera cierra
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closePanel(); });

  // 1) Pinta YA con caché
  if(apps.length) buildGrid(apps);

  // 2) Refresca desde autorizados.json (lista actual)
  fetch('autorizados.json?t=' + Date.now())
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && Array.isArray(d.apps)){
        var fresh = d.apps.filter(function(a){ return a && a.id && a.archivo; });
        try{ localStorage.setItem('jm_apps', JSON.stringify(fresh)); }catch(e){}
        buildGrid(fresh);
      }
    })
    .catch(function(){ /* sin red o file://: queda la caché */ });
})();
