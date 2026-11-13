(() => {
const API="https://dcpi-downloader-api.onrender.com";
const $=id=>document.getElementById(id);
const form=$("unifiedForm");
let analyzed={url:"",engine:"",data:null};
function status(message,state=""){const el=$("status");el.textContent=message;el.dataset.state=state;}
function isTikTok(url){try{const h=new URL(url).hostname.toLowerCase();return h==="tiktok.com"||h.endsWith(".tiktok.com");}catch{return false;}}
function fmtDuration(v){const n=Number(v);return Number.isFinite(n)&&n>=0?Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0"):"Duración no disponible";}
function fmtNum(v){const n=Number(v);return Number.isFinite(n)&&n>=0?new Intl.NumberFormat("es-EC",{notation:n>=10000?"compact":"standard",maximumFractionDigits:1}).format(n):"—";}
function addStat(label,value){const node=document.createElement("span");const b=document.createElement("b"),s=document.createElement("small");b.textContent=value;s.textContent=label;node.append(b,s);$("stats").append(node);}
function addLink(label,url){if(!url)return;const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label+" ↓";$("directLinks").append(a);}
function reset(){ $("result").hidden=true;$("detection").hidden=true;$("stats").replaceChildren();$("directLinks").replaceChildren();$("photoGrid").replaceChildren();$("authorBlock").hidden=true;$("cover").hidden=true;$("music").hidden=true;$("formatWrap").hidden=false;$("downloadBtn").hidden=false;}
function detect(name,engine,icon){$("detection").hidden=false;$("platformName").textContent=name;$("engineName").textContent=engine;$("detectIcon").textContent=icon;}
function renderTikTok(d){
 detect("TikTok","TIKWM API","TT");
 $("mediaTitle").textContent=d.title||"TikTok";
 $("mediaMeta").textContent=fmtDuration(d.duration)+" · "+(d.width&&d.height?d.width+" × "+d.height:"Video o publicación");
 if(d.cover){$("cover").src=d.cover;$("cover").hidden=false;}
 if(d.author?.nickname||d.author?.unique_id){$("authorBlock").hidden=false;$("authorName").textContent=d.author.nickname||"Creador";$("authorHandle").textContent=d.author.unique_id?"@"+d.author.unique_id:"TikTok";if(d.author.avatar)$("avatar").src=d.author.avatar;}
 addStat("Vistas",fmtNum(d.play_count));addStat("Me gusta",fmtNum(d.digg_count));addStat("Comentarios",fmtNum(d.comment_count));addStat("Compartidos",fmtNum(d.share_count));addStat("Duración",fmtDuration(d.duration));
 if(d.music?.title){$("music").hidden=false;$("music").textContent="♫ "+d.music.title+" — "+(d.music.author||"Audio original");}
 if(d.images?.length){$("photoGrid").hidden=false;d.images.slice(0,12).forEach(url=>{const img=document.createElement("img");img.src=url;img.alt="Foto de la publicación";img.loading="lazy";$("photoGrid").append(img);});}
 addLink("Video HD sin marca de agua",d.media?.hd);addLink("Video sin marca de agua",d.media?.no_watermark);addLink("Video con marca de agua",d.media?.watermark);addLink("Audio",d.music?.play);
 (d.images||[]).slice(0,12).forEach((url,i)=>addLink("Foto "+(i+1),url));
 $("formatWrap").hidden=true;$("downloadBtn").hidden=true;$("result").hidden=false;
}
function renderYtDlp(d){
 detect(d.extractor||"Plataforma compatible","YT-DLP ENGINE","DC");
 $("mediaTitle").textContent=d.title||"Contenido detectado";
 $("mediaMeta").textContent=fmtDuration(d.duration)+" · "+(d.formats_count||0)+" formatos detectados";
 if(d.thumbnail){$("cover").src=d.thumbnail;$("cover").hidden=false;}
 $("result").hidden=false;
}
form.addEventListener("submit",async e=>{
 e.preventDefault();const url=$("mediaUrl").value.trim();if(!url)return;
 reset();analyzed={url:"",engine:"",data:null};$("analyzeBtn").disabled=true;$("analyzeBtn").textContent="Analizando...";status("Detectando plataforma y seleccionando el motor disponible...","loading");
 try{
  const tiktok=isTikTok(url),endpoint=API+(tiktok?"/api/tiktok/info":"/api/info");
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
  const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||"No se pudo analizar el enlace.");
  analyzed={url,engine:tiktok?"tikwm":"ytdlp",data};
  if(tiktok)renderTikTok(data);else renderYtDlp(data);
  status("Análisis completado. "+(tiktok?"TikWM ha devuelto las opciones multimedia disponibles.":"Selecciona el formato y descarga el contenido autorizado."),"success");
 }catch(err){status(err.message||"Error de conexión con el servidor.","error");}
 finally{$("analyzeBtn").disabled=false;$("analyzeBtn").innerHTML='Analizar <span>⌕</span>';}
});
$("downloadBtn").addEventListener("click",async()=>{
 if(!analyzed.url||analyzed.engine!=="ytdlp")return;
 $("downloadBtn").disabled=true;$("downloadBtn").textContent="Preparando archivo...";status("Procesando el archivo en el servidor...","loading");
 try{
  const response=await fetch(API+"/api/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:analyzed.url,format:$("format").value})});
  const type=response.headers.get("content-type")||"";
  if(!response.ok||type.includes("application/json")){const data=await response.json();throw new Error(data.error||"No se pudo preparar el archivo.");}
  const blob=await response.blob(),disposition=response.headers.get("content-disposition")||"",match=disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const filename=match?decodeURIComponent(match[1]||match[2]):"dcpi-descarga";
  const objectUrl=URL.createObjectURL(blob),a=document.createElement("a");a.href=objectUrl;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);
  status("Archivo preparado. Revisa la carpeta de descargas.","success");
 }catch(err){status(err.message||"Error durante la descarga.","error");}
 finally{$("downloadBtn").disabled=false;$("downloadBtn").innerHTML='Descargar <span>↓</span>';}
});
})();