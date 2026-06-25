/* ════════════════════════════════════════════════════════
   NOVELA ENGINE · motor compartido JM BOTS
   Lee window.NOVELA_CONFIG = { appId, nombre, emoji, sys }
   ════════════════════════════════════════════════════════ */
(function(){
'use strict';
var CFG = window.NOVELA_CONFIG || {};
var APPID = CFG.appId || 'novela';
var NOMBRE = CFG.nombre || 'Productor de Novelas IA';
var EMOJI = CFG.emoji || '🎬';
var SYS = CFG.sys || '';
var MODEL = 'gemini-2.5-flash';
var API = 'https://generativelanguage.googleapis.com';
var LS_PROJ = 'jmbots_novela_' + APPID;

var $ = function(id){ return document.getElementById(id); };
function esc(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

/* ── Clave compartida con la suite ── */
function loadKeys(){ try{ return JSON.parse(localStorage.getItem('jmbots_keys')||'{}'); }catch(e){ return {}; } }
function getKey(){ return (loadKeys().an||'').trim(); }
function setKey(v){ try{ var k=loadKeys(); k.an=v; localStorage.setItem('jmbots_keys',JSON.stringify(k)); }catch(e){} }
function refreshKeyChip(){ var c=$('keychip'); if(!c) return; if(getKey()){ c.textContent='✓ clave'; c.classList.add('ok'); } else { c.textContent='⚙ clave'; c.classList.remove('ok'); } }
function openKey(){ $('keyinp').value=getKey(); $('keyov').classList.add('open'); }
function closeKey(){ $('keyov').classList.remove('open'); }
function saveKeyBtn(){ setKey($('keyinp').value.trim()); refreshKeyChip(); closeKey(); }

/* ── Estado / proyectos ── */
var proyectos = [];
var actual = null;
function loadProj(){ try{ proyectos = JSON.parse(localStorage.getItem(LS_PROJ)||'[]'); }catch(e){ proyectos=[]; } }
function saveProj(){ try{ localStorage.setItem(LS_PROJ, JSON.stringify(proyectos)); renderStore(); }catch(e){ alert('No se pudo guardar: el almacenamiento del navegador está lleno. Exportá y borrá alguna novela.'); } }
function renderStore(){ try{ var bytes=new Blob([localStorage.getItem(LS_PROJ)||'']).size; $('storebar').textContent=proyectos.length+' novela(s) · '+(bytes/1024).toFixed(0)+' KB usados'; }catch(e){ $('storebar').textContent=''; } }

/* ── Proyectos UI ── */
function renderProyectos(){
  var cont=$('plist');
  if(!proyectos.length){ cont.innerHTML='<div class="pempty">Todavía no hay novelas guardadas.<br>Tocá «+ Nueva novela» para empezar.</div>'; renderStore(); return; }
  cont.innerHTML = proyectos.map(function(p){
    var act=(actual&&actual.id===p.id)?' active':'';
    var f=new Date(p.lastTs||p.ts).toLocaleDateString('es');
    return '<div class="pcard'+act+'">'
      + '<div class="pn">'+esc(p.nombre||'Novela sin título')+'</div>'
      + '<div class="pm">'+(p.mensajes?p.mensajes.length:0)+' mensajes · '+f+'</div>'
      + '<div class="pacts">'
      +   '<button class="go" data-go="'+p.id+'">▶ continuar</button>'
      +   '<button class="exp" data-exp="'+p.id+'">⬇ exportar</button>'
      +   '<button class="del" data-del="'+p.id+'">🗑</button>'
      + '</div></div>';
  }).join('');
  renderStore();
}
function nuevaNovela(){
  var id='n'+Date.now();
  actual={ id:id, nombre:'Novela '+(proyectos.length+1), ts:Date.now(), lastTs:Date.now(), mensajes:[] };
  proyectos.unshift(actual);
  saveProj(); renderProyectos(); renderChat();
  enviarTexto('Dame las 15 ideas para elegir.');
}
function continuar(id){ var p=find(id); if(!p) return; actual=p; renderProyectos(); renderChat(); }
function borrar(id){ if(!confirm('¿Borrar esta novela y todos sus lotes? No se puede deshacer.')) return; proyectos=proyectos.filter(function(x){return x.id!==id;}); if(actual&&actual.id===id) actual=null; saveProj(); renderProyectos(); renderChat(); }
function exportar(id){
  var p=find(id); if(!p) return;
  var txt='═══ '+(p.nombre||'Novela')+' ═══\n\n';
  (p.mensajes||[]).forEach(function(m){ txt+=(m.role==='user'?'>>> TÚ:\n':'>>> PRODUCTOR:\n')+m.text+'\n\n'; });
  var blob=new Blob([txt],{type:'text/plain;charset=utf-8'});
  var a=document.createElement('a');
  var slug=(p.nombre||'novela').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'novela';
  a.href=URL.createObjectURL(blob); a.download=APPID+'-'+slug+'.txt';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
}
function find(id){ for(var i=0;i<proyectos.length;i++){ if(proyectos[i].id===id) return proyectos[i]; } return null; }

/* ── Render de lotes con copiar lote + copiar prompt ── */
function autoNombre(p){
  for(var i=0;i<(p.mensajes||[]).length;i++){
    var m=p.mensajes[i];
    if(m.role==='model'){
      var mm=m.text.match(/BIBLIA[\s\S]{0,90}?(?:novela|t[ií]tulo|historia)[:\s"]*([^\n"]{3,60})/i);
      if(mm) return mm[1].trim().replace(/[*"]/g,'');
    }
  }
  return p.nombre;
}
function splitLotes(text){
  var rx=/(LOTE\s*[123][^\n]*)/gi, idxs=[], m;
  while((m=rx.exec(text))!==null){ idxs.push({i:m.index,h:m[1].trim()}); }
  if(idxs.length<2) return null;
  var pre=text.slice(0,idxs[0].i).trim(), blocks=[];
  for(var k=0;k<idxs.length;k++){
    var start=idxs[k].i, end=(k+1<idxs.length)?idxs[k+1].i:text.length;
    var full=text.slice(start,end).trim();
    var body=full.slice(idxs[k].h.length).replace(/^[\s:—-]+/,'').trim();
    blocks.push({head:idxs[k].h, body:body});
  }
  return {pre:pre, blocks:blocks};
}
function bubbleHtml(text){
  var parsed=splitLotes(text);
  if(!parsed) return '<div class="bubble">'+esc(text)+'</div>';
  var html='';
  if(parsed.pre) html+='<div class="bubble">'+esc(parsed.pre)+'</div>';
  parsed.blocks.forEach(function(b){
    var prompts=b.body.split(/\n\s*\n/).map(function(s){return s.trim();}).filter(Boolean);
    var rows=prompts.map(function(p){
      return '<div class="prow"><pre>'+esc(p)+'</pre><button class="pcopy" data-copyprompt="1">copiar</button></div>';
    }).join('');
    html+='<div class="loteblock"><div class="lh"><b>'+esc(b.head)+'</b>'
      + '<button class="copyb" data-copylote="1">copiar lote completo</button></div>'
      + '<div class="lprompts">'+rows+'</div></div>';
  });
  return html;
}
function copyText(txt, btn, label){
  navigator.clipboard.writeText(txt).then(function(){
    var o=btn.textContent; btn.textContent='✓'; btn.classList.add('ok');
    setTimeout(function(){ btn.textContent=o; btn.classList.remove('ok'); },1400);
  });
}

/* ── Chat ── */
function renderChat(){
  var cont=$('msgs');
  if(!actual){
    cont.innerHTML='<div class="intro"><div class="eyebrow">⚡ JM BOTS</div>'
      + '<h1>'+esc(NOMBRE)+'</h1>'
      + '<p>Creá historias seriadas divididas en clips verticales 9:16 para reels. El bot te entrega los prompts listos para Veo 3.1: personajes, escenas y animación con guion.</p>'
      + '<ul><li>Te propongo <b>15 ideas</b> con resumen → elegís una.</li><li>Pedís el <b>capítulo</b> que quieras.</li><li>Te entrego los <b>3 lotes juntos</b> con botones para copiar cada prompt o el lote entero.</li><li>Cada novela queda guardada para <b>continuarla</b> después.</li></ul>'
      + '<p style="margin-top:14px">Tocá <b>«+ Nueva novela»</b> para empezar.</p></div>';
    setQuick(false); return;
  }
  cont.innerHTML=(actual.mensajes||[]).map(function(m){
    if(m.role==='user') return '<div class="msg u"><div class="who">tú</div><div class="bubble">'+esc(m.text)+'</div></div>';
    return '<div class="msg b"><div class="who">productor</div>'+bubbleHtml(m.text)+'</div>';
  }).join('');
  setQuick(true);
  window.scrollTo(0,document.body.scrollHeight);
}
function setQuick(on){
  var q=$('quick');
  if(!on||!actual){ q.innerHTML=''; return; }
  q.innerHTML='<button data-q="Dame las 15 ideas para elegir.">🎬 15 ideas</button>'
    + '<button data-q="Creá el siguiente capítulo respetando la continuidad.">➕ siguiente capítulo</button>'
    + '<button data-q="Mostrame la biblia de personajes y la trama actual.">📖 biblia</button>';
}

/* ── Envío a Gemini ── */
var enviando=false;
function enviar(){ var v=$('inp').value.trim(); if(!v) return; $('inp').value=''; $('inp').style.height='auto'; enviarTexto(v); }
function enviarTexto(v){
  if(enviando) return;
  if(!getKey()){ openKey(); return; }
  if(!actual){ nuevaNovela(); return; }
  enviando=true; $('sendb').disabled=true;
  actual.mensajes.push({role:'user',text:v}); actual.lastTs=Date.now();
  renderChat(); saveProj();
  var cont=$('msgs');
  var tdiv=document.createElement('div'); tdiv.className='msg b'; tdiv.id='typing';
  tdiv.innerHTML='<div class="who">productor</div><div class="typing">✍️ escribiendo...</div>';
  cont.appendChild(tdiv); window.scrollTo(0,document.body.scrollHeight);
  var contents=actual.mensajes.map(function(m){ return { role:(m.role==='user'?'user':'model'), parts:[{text:m.text}] }; });
  fetch(API+'/v1beta/models/'+MODEL+':generateContent?key='+encodeURIComponent(getKey()),{
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({ system_instruction:{parts:[{text:SYS}]}, contents:contents, generationConfig:{maxOutputTokens:16384, temperature:0.95} })
  }).then(function(r){ return r.json().then(function(data){ return {ok:r.ok,status:r.status,data:data}; }); })
  .then(function(res){
    if(!res.ok) throw new Error((res.data.error&&res.data.error.message)||('Gemini '+res.status));
    var parts=(res.data.candidates&&res.data.candidates[0]&&res.data.candidates[0].content&&res.data.candidates[0].content.parts)||[];
    var text=parts.map(function(p){return p.text||'';}).join('').trim();
    if(!text) throw new Error('respuesta vacía (puede ser el filtro de seguridad). Probá reformular.');
    actual.mensajes.push({role:'model',text:text}); actual.lastTs=Date.now();
    actual.nombre=autoNombre(actual)||actual.nombre;
  }).catch(function(e){
    actual.mensajes.push({role:'model',text:'⚠️ Error: '+e.message});
  }).then(function(){
    enviando=false; $('sendb').disabled=false;
    var t=$('typing'); if(t) t.remove();
    saveProj(); renderProyectos(); renderChat();
  });
}

/* ── Construcción del DOM ── */
function buildUI(){
  document.title=NOMBRE+' — JM BOTS';
  var root=document.createElement('div');
  root.id='novela-root';
  root.innerHTML=
    '<header><a href="app.html" class="back">← Volver a la suite</a>'
    + '<div class="hname">'+EMOJI+' '+esc(NOMBRE)+'</div>'
    + '<div class="keychip" id="keychip">⚙ clave</div></header>'
    + '<div class="layout"><aside class="side"><h3>📚 Mis novelas</h3>'
    + '<button class="newbtn" id="newbtn">+ Nueva novela</button>'
    + '<div class="plist" id="plist"></div><div class="storebar" id="storebar"></div></aside>'
    + '<main class="chat"><div class="msgs" id="msgs"></div>'
    + '<div class="composer"><div class="quick" id="quick"></div>'
    + '<div class="cbar"><textarea id="inp" rows="1" placeholder="Escribí acá... (ej: «dame las ideas», «quiero la 3», «creá el capítulo 1»)"></textarea>'
    + '<button class="sendb" id="sendb">Enviar</button></div></div></main></div>'
    + '<div class="ov" id="keyov"><div class="modal"><h3>Clave de Gemini (gratis)</h3>'
    + '<p>Se comparte con toda la suite. Conseguila gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--cyan)">aistudio.google.com/apikey ↗</a></p>'
    + '<input type="password" id="keyinp" placeholder="AIza..." autocomplete="off">'
    + '<div class="mb"><button class="cancel" id="keycancel">Cancelar</button>'
    + '<button class="save" id="keysave">Guardar</button></div></div></div>';
  document.body.appendChild(root);

  $('keychip').onclick=openKey;
  $('keycancel').onclick=closeKey;
  $('keysave').onclick=saveKeyBtn;
  $('newbtn').onclick=nuevaNovela;
  $('sendb').onclick=enviar;
  var inp=$('inp');
  inp.addEventListener('input', function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,140)+'px'; });
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); enviar(); } });

  $('plist').addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    if(b.dataset.go) continuar(b.dataset.go);
    else if(b.dataset.exp) exportar(b.dataset.exp);
    else if(b.dataset.del) borrar(b.dataset.del);
  });
  $('quick').addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b||!b.dataset.q) return;
    $('inp').value=b.dataset.q; enviar();
  });
  $('msgs').addEventListener('click', function(e){
    var b=e.target.closest('button'); if(!b) return;
    if(b.dataset.copyprompt){ var pre=b.closest('.prow').querySelector('pre'); copyText(pre.textContent,b); }
    else if(b.dataset.copylote){
      var pres=b.closest('.loteblock').querySelectorAll('.prow pre');
      var all=Array.prototype.map.call(pres,function(p){return p.textContent;}).join('\n\n');
      copyText(all,b);
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){
  buildUI();
  loadProj(); refreshKeyChip(); renderProyectos(); renderChat();
  if(!getKey()) setTimeout(openKey,400);
});
})();
