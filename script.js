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