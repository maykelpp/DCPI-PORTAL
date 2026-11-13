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
   card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect();card.style.setProperty("--mx",(e.clientX-r.left)+"px");card.style.setProperty("--my",(e.clientY-r.top)+"px");const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform="perspective(950px) rotateX("+(-y*5)+"deg) rotateY("+(x*7)+"deg) translateY(-3px)";},{passive:true});
   card.addEventListener("pointerleave",()=>{card.style.transform="";});
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
    const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:mobile ? 0.075 : 0.095,vertexColors:true,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(stars);
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


 // NÉBULA original scene: star fields, animated core, orbital rings,
 // satellites, energy pulses, distant knot, DNA helix and shooting stars.
 const nebulaMotion=!matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(nebulaMotion&&body&&!document.getElementById("dcpi-space")){
  const canvas=document.createElement("canvas");canvas.id="dcpi-space";canvas.setAttribute("aria-hidden","true");body.prepend(canvas);
  const boot=()=>{
   if(!window.THREE)return;
   try{
    const T=window.THREE,mobile=matchMedia("(max-width:700px)").matches;
    const renderer=new T.WebGLRenderer({canvas,antialias:!mobile,alpha:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.7));
    const scene=new T.Scene();scene.fog=new T.FogExp2(0x070a1c,.035);
    const camera=new T.PerspectiveCamera(60,1,.1,200);camera.position.set(0,0,12);
    const cyan=0x3df2ff,pink=0xff3d9a,violet=0x8a5cff;
    function stars(n,size,color,spread){const g=new T.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*spread;g.setAttribute("position",new T.BufferAttribute(p,3));return new T.Points(g,new T.PointsMaterial({size,color,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));}
    const s1=stars(mobile?900:2200,.06,0xffffff,90),s2=stars(mobile?280:700,.12,cyan,70),s3=stars(mobile?120:300,.14,pink,60);scene.add(s1,s2,s3);
    const core=new T.Group();scene.add(core);
    const ico=new T.Mesh(new T.IcosahedronGeometry(2.4,1),new T.MeshBasicMaterial({color:cyan,wireframe:true,transparent:true,opacity:.75}));
    const inner=new T.Mesh(new T.IcosahedronGeometry(1.3,2),new T.MeshBasicMaterial({color:pink,wireframe:true,transparent:true,opacity:.55}));
    const glow=new T.Mesh(new T.SphereGeometry(.7,24,24),new T.MeshBasicMaterial({color:0xffffff}));core.add(ico,inner,glow);
    const rings=[];[[3.6,cyan],[4.4,violet],[5.2,pink]].forEach((r,i)=>{const m=new T.Mesh(new T.TorusGeometry(r[0],.025,8,128),new T.MeshBasicMaterial({color:r[1]}));m.rotation.set(i*.9,1.2+i*.7,0);core.add(m);rings.push(m);});
    const sats=[];for(let i=0;i<(mobile?7:14);i++){const m=new T.Mesh(i%2?new T.OctahedronGeometry(.22):new T.TetrahedronGeometry(.26),new T.MeshBasicMaterial({color:[cyan,pink,violet][i%3],wireframe:true}));m.userData={r:6+Math.random()*3,a:Math.random()*6.28,v:(.15+Math.random()*.4)*(i%2?1:-1),y:(Math.random()-.5)*5};scene.add(m);sats.push(m);}
    const knot=new T.Mesh(new T.TorusKnotGeometry(2,.5,120,12,2,3),new T.MeshBasicMaterial({color:violet,wireframe:true,transparent:true,opacity:.35}));knot.position.set(-14,-18,-14);scene.add(knot);
    const grid=new T.GridHelper(120,60,cyan,0x1b2a5a);grid.position.y=-28;grid.material.transparent=true;grid.material.opacity=.22;scene.add(grid);
    const dna=new T.Group(),aPts=[],bPts=[],links=[];for(let k=0;k<70;k++){const a=k*.4,y=k*.45-15,x=Math.cos(a)*2,z=Math.sin(a)*2;aPts.push(x,y,z);bPts.push(-x,y,-z);if(k%2===0)links.push(x,y,z,-x,y,-z);}
    function pointSet(arr,color,size){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(arr,3));return new T.Points(g,new T.PointsMaterial({size,color,blending:T.AdditiveBlending,transparent:true,depthWrite:false}));}
    const lg=new T.BufferGeometry();lg.setAttribute("position",new T.Float32BufferAttribute(links,3));dna.add(pointSet(aPts,cyan,.3),pointSet(bPts,pink,.3),new T.LineSegments(lg,new T.LineBasicMaterial({color:violet,transparent:true,opacity:.5})));dna.position.set(15,-12,-10);scene.add(dna);
    const pulses=[];for(let i=0;i<3;i++){const p=new T.Mesh(new T.RingGeometry(.97,1,72),new T.MeshBasicMaterial({color:cyan,transparent:true,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));p.rotation.x=1.2;p.userData.offset=i/3;core.add(p);pulses.push(p);}
    const shoots=[];for(let i=0;i<4;i++){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute([0,0,0,3.5,1.8,0],3));const l=new T.Line(g,new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending}));l.userData={life:0,wait:Math.random()*4};scene.add(l);shoots.push(l);}
    let tx=0,ty=0,mx=0,my=0,scroll=0,raf=0,prev=0;const glowCursor=document.getElementById("gc");
    addEventListener("pointermove",e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;if(glowCursor)glowCursor.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)";},{passive:true});
    addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;scroll=h>0?scrollY/h:0;},{passive:true});
    function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener("resize",resize,{passive:true});resize();
    const clock=new T.Clock();
    function tick(now){raf=requestAnimationFrame(tick);if(now-prev<(mobile?42:24))return;prev=now;const t=clock.getElapsedTime(),sc=scroll;mx+=(tx-mx)*.05;my+=(ty-my)*.05;
     ico.rotation.x=t*.25;ico.rotation.y=t*.35;inner.rotation.x=-t*.5;inner.rotation.z=t*.3;glow.scale.setScalar(1+Math.sin(t*2.2)*.15);
     rings.forEach((r,i)=>{r.rotation.x+=.003*(i+1);r.rotation.y+=.002*(3-i);});
     sats.forEach(s=>{const d=s.userData;d.a+=d.v*.01;s.position.set(Math.cos(d.a)*d.r,d.y+Math.sin(d.a*2)*.6,Math.sin(d.a)*d.r);s.rotation.x+=.02;s.rotation.y+=.015;});
     s1.rotation.y=t*.01;s2.rotation.y=-t*.02;s3.rotation.x=t*.015;knot.rotation.x=t*.3;knot.rotation.y=t*.2;
     ico.material.color.setHSL((t*.04)%1,.95,.6);pulses.forEach(p=>{const q=(t*.22+p.userData.offset)%1;p.scale.setScalar(1+q*10);p.material.opacity=(1-q)*.7;});dna.rotation.y=t*.6;
     shoots.forEach(l=>{const u=l.userData;if(u.life<=0){u.wait-=.016;if(u.wait<=0){u.life=1;l.position.set((Math.random()-.2)*40,camera.position.y+8+Math.random()*10,-8-Math.random()*15);}l.material.opacity=0;return;}u.life-=.014;l.position.x-=.55;l.position.y-=.29;l.material.opacity=Math.sin(u.life*3.14);if(u.life<=0)u.wait=1+Math.random()*3;});
     core.position.set(Math.sin(sc*6.28)*3.5,-sc*8,-sc*10);core.rotation.y=sc*6;camera.position.x=mx*1.6;camera.position.y=-sc*14-my*1.1;camera.position.z=12-sc*4;camera.lookAt(core.position.x*.4,-sc*10,-sc*6);renderer.render(scene,camera);
    }raf=requestAnimationFrame(tick);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(tick);});
    addEventListener("pagehide",()=>{cancelAnimationFrame(raf);renderer.dispose();},{once:true});
   }catch(e){canvas.remove();}
  };
  const load=()=>{if(window.THREE){boot();return;}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";s.async=true;s.onload=boot;s.onerror=()=>canvas.remove();document.head.append(s);};
  if("requestIdleCallback"in window)requestIdleCallback(load,{timeout:1800});else setTimeout(load,500);
 }

})();