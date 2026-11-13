(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 const copy=async value=>{try{await navigator.clipboard.writeText(value);}catch{const t=document.createElement("textarea");t.value=value;document.body.append(t);t.select();document.execCommand("copy");t.remove();}};
 const text=$("lab-text"),stats=$("text-stats");
 function countText(){if(!text||!stats)return;const v=text.value;stats.textContent=v.length+" caracteres · "+(v.trim()?v.trim().split(/\s+/).length:0)+" palabras · "+new Blob([v]).size+" bytes";}
 if(text){text.addEventListener("input",countText);document.querySelectorAll("[data-text-action]").forEach(b=>b.addEventListener("click",async()=>{const a=b.dataset.textAction;if(a==="upper")text.value=text.value.toLocaleUpperCase("es");if(a==="lower")text.value=text.value.toLocaleLowerCase("es");if(a==="clean")text.value=text.value.replace(/\s+/g," ").trim();if(a==="copy")await copy(text.value);countText();}));}
 const units={
  length:{mm:0.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,mi:1609.344},
  mass:{mg:.000001,g:.001,kg:1,t:1000,oz:.028349523125,lb:.45359237}
 };
 const labels={length:{mm:"Milímetros (mm)",cm:"Centímetros (cm)",m:"Metros (m)",km:"Kilómetros (km)",in:"Pulgadas (in)",ft:"Pies (ft)",mi:"Millas (mi)"},mass:{mg:"Miligramos (mg)",g:"Gramos (g)",kg:"Kilogramos (kg)",t:"Toneladas (t)",oz:"Onzas (oz)",lb:"Libras (lb)"},temp:{C:"Celsius (°C)",F:"Fahrenheit (°F)",K:"Kelvin (K)"}};
 const kind=$("unit-kind"),from=$("unit-from"),to=$("unit-to"),val=$("unit-value"),out=$("unit-result");
 function fillUnits(){if(!kind)return;const k=kind.value,opts=Object.entries(labels[k]);from.innerHTML=to.innerHTML=opts.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("");if(k==="length"){from.value="m";to.value="cm";}else if(k==="mass"){from.value="kg";to.value="g";}else{from.value="C";to.value="F";}convert();}
 function convert(){if(!out)return;const n=Number(val.value),k=kind.value;if(!Number.isFinite(n)){out.textContent="Introduce un número válido";return;}let result;if(k==="temp"){const c=from.value==="C"?n:from.value==="F"?(n-32)*5/9:n-273.15;result=to.value==="C"?c:to.value==="F"?c*9/5+32:c+273.15;}else result=n*units[k][from.value]/units[k][to.value];out.textContent=new Intl.NumberFormat("es-EC",{maximumFractionDigits:8}).format(result)+" "+to.value;}
 if(kind){kind.addEventListener("change",fillUnits);[from,to,val].forEach(x=>x.addEventListener("input",convert));fillUnits();}
 const ji=$("json-input"),jo=$("json-output"),js=$("json-status");
 document.querySelectorAll("[data-json-action]").forEach(b=>b.addEventListener("click",async()=>{try{const data=JSON.parse(ji.value);jo.value=b.dataset.jsonAction==="minify"?JSON.stringify(data):JSON.stringify(data,null,2);js.textContent="✓ JSON válido · "+(Array.isArray(data)?"Array":typeof data);js.style.color="#3df2ff";if(b.dataset.jsonAction==="copy")await copy(jo.value);}catch(e){js.textContent="Error: "+e.message;js.style.color="#ff6b9e";jo.value="";}}));
 const bi=$("b64-input"),bo=$("b64-output"),bs=$("b64-status");
 document.querySelectorAll("[data-b64-action]").forEach(b=>b.addEventListener("click",async()=>{try{const a=b.dataset.b64Action;if(a==="encode")bo.value=btoa(Array.from(new TextEncoder().encode(bi.value),x=>String.fromCharCode(x)).join(""));else if(a==="decode"){const bin=atob(bi.value.trim());bo.value=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));}else await copy(bo.value);bs.textContent=a==="copy"?"Resultado copiado.":"✓ Operación completada";bs.style.color="#3df2ff";}catch(e){bs.textContent="No se pudo procesar: revisa el contenido.";bs.style.color="#ff6b9e";}}));
 const preview=$("palette-preview"),codes=$("palette-codes");let palette=[];
 function generate(){if(!preview)return;const base=Math.floor(Math.random()*360),sat=75+Math.floor(Math.random()*18),light=52;const offsets=[0,28,155,205,320];palette=offsets.map((o,i)=>{const h=(base+o)%360,l=light+(i===2?5:0);return hslHex(h,sat,l);});preview.innerHTML=palette.map(c=>'<button type="button" style="background:'+c+'" data-hex="'+c+'" aria-label="Copiar '+c+'" title="Copiar '+c+'"></button>').join("");codes.textContent=palette.join(" · ");preview.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>copy(b.dataset.hex)));}
 function hslHex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0");};return "#"+f(0)+f(8)+f(4);}
 $("palette-generate")?.addEventListener("click",generate);
 $("palette-copy")?.addEventListener("click",()=>copy(palette.join("\n")));
 generate();
})();