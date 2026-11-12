// URL pública del backend. Cambia este dominio si Render asigna otro.
const API_BASE = "https://dcpi-downloader-api.onrender.com";

// Contenido editable del portal: agrega o modifica elementos en estas listas.
const novedades = [
  {fecha:"PORTAL",tipo:"LANZAMIENTO",titulo:"DCPI Portal",texto:"Un punto central para consultar proyectos, publicaciones y futuras herramientas de DCPI."},
  {fecha:"COMUNIDAD",tipo:"INFORMACIÓN",titulo:"Nuevas publicaciones",texto:"Esta sección reunirá anuncios, cambios de versión y avances de los proyectos."},
  {fecha:"BIBLIOTECA",tipo:"ACTUALIZACIONES",titulo:"Centro de descargas",texto:"Consulta los detalles y enlaces oficiales de cada aplicación disponible."}
];

// Sustituye los enlaces '#' por la URL real del archivo cuando publiques una descarga.
const proyectos = [
  {nombre:"YTPro",categoria:"android",tipo:"ANDROID",version:"En desarrollo",icono:"⇩",descripcion:"Proyecto de descarga y gestión de contenido multimedia. Consulta aquí sus futuras versiones y notas.",url:"#"},
  {nombre:"DCPI Natural Disasters",categoria:"web",tipo:"WEB",version:"En desarrollo",icono:"⌁",descripcion:"Proyecto web dedicado a información y consulta sobre desastres naturales.",url:"#"},
  {nombre:"DCPI FF Web",categoria:"herramienta",tipo:"HERRAMIENTA",version:"En desarrollo",icono:"⌘",descripcion:"Herramienta experimental del ecosistema de proyectos DCPI.",url:"#"}
];

const newsGrid=document.querySelector("#newsGrid");
const projectsGrid=document.querySelector("#projectsGrid");
const emptyState=document.querySelector("#emptyState");
let activeFilter="todos";

function renderNews(){
  newsGrid.innerHTML=novedades.map((item,index)=>`
    <article class="news-card">
      <div class="card-top"><span>${item.tipo}</span><span class="card-index">0${index+1} / ${item.fecha}</span></div>
      <h3>${item.titulo}</h3><p>${item.texto}</p>
    </article>`).join("");
}
function renderProjects(){
  const term=document.querySelector("#searchInput").value.trim().toLocaleLowerCase("es");
  const visible=proyectos.filter(p=>(activeFilter==="todos"||p.categoria===activeFilter)&&
    (p.nombre+" "+p.descripcion+" "+p.tipo).toLocaleLowerCase("es").includes(term));
  projectsGrid.innerHTML=visible.map(p=>`
    <article class="project-card">
      <div class="project-icon">${p.icono}</div>
      <div class="project-meta"><span>${p.tipo}</span><span>DCPI / PROJECT</span></div>
      <h3>${p.nombre}</h3><p>${p.descripcion}</p>
      <div class="project-bottom"><span class="version">${p.version}</span>
      <a class="project-link" href="${p.url}" ${p.url!=="#"?'target="_blank" rel="noopener"':""}>${p.url==="#"?"PRÓXIMAMENTE":"DESCARGAR ↗"}</a></div>
    </article>`).join("");
  emptyState.hidden=visible.length!==0;
}
document.querySelector("#searchInput").addEventListener("input",renderProjects);
document.querySelector("#filters").addEventListener("click",event=>{
  const button=event.target.closest("button[data-filter]");
  if(!button)return;
  activeFilter=button.dataset.filter;
  document.querySelectorAll(".filter").forEach(el=>el.classList.toggle("active",el===button));
  renderProjects();
});
const menuToggle=document.querySelector("#menuToggle");
const nav=document.querySelector("#mainNav");
menuToggle.addEventListener("click",()=>{
  const open=nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded",String(open));
});
nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
  nav.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");
}));
const sections=[...document.querySelectorAll("main section[id]")];
const navLinks=[...document.querySelectorAll(".nav-link")];
if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting)navLinks.forEach(link=>link.classList.toggle("active",link.getAttribute("href")==="#"+entry.target.id));
    });
  },{rootMargin:"-35% 0px -55% 0px"});
  sections.forEach(section=>observer.observe(section));
}
document.querySelector("#year").textContent=new Date().getFullYear();
renderNews();renderProjects();

// Descargador Universal BETA v1 — API remota yt-dlp.
const downloaderForm = document.querySelector("#downloaderForm");
const mediaUrl = document.querySelector("#mediaUrl");
const downloaderStatus = document.querySelector("#downloaderStatus");
const downloaderResult = document.querySelector("#downloaderResult");
const downloadControls = document.querySelector("#downloadControls");
const analyzeBtn = document.querySelector("#analyzeBtn");
const downloadBtn = document.querySelector("#downloadBtn");
let analyzedUrl = "";

function setDownloaderStatus(message, state = "") {
  downloaderStatus.textContent = message;
  downloaderStatus.dataset.state = state;
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "Duración no disponible";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ":" + String(secs).padStart(2, "0") + " min";
}
downloaderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = mediaUrl.value.trim();
  if (!url) return;
  analyzedUrl = "";
  downloaderResult.hidden = true;
  downloadControls.hidden = true;
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analizando...";
  setDownloaderStatus("Conectando con el servidor y analizando el enlace...", "loading");
  try {
    const response = await fetch(API_BASE + "/api/info", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url})
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo analizar el enlace.");
    analyzedUrl = url;
    document.querySelector("#resultTitle").textContent = data.title || "Contenido detectado";
    document.querySelector("#resultPlatform").textContent = data.extractor || "PLATAFORMA";
    document.querySelector("#resultMeta").textContent =
      formatDuration(data.duration) + " · " + (data.formats_count || 0) + " formatos detectados";
    const thumb = document.querySelector("#resultThumb");
    thumb.replaceChildren();
    if (data.thumbnail) {
      const image = document.createElement("img");
      image.src = data.thumbnail;
      image.alt = "Miniatura del contenido";
      image.referrerPolicy = "no-referrer";
      image.onerror = () => { thumb.textContent = "DCPI"; };
      thumb.append(image);
    } else {
      thumb.textContent = "DCPI";
    }
    downloaderResult.hidden = false;
    downloadControls.hidden = false;
    setDownloaderStatus("Análisis completado. Selecciona el formato para continuar.", "success");
  } catch (error) {
    setDownloaderStatus(error.message || "Error de conexión con la API.", "error");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'Analizar enlace <span>⌕</span>';
  }
});
downloadBtn.addEventListener("click", async () => {
  if (!analyzedUrl) return;
  downloadBtn.disabled = true;
  downloadBtn.textContent = "Preparando archivo...";
  setDownloaderStatus("El servidor está procesando el archivo. No cierres esta pestaña.", "loading");
  try {
    const response = await fetch(API_BASE + "/api/download", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url: analyzedUrl, format: document.querySelector("#downloadFormat").value})
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.error || "No se pudo descargar el contenido.");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const filename = match ? decodeURIComponent(match[1] || match[2]) : "dcpi-descarga";
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    setDownloaderStatus("Descarga preparada. Revisa la carpeta de descargas.", "success");
  } catch (error) {
    setDownloaderStatus(error.message || "Error durante la descarga.", "error");
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = 'Descargar <span>↓</span>';
  }
});
