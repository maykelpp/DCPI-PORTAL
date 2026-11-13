(() => {
  const API_BASE = "https://dcpi-downloader-api.onrender.com";
  const form = document.querySelector("#tiktokForm");
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const status = $("tiktokStatus");
  const output = $("tiktokOutput");
  let current = null;

  function say(message, state="") {
    status.textContent = message;
    status.dataset.state = state;
  }
  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? new Intl.NumberFormat("es-EC", {notation:n>=10000?"compact":"standard", maximumFractionDigits:1}).format(n) : "—";
  }
  function duration(value) {
    const n=Number(value);
    return Number.isFinite(n) && n>=0 ? Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0") : "—";
  }
  function addDownload(label, url, description) {
    if (!url) return;
    const a=document.createElement("a");
    a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; a.className="tiktok-download-link";
    a.textContent=label+" ↓";
    a.setAttribute("aria-label", description || label);
    $("tiktokDownloads").append(a);
  }
  function render(data) {
    current=data;
    $("tiktokTitle").textContent=data.title || "TikTok";
    $("tiktokNickname").textContent=data.author?.nickname || "Creador";
    $("tiktokHandle").textContent=data.author?.unique_id ? "@"+data.author.unique_id : "TikTok";
    $("tiktokStats").replaceChildren();
    [["Vistas",data.play_count],["Me gusta",data.digg_count],["Comentarios",data.comment_count],["Compartidos",data.share_count],["Duración",duration(data.duration)]].forEach(([label,value])=>{
      const item=document.createElement("span"); item.innerHTML="<b></b><small></small>";
      item.querySelector("b").textContent=label==="Duración"?value:number(value);
      item.querySelector("small").textContent=label;
      $("tiktokStats").append(item);
    });
    $("tiktokMusic").textContent=data.music?.title ? "♫ "+data.music.title+" — "+(data.music.author||"Audio original") : "♫ Información de audio no disponible";
    const cover=$("tiktokCover");
    cover.hidden=!data.cover;
    if(data.cover){cover.src=data.cover;cover.onerror=()=>{cover.hidden=true;};}
    const avatar=$("tiktokAvatar");
    avatar.hidden=!data.author?.avatar;
    if(data.author?.avatar){avatar.src=data.author.avatar;avatar.onerror=()=>{avatar.hidden=true;};}
    const photos=$("tiktokPhotos"); photos.replaceChildren(); photos.hidden=!data.images?.length;
    (data.images||[]).slice(0,12).forEach(url=>{const img=document.createElement("img");img.src=url;img.alt="Foto de la publicación";img.loading="lazy";photos.append(img);});
    const links=$("tiktokDownloads"); links.replaceChildren();
    addDownload("HD sin marca de agua",data.media?.hd,"Descargar video HD");
    addDownload("Video sin marca de agua",data.media?.no_watermark,"Descargar video sin marca de agua");
    addDownload("Video con marca de agua",data.media?.watermark,"Descargar video con marca de agua");
    addDownload("Audio MP3 / pista",data.music?.play,"Abrir audio disponible");
    (data.images||[]).slice(0,12).forEach((url,i)=>addDownload("Foto "+(i+1),url,"Abrir foto "+(i+1)));
    output.hidden=false;
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const url=$("tiktokUrl").value.trim();
    if(!url)return;
    output.hidden=true;current=null;
    $("tiktokAnalyze").disabled=true;$("tiktokAnalyze").textContent="Consultando TikWM...";
    say("Analizando el enlace con TikWM. Puede tardar unos segundos...","loading");
    try{
      const response=await fetch(API_BASE+"/api/tiktok/info",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||"No se pudo analizar el TikTok.");
      render(data);
      say("Análisis completado. Selecciona una de las opciones disponibles.","success");
    }catch(error){say(error.message||"No se pudo conectar con TikWM.","error");}
    finally{$("tiktokAnalyze").disabled=false;$("tiktokAnalyze").innerHTML='Analizar TikTok <span>⌕</span>';}
  });
})();