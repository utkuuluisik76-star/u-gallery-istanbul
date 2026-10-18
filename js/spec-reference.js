/* Shared by the continuous scene and the original reduced-motion hero. */
export function renderSpecReference(car,language='en') {
  const link=document.querySelector('#specReferenceLabel'),ref=car.reference;
  if(!link)return;
  link.hidden=!ref?.source;
  if(!ref?.source)return;
  link.textContent=language==='tr'?`Fabrika referansı · ${ref.year}`:`Factory reference · ${ref.year}`;
  link.title=ref.note?.[language]||ref.model;
}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderReferences(cars,language='en') {
  const list=document.querySelector('#referenceList');if(!list)return;
  const tr=language==='tr',labels=tr?['Güç','0–100 km/sa','Motor','Azami hız','Tork','Üretici kaynağı ↗']:['Power','0–100 km/h','Engine','Top speed','Torque','Manufacturer source ↗'];
  list.innerHTML=cars.filter(c=>c.reference).map(c=>{
    const r=c.reference,values=[`${c.specs.power} / ${r.powerKw} kW`,c.specs.acceleration,c.specs.engine,`${r.topSpeedKmh} km/h`,r.torqueNm?`${r.torqueNm} Nm`:null];
    return `<article><h3>${safe(r.model)} <span>(${r.year})</span></h3><dl>${values.map((v,i)=>v===null?'':`<div><dt>${labels[i]}</dt><dd${/^\[.*\]$/.test(v)?' class="placeholder"':''}>${safe(v)}</dd></div>`).join('')}</dl><p>${safe(r.note[language])}</p><a href="${safe(r.source)}" target="_blank" rel="noopener noreferrer">${labels[5]}<span class="sr-only">${tr?' — yeni sekme':' — new tab'}</span></a></article>`;
  }).join('');
}
