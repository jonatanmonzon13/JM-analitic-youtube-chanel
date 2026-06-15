/* ════════════════════════════════════════════════════════════════
   JM · Menú lanzador para las apps del repo
   Pegá esta línea ANTES de </body> en cada app (no en index.html):
       <script src="apps-menu.js"></script>
   - Muestra un botón flotante "⚡ Mis apps" con las apps que el
     usuario tiene habilitadas (según autorizados.json + el panel Admin).
   - Candado suave: si nadie inició sesión, vuelve al inicio.
   La identidad la guarda app.html en el navegador al iniciar sesión.
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

  if(!user || !apps.length) return;

  // Apps visibles para este usuario
  var vis = apps.filter(function(a){
    return access === 'all' || (Array.isArray(access) && access.indexOf(a.id) >= 0);
  });
  if(!vis.length) return;

  // Estilos (propios, no dependen del CSS de la app)
  var css = '#jmlnch{position:fixed;top:14px;right:14px;z-index:99999;'
    + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
    + '#jmlnch .jmbtn{display:flex;align-items:center;gap:7px;cursor:pointer;'
    + 'border:1px solid rgba(255,255,255,.25);background:rgba(18,18,24,.85);color:#fff;'
    + 'border-radius:999px;padding:9px 15px;font-size:14px;font-weight:600;'
    + '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 22px rgba(0,0,0,.45)}'
    + '#jmlnch .jmbtn:hover{border-color:#E7B85C;color:#F8DA8E}'
    + '#jmlnch .jmmenu{position:absolute;top:48px;right:0;min-width:220px;background:#0d0f17;'
    + 'border:1px solid #2a2f45;border-radius:13px;padding:7px;display:none;'
    + 'box-shadow:0 18px 50px rgba(0,0,0,.6)}'
    + '#jmlnch.open .jmmenu{display:block}'
    + '#jmlnch .jmttl{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:#828DA6;padding:7px 10px 6px}'
    + '#jmlnch a.jmitem{display:flex;align-items:center;justify-content:space-between;gap:10px;'
    + 'text-decoration:none;color:#F6F8FE;font-size:14px;padding:10px 11px;border-radius:9px}'
    + '#jmlnch a.jmitem:hover{background:#161a28;color:#F8DA8E}'
    + '#jmlnch a.jmitem.here{color:#E7B85C}'
    + '#jmlnch a.jmitem .dot{font-size:11px;color:#5BF08E}'
    + '#jmlnch .jmexit{display:block;text-align:center;color:#828DA6;text-decoration:none;'
    + 'font-size:12px;padding:9px;margin-top:4px;border-top:1px solid #20263c}'
    + '#jmlnch .jmexit:hover{color:#FF7A9C}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function escapeHtml(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  var items = vis.map(function(a){
    var cur = (a.archivo || '').toLowerCase() === here;
    return '<a class="jmitem' + (cur ? ' here' : '') + '" href="' + escapeHtml(a.archivo) + '">'
      + '<span>' + escapeHtml(a.nombre) + '</span>'
      + (cur ? '<span class="dot">● aquí</span>' : '') + '</a>';
  }).join('');

  var root = document.createElement('div');
  root.id = 'jmlnch';
  root.innerHTML = '<div class="jmbtn" id="jmbtnToggle">⚡ Mis apps ▾</div>'
    + '<div class="jmmenu"><div class="jmttl">Mis apps</div>' + items
    + '<a class="jmexit" href="index.html">← salir al inicio</a></div>';
  document.body.appendChild(root);

  document.getElementById('jmbtnToggle').addEventListener('click', function(e){
    e.stopPropagation(); root.classList.toggle('open');
  });
  document.addEventListener('click', function(){ root.classList.remove('open'); });
})();
