(() => {
 const toggle=document.querySelector("#menuToggle"),nav=document.querySelector("#mainNav");
 if(toggle&&nav){toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");}));}
 const year=document.querySelector("#year");if(year)year.textContent=new Date().getFullYear();
 const tiltTargets=document.querySelectorAll("[data-tilt]");
 if(matchMedia("(hover:hover) and (pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
  tiltTargets.forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform="perspective(900px) rotateX("+(-y*7)+"deg) rotateY("+(x*9)+"deg) translateY(-3px)";});el.addEventListener("pointerleave",()=>el.style.transform="");});
 }

 // Capas ambientales compartidas por todas las páginas, incluido Downloader.
 const body=document.body;
 if(body&&!body.querySelector(".dcpi-aurora")){
  const aurora=document.createElement("div");aurora.className="dcpi-aurora";aurora.setAttribute("aria-hidden","true");body.prepend(aurora);
  const scan=document.createElement("div");scan.className="dcpi-scan";scan.setAttribute("aria-hidden","true");body.append(scan);
  const grain=document.createElement("div");grain.className="dcpi-grain";grain.setAttribute("aria-hidden","true");body.append(grain);
 }
 // Iluminación reactiva sutil en tarjetas; en táctil no se fuerza el seguimiento.
 if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  document.querySelectorAll("[data-tilt],.info-card,.news-card,.project-card").forEach(card=>{
   card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect();card.style.setProperty("--mx",(e.clientX-r.left)+"px");card.style.setProperty("--my",(e.clientY-r.top)+"px");},{passive:true});
  });
 }
 // Fondo Three.js: carga diferida y fallback CSS si WebGL/CDN no está disponible.
 const motionOK=!matchMedia("(prefers-reduced-motion: reduce)").matches;
 const mobile=matchMedia("(max-width: 700px)").matches;
 if(motionOK&&body&&!document.getElementById("dcpi-space")){
  const canvas=document.createElement("canvas");canvas.id="dcpi-space";canvas.setAttribute("aria-hidden","true");body.prepend(canvas);
  const start=()=>{
   if(!window.THREE)return;
   try{
    const THREE=window.THREE,renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.5));
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,1,.1,120);camera.position.z=12;
    const green=0xa8ff3e,red=0xff3048;
    const count=mobile?420:1050,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
    for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*58;positions[i*3+1]=(Math.random()-.5)*42;positions[i*3+2]=(Math.random()-.5)*65;const c=new THREE.Color(i%7===0?red:green);colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3));geo.setAttribute("color",new THREE.BufferAttribute(colors,3));
    const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?.075:.095,vertexColors:true,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);
    const core=new THREE.Group();scene.add(core);
    const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(2.35,1),new THREE.MeshBasicMaterial({color:green,wireframe:true,transparent:true,opacity:.13}));core.add(shell);
    const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1),new THREE.MeshBasicMaterial({color:red,wireframe:true,transparent:true,opacity:.12}));core.add(inner);
    [3.4,4.25].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.012,6,100),new THREE.MeshBasicMaterial({color:i?red:green,transparent:true,opacity:.2}));ring.rotation.set(i*.8,1.1+i*.6,0);core.add(ring);});
    const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};addEventListener("resize",resize,{passive:true});resize();
    let raf=0,prev=0;const tick=now=>{raf=requestAnimationFrame(tick);if(now-prev< (mobile?45:28))return;prev=now;const t=now*.00012;stars.rotation.y=t*.22;stars.rotation.x=Math.sin(t)*.025;core.rotation.y=t;core.rotation.x=Math.sin(t*.7)*.22;inner.rotation.y=-t*1.7;inner.rotation.x=t*.8;renderer.render(scene,camera);};
    const stop=()=>{cancelAnimationFrame(raf);renderer.dispose();};document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(tick);});addEventListener("pagehide",stop,{once:true});raf=requestAnimationFrame(tick);
   }catch(e){canvas.remove();}
  };
  const load=()=>{if(window.THREE){start();return;}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";s.async=true;s.onload=start;s.onerror=()=>canvas.remove();document.head.append(s);};
  if("requestIdleCallback"in window)requestIdleCallback(load,{timeout:1800});else setTimeout(load,500);
 }

})();