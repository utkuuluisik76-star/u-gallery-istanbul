import {createShowroom} from './showroom.js';
import {renderSpecReference,renderReferences} from './spec-reference.js';

/* Existing gallery data, language controls and enquiries coordinate both hero modes. */
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let data,cars=[],language='en',current=0,showroom=null,previousFocus;
const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strings={
  en:{selection:'The selection',privateViewing:'Private viewing',galleryLabel:'Automotive gallery concept',power:'Power',acceleration:'0–100 km/h',engine:'Engine',selectedForm:'Selected form',character:'Character',craft:'Craft',presence:'Presence',requestViewing:'Request a viewing',concept:'Concept / portfolio',scrollHint:'Scroll through the showroom',viewingTitle:'See it for yourself.',contactNote:'Concept / portfolio. No real showroom or vehicles for sale.',title:'[BRAND NAME] — Istanbul car gallery concept',description:'A concept for a private luxury car gallery in Istanbul. Explore the showroom and request a private viewing.',previous:'Previous vehicle',next:'Next vehicle',close:'Close enquiry',closeSelection:'Close collection',show:'Show',skip:'Skip to content',heroLabel:'Featured cars',languageLabel:'Language',statsLabel:'Vehicle reference fields',controlsLabel:'Select featured vehicle'},
  tr:{selection:'Seçki',privateViewing:'Özel gösterim',galleryLabel:'Otomobil galerisi konsepti',power:'Güç',acceleration:'0–100 km/sa',engine:'Motor',selectedForm:'Seçilen model',character:'Karakter',craft:'İşçilik',presence:'Duruş',requestViewing:'Özel gösterim talep edin',concept:'Konsept / portfolyo',scrollHint:'Galeriyi gezmek için kaydırın',viewingTitle:'Yakından tanıyın.',contactNote:'Konsept / portfolyo. Gerçek bir galeri veya satılık araç bulunmamaktadır.',title:'[BRAND NAME] — İstanbul otomobil galerisi konsepti',description:'İstanbul’da özel bir lüks otomobil galerisi konsepti. Galeriyi inceleyin ve özel gösterim talep edin.',previous:'Önceki otomobil',next:'Sonraki otomobil',close:'Talebi kapat',closeSelection:'Seçkiyi kapat',show:'Görüntüle',skip:'İçeriğe geç',heroLabel:'Öne çıkan otomobiller',languageLabel:'Dil',statsLabel:'Otomobil bilgi alanları',controlsLabel:'Öne çıkan otomobili seçin'}
};
const landing={
  en:{referencesTitle:'Model references & sources',referencesIntro:'Manufacturer specifications for the named reference versions, not real inventory. PS is metric horsepower, not SAE hp. CGI visuals may differ from the reference specification.',viewArea:'View neighbourhood on Google Maps',mapArea:'Area overview only — not a showroom pin.',viewingLabel:'Private viewing',viewingTitle:'A closer look. At your pace.',viewingCopy:'Choose a reference model and ask about this gallery concept.',name:'Your name',interest:'Car of interest',message:'Your message (optional)',prepare:'Prepare WhatsApp enquiry',formNote:'This contact is for the concept website, not a real showroom. No booking is made.',visitLabel:'Visit us',visitCopy:'Concept location only. No physical showroom is represented; an exact address has not been supplied.',concept:'Concept / portfolio',backTop:'Back to the gallery',nameError:'Please enter your name.',missingPhone:'The WhatsApp number is awaiting confirmation. No message has been sent.',mapLabel:'Nişantaşı neighbourhood, concept location only'},
  tr:{referencesTitle:'Model referansları ve kaynaklar',referencesIntro:'Belirtilen referans versiyonlarının üretici verileridir; gerçek stok araç bilgisi değildir. PS metrik beygir gücüdür, SAE hp ile aynı değildir. CGI görselleri referans versiyonundan farklı olabilir.',viewArea:'Bölgeyi Google Maps üzerinde görüntüle',mapArea:'Yalnızca bölge görünümü — galeri konumu değildir.',viewingLabel:'Özel gösterim',viewingTitle:'Yakından, kendi temponuzda.',viewingCopy:'Bir referans model seçin ve bu galeri konsepti hakkında iletişime geçin.',name:'Adınız',interest:'İlgilendiğiniz otomobil',message:'Mesajınız (isteğe bağlı)',prepare:'WhatsApp talebini hazırlayın',formNote:'Bu iletişim gerçek bir galeri için değil, konsept web sitesi içindir. Rezervasyon yapılmaz.',visitLabel:'Bizi ziyaret edin',visitCopy:'Yalnızca konsept konumudur. Gerçek bir galeri adresi değildir; açık adres belirtilmemiştir.',concept:'Konsept / portfolyo',backTop:'Galeriye dönün',nameError:'Lütfen adınızı yazın.',missingPhone:'WhatsApp numarası henüz onaylanmadı. Herhangi bir mesaj gönderilmedi.',mapLabel:'Nişantaşı bölgesi, yalnızca konsept konumu'}
};
function field(selector,value){const el=$(selector);el.textContent=value;el.classList.toggle('placeholder',/^\[.*\]$/.test(value))}
function phone(value){const n=String(value||'').replace(/[\s()+-]/g,'');return /^\d{8,15}$/.test(n)?n:null}
function renderHUD(index=current){
  current=index;const c=cars[current];
  renderSpecReference(c,language);
  $('#carBrand').textContent=c.brand;$('#modelHeadline').textContent=c.headline;field('#carVariant',c.variant);
  field('#powerValue',c.specs.power);field('#accelerationValue',c.specs.acceleration);field('#engineValue',c.specs.engine);
  $('#carLine').textContent=c.line[language];$('#currentNumber').textContent=String(current+1).padStart(2,'0');$('#totalNumber').textContent=String(cars.length).padStart(2,'0');
  $('#viewingCar').textContent=`${c.brand} ${c.model}`;$('#vehicleStatus').textContent=`${c.brand} ${c.model}, ${current+1} / ${cars.length}`;
  document.querySelectorAll('#carDots button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
  $('#previousCar').disabled=current===0;$('#nextCar').disabled=current===cars.length-1;
  if(document.activeElement!==$('#enquiryCar'))$('#enquiryCar').value=c.id;
  $('#hero').dataset.car=c.id;
}
function renderSelection(){
  const t=strings[language];
  $('#carDots').innerHTML=cars.map((c,i)=>`<button aria-label="${t.show} ${safe(c.brand)} ${safe(c.model)}" aria-pressed="${i===current}" data-car-index="${i}"></button>`).join('');
  $('#selectionList').innerHTML=cars.map((c,i)=>`<button data-car-index="${i}"><img src="${safe(c.showroom?.imageSmall||c.imageSmall)}" width="100" height="70" alt="" loading="lazy"><span><small>${safe(c.brand)}</small>${safe(c.model)}</span></button>`).join('');
}
function renderLanding(lang){
  const t=landing[lang];
  renderReferences(cars,lang);
  document.querySelectorAll('[data-copy]').forEach(el=>{if(t[el.dataset.copy])el.textContent=t[el.dataset.copy]});
  document.querySelectorAll('[data-gallery-brand]').forEach(el=>{el.textContent=data.gallery.brand;el.classList.toggle('placeholder',/^\[.*\]$/.test(data.gallery.brand))});
  document.querySelectorAll('[data-gallery-address]').forEach(el=>{el.textContent=data.gallery.address[lang];el.classList.toggle('placeholder',/^\[.*\]$/.test(data.gallery.address[lang]))});
  const street=document.querySelector('[data-gallery-street]');if(street){street.textContent=data.gallery.streetAddress||'[STREET ADDRESS]';street.classList.toggle('placeholder',/^\[.*\]$/.test(street.textContent))}
  $('.map-placeholder').setAttribute('aria-label',t.mapLabel);
  for(const el of document.querySelectorAll('[data-social]')){
    const key=el.dataset.social,value=data.gallery.socials?.[key]||`[${key.toUpperCase()} URL]`,valid=/^https:\/\//.test(value);
    el.textContent=valid?(key==='instagram'?'Instagram':'Social'):value;el.classList.toggle('placeholder',!valid);el.setAttribute('aria-disabled',String(!valid));if(valid){el.href=value;el.rel='noopener noreferrer'}
  }
  const embed=data.gallery.mapsEmbed;
  if(/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(embed||'')){
    const box=$('.map-placeholder');let iframe=box.querySelector('iframe');if(!iframe){iframe=document.createElement('iframe');iframe.loading='lazy';iframe.src=embed;iframe.width='600';iframe.height='350';iframe.referrerPolicy='no-referrer-when-downgrade';box.replaceChildren(iframe)}iframe.title=lang==='tr'?'İstanbul galeri konumu':'Gallery location in Istanbul';box.setAttribute('aria-label',iframe.title);
  }
  for(const type of ['whatsapp','phone']){
    const el=$(`[data-contact="${type}"]`),value=data.gallery[type],number=phone(value);el.textContent=`${type==='phone'?(lang==='tr'?'Telefon':'Phone'):'WhatsApp'}: ${value}`;
    el.classList.toggle('placeholder',!number);el.setAttribute('aria-disabled',String(!number));
    if(number){el.href=type==='phone'?`tel:+${number}`:`https://wa.me/${number}?text=${encodeURIComponent(`Merhaba, ${data.gallery.brand} konsept sitesi hakkında bilgi almak istiyorum. Bunun gerçek bir galeri olmadığını biliyorum.`)}`;if(type==='whatsapp'){el.target='_blank';el.rel='noopener noreferrer'}}
  }
  $('#enquiryStatus').textContent='';$('#enquiryNameError').textContent='';$('#enquiryName').removeAttribute('aria-invalid');
}
function renderLanguage(){
  const t=strings[language],title=t.title.replace('[BRAND NAME]',data.gallery.brand);document.documentElement.lang=language;document.title=title;
  $('meta[name="description"]').content=t.description;$('meta[property="og:title"]').content=title;$('meta[property="og:description"]').content=t.description;
  document.querySelectorAll('[data-i18n]').forEach(el=>{if(t[el.dataset.i18n])el.textContent=t[el.dataset.i18n]});
  $('#langEn').setAttribute('aria-pressed',String(language==='en'));$('#langTr').setAttribute('aria-pressed',String(language==='tr'));
  $('#previousCar').setAttribute('aria-label',t.previous);$('#nextCar').setAttribute('aria-label',t.next);$('#closeViewing').setAttribute('aria-label',t.close);$('#closeSelection').setAttribute('aria-label',t.closeSelection);
  $('.skip-link').textContent=t.skip;$('#hero').setAttribute('aria-label',t.heroLabel);$('.language').setAttribute('aria-label',t.languageLabel);$('#statStack').setAttribute('aria-label',t.statsLabel);$('.vehicle-controls').setAttribute('aria-label',t.controlsLabel);
  field('#brandName',data.gallery.brand);field('#tagline',data.gallery.tagline[language]);field('#address',data.gallery.address[language]);field('#phoneNumber',data.gallery.phone);field('#whatsappNumber',data.gallery.whatsapp);
  renderSelection();renderHUD();renderLanding(language);showroom?.setLanguage(language);
}
function openSelection(trigger){previousFocus=trigger;$('#selectionDialog').showModal();document.body.style.overflow='hidden'}
function closeSelection(){$('#selectionDialog').close();document.body.style.overflow='';previousFocus?.focus()}
function requestViewing(){
  $('#enquiryCar').value=cars[current].id;
  showroom?.pauseSnap();
  $('#private-viewing').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
}
function initHeroEvents(){
  $('#langEn').addEventListener('click',()=>{language='en';renderLanguage()});$('#langTr').addEventListener('click',()=>{language='tr';renderLanguage()});
  $('#previousCar').addEventListener('click',()=>showroom.goBy(-1));$('#nextCar').addEventListener('click',()=>showroom.goBy(1));
  $('#selectionButton').addEventListener('click',e=>openSelection(e.currentTarget));$('#closeSelection').addEventListener('click',closeSelection);
  $('#selectionDialog').addEventListener('cancel',e=>{e.preventDefault();closeSelection()});
  $('#selectionDialog').addEventListener('click',e=>{if(e.target===$('#selectionDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSelection()}});
  for(const el of [$('#carDots'),$('#selectionList')])el.addEventListener('click',e=>{const b=e.target.closest('[data-car-index]');if(!b)return;if($('#selectionDialog').open)closeSelection();showroom.navigate(Number(b.dataset.carIndex))});
  document.querySelectorAll('[data-viewing]').forEach(b=>b.addEventListener('click',requestViewing));
}
function initLanding(){
  $('#enquiryCar').innerHTML=cars.map(c=>`<option value="${safe(c.id)}">${safe(c.brand)} ${safe(c.model)}</option>`).join('');
  $('#viewingForm').addEventListener('submit',e=>{
    e.preventDefault();const t=landing[document.documentElement.lang||'en'],name=$('#enquiryName').value.trim();
    const invalid=name.length<2;$('#enquiryNameError').textContent=invalid?t.nameError:'';$('#enquiryName').setAttribute('aria-invalid',String(invalid));
    if(invalid){$('#enquiryName').focus();return}
    const number=phone(data.gallery.whatsapp);if(!number){$('#enquiryStatus').textContent=t.missingPhone;return}
    const car=cars.find(c=>c.id===$('#enquiryCar').value),message=$('#enquiryMessage').value.trim();
    const text=`Merhaba, ${data.gallery.brand} konsept sitesi hakkında iletişime geçiyorum. İlgilendiğim referans model: ${car.brand} ${car.model} (${car.variant}). Adım: ${name}. Bunun gerçek bir galeri veya rezervasyon olmadığını biliyorum.${message?' Mesajım: '+message:''}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
  });
  const bar=$('.mobile-viewing-bar');new IntersectionObserver(entries=>bar.classList.toggle('is-visible',!entries[0].isIntersecting),{threshold:0}).observe($('#hero'));
  renderLanding(language);
}
async function useFallback(){
  showroom?.destroy();showroom=null;document.documentElement.classList.remove('motion');clearTimeout(window.motionFallback);
  await import('./hero-fallback.js');
  for(const [id,lang] of [['langEn','en'],['langTr','tr']])$('#'+id).addEventListener('click',()=>renderLanding(lang));
}
async function boot(){
  const response=await fetch('cars.json');if(!response.ok)throw new Error('Vehicle data unavailable');data=await response.json();cars=data.cars;
  if(!Array.isArray(cars)||!cars.length)throw new Error('cars.json must contain vehicles');
  initLanding();reduced.addEventListener('change',()=>location.reload(),{once:true});
  if(reduced.matches){await useFallback();return}
  renderLanguage();
  try{
    showroom=await createShowroom({hero:$('#hero'),cars,language,onFocus:renderHUD});
    $('#hero').showroom=showroom;
    initHeroEvents();renderHUD();clearTimeout(window.motionFallback);
  }catch(error){console.warn('Showroom fallback:',error.message);await useFallback()}
}
boot().catch(error=>{document.documentElement.classList.remove('motion');clearTimeout(window.motionFallback);console.warn(error.message)});
