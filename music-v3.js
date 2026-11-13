/* DCPI Music v3 — real, curated web integrations */
(()=>{'use strict';
const $=id=>document.getElementById(id), KEY='dcpiMusicExtensionsV1';
const modules=[
{id:'local',name:'Biblioteca local',kind:'Audio',desc:'Importa y reproduce tus archivos de audio desde el dispositivo. Los archivos permanecen en este navegador.',icon:'♫',core:true},
{id:'lrclib',name:'LRCLIB',kind:'Letras',desc:'Busca letras sincronizadas y texto plano para la canción seleccionada.',icon:'▤',core:true},
{id:'musicbrainz',name:'MusicBrainz',kind:'Metadatos',desc:'Consulta información pública de grabaciones, artistas y lanzamientos.',icon:'◈',core:true},
{id:'jellyfin',name:'Jellyfin',kind:'Servidor personal',desc:'Conecta tu propio servidor Jellyfin desde Ajustes. Requiere CORS habilitado.',icon:'▣',core:false},
{id:'media-session',name:'Controles del sistema',kind:'Integración del navegador',desc:'Publica título y controles multimedia en Android/Chrome cuando el navegador lo permita.',icon:'▻',core:true},
{id:'web-audio',name:'Web Audio FX',kind:'Procesamiento',desc:'Ecualizador y visualizador usando Web Audio API. El soporte depende del navegador.',icon:'∿',core:true}
];
let state={};try{state=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
modules.forEach(m=>{if(state[m.id]===undefined)state[m.id]=true});
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
function renderExtensions(){
const host=$('extensionsContent');if(!host)return;
host.innerHTML='<div class="music-extension-toolbar"><input id="extSearch" placeholder="Buscar módulo, proveedor o función..."><span class="music-muted">'+modules.filter(m=>state[m.id]).length+' / '+modules.length+' activos</span></div><div class="music-extension-grid">'+modules.map(m=>'<article class="music-extension"><div class="music-extension-icon">'+m.icon+'</div><div><strong>'+m.name+'</strong><small>'+m.kind+(m.core?' · INTEGRADO':' · SERVIDOR PROPIO')+'</small><p>'+m.desc+'</p></div><button class="'+(state[m.id]?'enabled':'')+'" data-ext="'+m.id+'">'+(m.core?'Integrado':state[m.id]?'Activo':'Activar')+'</button></article>').join('')+'</div><p class="music-muted" style="margin-top:16px">Estos son conectores web integrados y revisados, no paquetes nativos de Mornye. No se ejecuta código externo. Activar un módulo habilita su disponibilidad en esta interfaz; cada proveedor conserva sus requisitos de red y compatibilidad.</p>';
host.querySelectorAll('[data-ext]').forEach(b=>b.onclick=()=>{let id=b.dataset.ext;if(modules.find(m=>m.id===id).core){toast('Este módulo integrado no se puede desactivar.');return}state[id]=!state[id];save();renderExtensions();toast(state[id]?'Módulo activado':'Módulo desactivado')});
$('extSearch').oninput=e=>{let q=e.target.value.toLowerCase();host.querySelectorAll('.music-extension').forEach((el,i)=>el.hidden=!(modules[i].name+' '+modules[i].kind+' '+modules[i].desc).toLowerCase().includes(q))};
}
function fullscreenPlayer(){
if($('nowOverlay'))return;
let el=document.createElement('div');el.id='nowOverlay';el.className='music-now-overlay';el.innerHTML='<button class="music-now-close" id="nowClose" aria-label="Cerrar">×</button><div class="music-now-panel"><div class="music-art"><span>DCPI</span></div><div class="music-now-meta"><small class="music-muted">DCPI MUSIC · NOW PLAYING</small><h2 id="fullTitle">Selecciona una canción</h2><p id="fullArtist">Tu biblioteca, tu sonido.</p><div class="music-progress"><span id="fullCurrent">0:00</span><input id="fullSeek" type="range" min="0" max="1000" value="0"><span id="fullDuration">0:00</span></div><div class="music-controls"><button class="music-icon" id="fullPrev">|◀</button><button class="music-icon big" id="fullPlay">▶</button><button class="music-icon" id="fullNext">▶|</button></div><p class="music-muted">La reproducción continúa mientras esta pantalla esté abierta.</p></div></div>';
document.body.append(el);const audio=$('playerAudio');
$('nowClose').onclick=()=>el.classList.remove('open');
$('fullPlay').onclick=()=>$('playBtn').click();$('fullPrev').onclick=()=>$('prevBtn').click();$('fullNext').onclick=()=>$('nextBtn').click();
$('fullSeek').oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/1000};
el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open')});
function sync(){let title=$('nowTitle')?.textContent||'Selecciona una canción',artist=$('nowArtist')?.textContent||'';$('fullTitle').textContent=title;$('fullArtist').textContent=artist;$('fullPlay').textContent=audio.paused?'▶':'Ⅱ';if(audio.duration){$('fullSeek').value=audio.currentTime/audio.duration*1000;$('fullCurrent').textContent=fmt(audio.currentTime);$('fullDuration').textContent=fmt(audio.duration)}}
const fmt=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
audio.addEventListener('timeupdate',sync);audio.addEventListener('play',sync);audio.addEventListener('pause',sync);
const hero=document.querySelector('.music-hero');if(hero){let b=document.createElement('button');b.className='music-btn fullscreen-btn';b.textContent='⛶ PANTALLA COMPLETA';b.onclick=()=>{sync();el.classList.add('open')};hero.querySelector('.music-tools')?.append(b)}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-view="extensions"]'))setTimeout(renderExtensions,0)});
document.addEventListener('DOMContentLoaded',()=>{renderExtensions();fullscreenPlayer()});
setTimeout(()=>{renderExtensions();fullscreenPlayer()},500);
})();