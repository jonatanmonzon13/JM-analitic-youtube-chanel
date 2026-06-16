/* ════════════════════════════════════════════════════════════════
   JM · Menú lanzador — panel flotante con mini-portadas (estilo miniatura)
   Pegá ANTES de </body> en cada app (no en index.html):
       <script src="apps-menu.js"></script>
   Lee la lista actual desde autorizados.json (cachea en jm_apps).
   ════════════════════════════════════════════════════════════════ */
(function(){
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var ABIERTAS = ['', 'index.html', 'app.html'];

  var user=null, apps=[], access='all';
  try{
    user = localStorage.getItem('jm_user');
    apps = JSON.parse(localStorage.getItem('jm_apps') || '[]');
    var ac = localStorage.getItem('jm_access');
    access = (!ac || ac==='all') ? 'all' : JSON.parse(ac);
  }catch(e){}

  if(ABIERTAS.indexOf(here)===-1 && !user){ location.replace('index.html'); return; }
  if(!user) return;

  /* meta por app: subtítulo corto (overlay) + paleta del degradado */
  var META = {
    outliers:["ANÁLISIS",["#1c2740","#3a2e10"]], analizador:["ANÁLISIS",["#26210f","#3a2e10"]],
    historias:["FE",["#241a33","#0e1430"]], milagros:["FE",["#2a1f3d","#10243a"]], relatos:["FE",["#1f2a3d","#101a30"]],
    parabolas:["PARÁBOLA",["#2a2410","#3a2e10"]], tentacion:["DILEMA",["#241a33","#10243a"]],
    proverbios:["SABIDURÍA",["#26210f","#1f2a3d"]], redencion:["REDENCIÓN",["#2a1f10","#10243a"]],
    viajealma:["ALMA",["#241a33","#0e1430"]], cartas:["EMOTIVO",["#1f2a3d","#241a33"]],
    glam:["GLAM",["#3d1f2f","#241a33"]], frutas:["FRUTAS",["#3d1f2f","#2a1f3d"]], novelas:["NOVELA",["#1c2740","#2a1f3d"]],
    mascotas:["DRAMA",["#3d1f2f","#243355"]], comida:["DRAMA",["#3a2e10","#3d1f2f"]], zodiaco:["ZODÍACO",["#241a33","#10243a"]],
    animales:["SALVAJE",["#2a2410","#1f3d2f"]], objetos:["POV",["#1c2740","#2a1f3d"]], mitologia:["MITOS",["#2a2410","#241a33"]],
    autos:["MÁQUINAS",["#10243a","#1c2740"]], dinosaurios:["JURÁSICO",["#1f3d2f","#2a2410"]], robots:["ROBOTS",["#10243a","#241a33"]],
    plantas:["JARDÍN",["#1f3d2f","#2a2410"]], insectos:["INSECTOS",["#2a2410","#1f3d2f"]], paises:["NACIONES",["#10243a","#1c2740"]],
    profesiones:["OFICIOS",["#1c2740","#3d1f2f"]], utiles:["ESCUELA",["#1f2a3d","#2a2410"]], superheroes:["HÉROES",["#10243a","#3d1f2f"]],
    buenasnoches:["DORMIR",["#0e1430","#241a33"]], valores:["VALORES",["#1f3d2f","#10243a"]], datos:["CURIOSO",["#10243a","#1f2a3d"]],
    trabalenguas:["RIMAS",["#2a1f3d","#1f3d2f"]], monstruos:["TIERNO",["#2a1f3d","#10243a"]],
    terror:["TERROR",["#1a1320","#0a0c14"]], terrorurbano:["URBANO",["#13161f","#1a1320"]], fabulas:["FÁBULA",["#1f3d2f","#2a2410"]]
  };
  function meta(id){ return META[id] || ["APP",["#1c2740","#2a1f3d"]]; }

  /* mini-portada SVG: degradado + viñeta + título grande con borde, + acento dorado */
  function poster(a){
    var m = meta(a.id), g = m[1];
    var name = (a.nombre||'').toUpperCase();
    var words = name.split(' ');
    // repartir en hasta 3 líneas equilibradas
    var lines=[], line='';
    words.forEach(function(w){
      if((line+' '+w).trim().length>13){ if(line) lines.push(line); line=w; }
      else line=(line+' '+w).trim();
    });
    if(line) lines.push(line); lines=lines.slice(0,3);
    var fs = lines.length>=3?15 : lines.length===2?17 : 20;
    var startY = 92 - (lines.length-1)*(fs+2);
    var tx = lines.map(function(l,i){
      return '<text x="14" y="'+(startY+i*(fs+3))+'" font-family="Arial Black,Arial,sans-serif" font-weight="900" '
        + 'font-size="'+fs+'" fill="#fff" paint-order="stroke" stroke="#000" stroke-width="3.5" '
        + 'stroke-linejoin="round" letter-spacing="-.3">'+l.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text>';
    }).join('');
    var uid='g'+a.id.replace(/[^a-z0-9]/gi,'');
    return '<svg viewBox="0 0 220 124" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
      + '<defs><linearGradient id="'+uid+'" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="'+g[0]+'"/><stop offset="1" stop-color="'+g[1]+'"/></linearGradient>'
      + '<radialGradient id="v'+uid+'" cx="30%" cy="28%" r="80%">'
      + '<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>'
      + '<rect width="220" height="124" fill="url(#'+uid+')"/>'
      + '<rect width="220" height="124" fill="url(#v'+uid+')"/>'
      // brillo dorado superior-izq
      + '<circle cx="34" cy="26" r="60" fill="#E7B85C" opacity=".10"/>'
      // chip categoría dorado
      + '<rect x="12" y="11" rx="5" width="'+(m[0].length*6.6+16)+'" height="18" fill="#E7B85C"/>'
      + '<text x="'+(12+(m[0].length*6.6+16)/2)+'" y="24" text-anchor="middle" font-family="JetBrains Mono,monospace" '
      + 'font-weight="700" font-size="9.5" fill="#0A0D14" letter-spacing="1">'+m[0]+'</text>'
      + tx
      + '</svg>';
  }

  var GOLD='#E7B85C', GOLD2='#F8DA8E';
  var css = '#jmlnch{position:fixed;top:14px;right:14px;z-index:99999;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
    + '#jmlnch .jmbtn{display:flex;align-items:center;gap:7px;cursor:pointer;border:1px solid rgba(231,184,92,.4);'
    + 'background:rgba(13,15,23,.9);color:'+GOLD2+';border-radius:999px;padding:9px 16px;font-size:14px;font-weight:700;'
    + '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 22px rgba(0,0,0,.5)}'
    + '#jmlnch .jmbtn:hover{border-color:'+GOLD+';background:rgba(231,184,92,.12)}'
    + '#jmov{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;'
    + 'background:rgba(3,4,8,.78);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);padding:18px}'
    + '#jmov.open{display:flex}'
    + '#jmpanel{width:100%;max-width:820px;max-height:86vh;display:flex;flex-direction:column;'
    + 'background:linear-gradient(180deg,#0d1018,#080a11);border:1px solid #2a2f45;border-radius:18px;'
    + 'box-shadow:0 40px 110px rgba(0,0,0,.75);overflow:hidden;animation:jmpop .22s ease}'
    + '@keyframes jmpop{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}'
    + '#jmpanel .jmhead{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;'
    + 'border-bottom:1px solid #1c2238;background:rgba(231,184,92,.04)}'
    + '#jmpanel .jmttl{font-family:Sora,system-ui,sans-serif;font-weight:800;font-size:17px;color:#F6F8FE;display:flex;align-items:center;gap:9px}'
    + '#jmpanel .jmttl .sp{background:linear-gradient(100deg,'+GOLD+','+GOLD2+');-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}'
    + '#jmpanel .jmttl small{font-family:JetBrains Mono,monospace;font-size:11px;color:#828DA6;font-weight:500}'
    + '#jmpanel .jmx{cursor:pointer;border:1px solid #2a2f45;background:#11141f;color:#C7CEDE;border-radius:9px;'
    + 'width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:15px;transition:.15s}'
    + '#jmpanel .jmx:hover{border-color:#FF7A9C;color:#FF7A9C}'
    + '#jmscroll{overflow:auto;padding:18px 20px 8px}'
    + '#jmgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}'
    + '@media (max-width:680px){#jmgrid{grid-template-columns:repeat(3,1fr)}}'
    + '@media (max-width:440px){#jmgrid{grid-template-columns:repeat(2,1fr)}}'
    + '#jmgrid a.jmtile{text-decoration:none;border-radius:13px;overflow:hidden;border:1px solid #222842;'
    + 'background:#0b0e16;transition:transform .16s,border-color .16s,box-shadow .16s;display:block}'
    + '#jmgrid a.jmtile:hover{transform:translateY(-4px);border-color:rgba(231,184,92,.55);box-shadow:0 16px 36px rgba(0,0,0,.5)}'
    + '#jmgrid a.jmtile.here{border-color:'+GOLD+';box-shadow:0 0 0 1px '+GOLD+' inset,0 10px 26px rgba(231,184,92,.18)}'
    + '#jmgrid .jmth{display:block;position:relative;width:100%;height:0;padding-bottom:56.25%;overflow:hidden;background:#11141f}'
    + '#jmgrid .jmth svg{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '#jmgrid .jmth .sh{position:absolute;inset:0;background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.22) 50%,transparent 58%);transform:translateX(-130%)}'
    + '#jmgrid a.jmtile:hover .jmth .sh{transform:translateX(130%);transition:transform .7s ease}'
    + '#jmgrid .jmcap{display:flex;align-items:center;gap:7px;padding:9px 10px;background:#0d1018}'
    + '#jmgrid .jmcap .nm{font-family:Sora,system-ui,sans-serif;font-size:12px;font-weight:600;color:#EAF0FF;line-height:1.2;'
    + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '#jmgrid a.jmtile.here .jmcap .nm{color:'+GOLD2+'}'
    + '#jmgrid .jmcap .here-dot{margin-left:auto;font-family:JetBrains Mono,monospace;font-size:9px;color:'+GOLD+';white-space:nowrap}'
    + '#jmpanel .jmfoot{padding:12px 20px;border-top:1px solid #1c2238;text-align:center}'
    + '#jmpanel .jmfoot a{color:#828DA6;text-decoration:none;font-family:JetBrains Mono,monospace;font-size:12px}'
    + '#jmpanel .jmfoot a:hover{color:#FF7A9C}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function escapeHtml(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  var root=document.createElement('div'); root.id='jmlnch';
  root.innerHTML='<div class="jmbtn" id="jmbtnToggle">⚡ Mis apps</div>';
  document.body.appendChild(root);

  var ov=document.createElement('div'); ov.id='jmov';
  ov.innerHTML='<div id="jmpanel">'
    + '<div class="jmhead"><div class="jmttl">⚡ Mis <span class="sp">apps</span> <small id="jmcount"></small></div>'
    + '<div class="jmx" id="jmclose">✕</div></div>'
    + '<div id="jmscroll"><div id="jmgrid"></div></div>'
    + '<div class="jmfoot"><a href="index.html">← salir al inicio</a></div></div>';
  document.body.appendChild(ov);

  function buildGrid(list){
    var vis=(list||[]).filter(function(a){
      return a && a.archivo && (access==='all' || (Array.isArray(access) && access.indexOf(a.id)>=0));
    });
    document.getElementById('jmcount').textContent = vis.length ? '· '+vis.length+' herramientas' : '';
    document.getElementById('jmgrid').innerHTML = vis.map(function(a){
      var cur=(a.archivo||'').toLowerCase()===here;
      return '<a class="jmtile'+(cur?' here':'')+'" href="'+escapeHtml(a.archivo)+'">'
        + '<span class="jmth">'+poster(a)+'<span class="sh"></span></span>'
        + '<span class="jmcap"><span class="nm">'+escapeHtml(a.nombre)+'</span>'
        + (cur?'<span class="here-dot">● aquí</span>':'')+'</span></a>';
    }).join('');
  }
  function openP(){ ov.classList.add('open'); }
  function closeP(){ ov.classList.remove('open'); }

  document.getElementById('jmbtnToggle').addEventListener('click', function(e){ e.stopPropagation(); openP(); });
  document.getElementById('jmclose').addEventListener('click', closeP);
  ov.addEventListener('click', function(e){ if(e.target===ov) closeP(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeP(); });

  if(apps.length) buildGrid(apps);
  fetch('autorizados.json?t='+Date.now())
    .then(function(r){return r.json();})
    .then(function(d){
      if(d && Array.isArray(d.apps)){
        var fresh=d.apps.filter(function(a){return a && a.id && a.archivo;});
        try{ localStorage.setItem('jm_apps', JSON.stringify(fresh)); }catch(e){}
        buildGrid(fresh);
      }
    }).catch(function(){});
})();
