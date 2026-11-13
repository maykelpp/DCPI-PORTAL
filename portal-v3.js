(() => {
 const toggle=document.querySelector("#menuToggle"),nav=document.querySelector("#mainNav");
 if(toggle&&nav){toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");}));}
 const year=document.querySelector("#year");if(year)year.textContent=new Date().getFullYear();
 const tiltTargets=document.querySelectorAll("[data-tilt]");
 if(matchMedia("(hover:hover) and (pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
  tiltTargets.forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform="perspective(900px) rotateX("+(-y*7)+"deg) rotateY("+(x*9)+"deg) translateY(-3px)";});el.addEventListener("pointerleave",()=>el.style.transform="");});
 }
})();