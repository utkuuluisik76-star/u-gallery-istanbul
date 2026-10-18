/* Phase 1: data-driven hero. Native browser animation; no runtime dependency. */
import {renderSpecReference} from './spec-reference.js';
const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hero = $('#hero');
const actor = $('#carActor');
const image = $('#carImage');
const reflection = $('#carReflection');
const heading = $('#headlineLayer');
const stats = $('#statStack');
const line = $('#carLine');
let data, cars = [], language = 'en', current = 0, requested = 0;
let introRunning = false, ready = false;
let scrollStart = 0, scrollTravel = 0, previousFocus;
let motionFrame = 0, motionTime = 0, motionPosition = 0, motionTarget = 0;
let navigationTarget = null, routeX = 160, routeY = 100;
const shadow = $('.floor-shadow');
const movingLayers = [actor, heading, stats, line, shadow];
const animations = new Set();
const warmedImages = [];
const strings = {
  en: {
    selection:'The selection', privateViewing:'Private viewing', galleryLabel:'Automotive gallery concept',
    power:'Power', acceleration:'0–100 km/h', engine:'Engine', selectedForm:'Selected form',
    character:'Character', craft:'Craft', presence:'Presence', requestViewing:'Request a viewing',
    concept:'Concept / portfolio', scrollHint:'Scroll to change perspective', viewingTitle:'See it for yourself.',
    contactNote:'Concept / portfolio. No real showroom or vehicles for sale.',
    title:'[BRAND NAME] — Istanbul car gallery concept', description:'A concept for a private luxury car gallery in Istanbul. Explore four automotive forms and request a private viewing.',
    previous:'Previous vehicle', next:'Next vehicle', close:'Close enquiry', closeSelection:'Close collection', show:'Show',
    skip:'Skip to content', heroLabel:'Featured cars', languageLabel:'Language', statsLabel:'Vehicle reference fields', controlsLabel:'Select featured vehicle'
  },
  tr: {
    selection:'Seçki', privateViewing:'Özel gösterim', galleryLabel:'Otomobil galerisi konsepti',
    power:'Güç', acceleration:'0–100 km/sa', engine:'Motor', selectedForm:'Seçilen model',
    character:'Karakter', craft:'İşçilik', presence:'Duruş', requestViewing:'Özel gösterim talep edin',
    concept:'Konsept / portfolyo', scrollHint:'Bakış açısını değiştirmek için kaydırın', viewingTitle:'Yakından tanıyın.',
    contactNote:'Konsept / portfolyo. Gerçek bir galeri veya satılık araç bulunmamaktadır.',
    title:'[BRAND NAME] — İstanbul otomobil galerisi konsepti', description:'İstanbul’da özel bir lüks otomobil galerisi konsepti. Dört otomobili inceleyin ve özel gösterim talep edin.',
    previous:'Önceki otomobil', next:'Sonraki otomobil', close:'Talebi kapat', closeSelection:'Seçkiyi kapat', show:'Görüntüle',
    skip:'İçeriğe geç', heroLabel:'Öne çıkan otomobiller', languageLabel:'Dil', statsLabel:'Otomobil bilgi alanları', controlsLabel:'Öne çıkan otomobili seçin'
  }
};
const escapeHTML = (value) => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = key => strings[language][key];
const motionOn = () => !reduced.matches && document.documentElement.classList.contains('motion');

function setField(selector, value) {
  const field = $(selector);
  field.textContent = value;
  field.classList.toggle('placeholder', /^\[.*\]$/.test(value));
}
function setImage(car) {
  image.srcset = `${car.imageSmall} 840w, ${car.image} 1680w`;
  image.src = car.image;
  image.alt = car.alt[language];
  image.width = car.width;
  image.height = car.height;
  reflection.src = car.imageSmall;
}
function renderCar() {
  const car = cars[current];
  renderSpecReference(car,language);
  setImage(car);
  $('#carBrand').textContent = car.brand;
  $('#modelHeadline').textContent = car.headline;
  setField('#carVariant', car.variant);
  setField('#powerValue', car.specs.power);
  setField('#accelerationValue', car.specs.acceleration);
  setField('#engineValue', car.specs.engine);
  line.textContent = car.line[language];
  $('#currentNumber').textContent = String(current+1).padStart(2,'0');
  $('#totalNumber').textContent = String(cars.length).padStart(2,'0');
  $('#viewingCar').textContent = `${car.brand} ${car.model}`;
  $('#vehicleStatus').textContent = `${car.brand} ${car.model}, ${current+1} / ${cars.length}`;
  document.querySelectorAll('#carDots button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
  hero.dataset.car = car.id;
}
function renderLanguage() {
  document.documentElement.lang = language;
  document.title = t('title').replace('[BRAND NAME]',data.gallery.brand);
  $('meta[name="description"]').content = t('description');
  $('meta[property="og:title"]').content = document.title;
  $('meta[property="og:description"]').content = t('description');
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  $('#langEn').setAttribute('aria-pressed',String(language==='en'));
  $('#langTr').setAttribute('aria-pressed',String(language==='tr'));
  $('#previousCar').setAttribute('aria-label',t('previous'));
  $('#nextCar').setAttribute('aria-label',t('next'));
  $('#closeViewing').setAttribute('aria-label',t('close'));
  $('#closeSelection').setAttribute('aria-label',t('closeSelection'));
  $('.skip-link').textContent = t('skip');
  hero.setAttribute('aria-label',t('heroLabel'));
  $('.language').setAttribute('aria-label',t('languageLabel'));
  stats.setAttribute('aria-label',t('statsLabel'));
  $('.vehicle-controls').setAttribute('aria-label',t('controlsLabel'));
  setField('#brandName',data.gallery.brand);
  setField('#tagline',data.gallery.tagline[language]);
  setField('#address',data.gallery.address[language]);
  setField('#phoneNumber',data.gallery.phone);
  setField('#whatsappNumber',data.gallery.whatsapp);
  renderCar();
  renderSelection();
}
function renderSelection() {
  $('#carDots').innerHTML = cars.map((car,i)=>`<button aria-label="${t('show')} ${escapeHTML(car.brand)} ${escapeHTML(car.model)}" aria-pressed="${i===current}" data-car-index="${i}"></button>`).join('');
  $('#selectionList').innerHTML = cars.map((car,i)=>`<button data-car-index="${i}"><img src="${escapeHTML(car.imageSmall)}" width="100" height="70" alt="" loading="lazy"><span><small>${escapeHTML(car.brand)}</small>${escapeHTML(car.model)}</span></button>`).join('');
}

/* Only transforms and opacity animate. Blur is a separate, fixed-filter layer. */
async function animate(element, keyframes, options) {
  if (reduced.matches || !element.animate) return;
  const animation = element.animate(keyframes,{fill:'both',...options});
  animations.add(animation);
  try { await animation.finished; } catch { /* Cancelled by motion preference change. */ }
  finally { animation.cancel(); animations.delete(animation); }
}
async function enterCar(initial = false) {
  if (reduced.matches) return;
  actor.classList.add('is-present');
  actor.style.willChange = 'transform, opacity';
  const near = matchMedia('(max-width: 599px)').matches;
  const duration = initial ? 1650 : 1350;
  const ghost = image.cloneNode(false);
  ghost.removeAttribute('id'); ghost.removeAttribute('fetchpriority');
  ghost.className = 'car-distance'; ghost.alt = ''; ghost.setAttribute('aria-hidden','true');
  actor.append(ghost);
  await Promise.all([
    animate(actor,[{transform:`translate3d(${near?60:120}px,-70px,0) scale(.26) rotate(-2deg)`,opacity:.2},{transform:'translate3d(0,0,0) scale(1) rotate(0deg)',opacity:1}],{duration,easing:'cubic-bezier(.22,.6,.24,1)'}),
    animate(image,[{opacity:.15},{opacity:1,offset:.65},{opacity:1}],{duration,easing:'ease-out'}),
    animate(ghost,[{opacity:.65},{opacity:0,offset:.65},{opacity:0}],{duration}),
    animate($('#lightSweep'),[{transform:'translateX(40%) skew(-24deg)',opacity:0},{opacity:.35,offset:.3},{transform:'translateX(520%) skew(-24deg)',opacity:0}],{duration:1650,delay:250})
  ]);
  ghost.remove();
  actor.style.willChange = '';
}
const clamp = value => Math.max(0,Math.min(1,value));
const smooth = value => { const p=clamp(value); return p*p*p*(p*(p*6-15)+10); };
const phase = (value,start,end) => smooth((value-start)/(end-start));

/* A reversible scroll journey: hold, drive away, exchange in the distance, approach, hold.
   All poses derive from one position, so reversing scroll never queues old transitions. */
function renderJourney(position) {
  const segment = Math.min(cars.length-1,Math.floor(position));
  const local = position-segment;
  const arriving = segment<cars.length-1 && local>=.54;
  const index = Math.min(cars.length-1,segment+(arriving?1:0));
  if(index!==current) { current=index; renderCar(); }
  let x=0,y=0,scale=1,turn=0,opacity=1,textOpacity=1;
  if(segment<cars.length-1 && local>.18) {
    if(!arriving) {
      const away=phase(local,.18,.52);
      x=-routeX*away; y=-routeY*away;
      scale=1-.78*away; turn=-2.4*away;
      // Remain visible as the car shrinks; fade only once it reaches the distance.
      opacity=1-phase(local,.40,.52);
      textOpacity=1-phase(local,.27,.47);
    } else {
      const approach=phase(local,.56,.91);
      x=routeX*.38*(1-approach); y=-routeY*(1-approach);
      scale=.22+.78*approach; turn=1.6*(1-approach);
      opacity=phase(local,.56,.71);
      textOpacity=phase(local,.62,.88);
    }
  }
  actor.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(5)}) rotate(${turn.toFixed(3)}deg)`;
  actor.style.opacity=String(opacity);
  shadow.style.transform=`translate3d(${x.toFixed(2)}px,${(y*.55).toFixed(2)}px,0) scale(${scale.toFixed(5)}) rotate(-2deg)`;
  shadow.style.opacity=String(opacity*scale);
  heading.style.opacity=String(textOpacity);
  stats.style.opacity=String(textOpacity);
  line.style.opacity=String(textOpacity);
}
function markDriving(active) {
  const state=active?'driving':'rest';
  if(hero.dataset.motionState!==state) {
    hero.dataset.motionState=state;
    movingLayers.forEach(el=>el.style.willChange=active?'transform, opacity':'');
  }
}
function tickJourney(now) {
  motionFrame=0;
  if(!motionOn() || introRunning)return;
  const dt=Math.min(.05,Math.max(.001,(now-(motionTime||now-16.67))/1000));
  motionTime=now;
  const difference=motionTarget-motionPosition;
  // Time-based damping and a speed cap keep trackpads and fast swipes equally calm.
  const step=difference*(1-Math.exp(-dt/.26));
  const limit=.62*dt;
  motionPosition+=Math.max(-limit,Math.min(limit,step));
  if(Math.abs(motionTarget-motionPosition)<.0003)motionPosition=motionTarget;
  renderJourney(motionPosition);
  if(motionPosition!==motionTarget)motionFrame=requestAnimationFrame(tickJourney);
  else {motionTime=0;markDriving(false);}
}
function scheduleJourney() {
  if(!motionOn() || introRunning || !ready)return;
  markDriving(true);
  if(!motionFrame)motionFrame=requestAnimationFrame(tickJourney);
}
function resetJourney() {
  cancelAnimationFrame(motionFrame);motionFrame=0;motionTime=0;
  movingLayers.forEach(el=>{el.style.transform='';el.style.opacity='';el.style.willChange=''});
  markDriving(false);
}
function goToCar(index) {
  const next = (index+cars.length)%cars.length;
  requested=next;
  if(motionOn() && scrollTravel>0) {
    navigationTarget=next;
    window.scrollTo({top:scrollStart+next/(cars.length-1)*scrollTravel,behavior:'smooth'});
  } else {current=next;renderCar();}
}
function measureScroll() {
  const stage=$('.stage');
  scrollStart = hero.getBoundingClientRect().top + window.scrollY;
  scrollTravel = Math.max(0,hero.offsetHeight-stage.offsetHeight);
  routeX=stage.clientWidth*(stage.clientWidth<600?.23:.20);
  routeY=stage.clientHeight*(stage.clientWidth<600?.07:.11);
  onScroll();
}
function onScroll() {
  if(!motionOn() || !ready)return;
  motionTarget=clamp((window.scrollY-scrollStart)/Math.max(1,scrollTravel))*(cars.length-1);
  if(navigationTarget!==null && Math.abs(motionTarget-navigationTarget)<.005)navigationTarget=null;
  if(navigationTarget===null)requested=Math.round(motionTarget);
  scheduleJourney();
}
function openDialog(dialog, trigger) {
  previousFocus = trigger || document.activeElement;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
function closeDialog(dialog) {
  dialog.close();
  document.body.style.overflow = '';
  previousFocus?.focus();
}
function initEvents() {
  $('#langEn').addEventListener('click',()=>{language='en';renderLanguage()});
  $('#langTr').addEventListener('click',()=>{language='tr';renderLanguage()});
  $('#previousCar').addEventListener('click',()=>goToCar(requested-1));
  $('#nextCar').addEventListener('click',()=>goToCar(requested+1));
  $('#selectionButton').addEventListener('click',e=>openDialog($('#selectionDialog'),e.currentTarget));
  document.querySelectorAll('[data-viewing]').forEach(b=>b.addEventListener('click',e=>openDialog($('#viewingDialog'),e.currentTarget)));
  for(const [id,closeId] of [['viewingDialog','closeViewing'],['selectionDialog','closeSelection']]) {
    const dialog = $('#'+id);
    $('#'+closeId).addEventListener('click',()=>closeDialog(dialog));
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog)});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog)}});
  }
  for(const el of [$('#carDots'),$('#selectionList')])el.addEventListener('click',e=>{
    const button=e.target.closest('[data-car-index]');if(!button)return;
    if($('#selectionDialog').open)closeDialog($('#selectionDialog'));
    goToCar(Number(button.dataset.carIndex));
  });
  hero.addEventListener('keydown',e=>{
    if(e.target.closest('dialog'))return;
    if(e.key==='ArrowRight'){e.preventDefault();goToCar(requested+1)}
    if(e.key==='ArrowLeft'){e.preventDefault();goToCar(requested-1)}
  });
  addEventListener('scroll',onScroll,{passive:true});
  for(const event of ['wheel','touchstart','pointerdown'])hero.addEventListener(event,()=>{navigationTarget=null},{passive:true});
  new ResizeObserver(measureScroll).observe(hero);
  reduced.addEventListener('change',()=>{
    animations.forEach(a=>a.cancel());
    resetJourney();navigationTarget=null;
    if(reduced.matches){document.documentElement.classList.remove('motion');requested=current}
    else if(window.scrollY<100){actor.classList.add('is-present');document.documentElement.classList.add('motion')}
    measureScroll();
  });
  addEventListener('pagehide',()=>{cancelAnimationFrame(motionFrame);animations.forEach(a=>a.cancel());markDriving(false)});
}
function warmCarImages() {
  const idle = () => new Promise(resolve=>{
    if('requestIdleCallback' in window)requestIdleCallback(resolve,{timeout:800});
    else setTimeout(resolve,80);
  });
  // Retain decoded images: fetching alone still leaves a decode/upload on first use.
  const warm = async () => {
    for(const car of cars.slice(1)) {
      await idle();
      const next=new Image();next.decoding='async';next.fetchPriority='low';
      next.sizes=image.sizes;
      next.srcset=`${car.imageSmall} 840w, ${car.image} 1680w`;
      next.src=car.image;
      const reflected=new Image();reflected.decoding='async';reflected.fetchPriority='low';reflected.src=car.imageSmall;
      warmedImages.push(next,reflected);
      await Promise.all([next.decode().catch(()=>{}),reflected.decode().catch(()=>{})]);
    }
  };
  warm();
}
async function boot() {
  try {
    const response=await fetch('cars.json');
    if(!response.ok)throw new Error('Cannot load cars.json');
    data=await response.json();cars=data.cars;
    if(!Array.isArray(cars)||!cars.length)throw new Error('cars.json must contain vehicles');
    renderLanguage();introRunning=motionOn();initEvents();ready=true;
    await image.decode().catch(()=>{});
    clearTimeout(window.motionFallback);
    if(!reduced.matches&&window.scrollY<100)document.documentElement.classList.add('motion');
    measureScroll();
    warmCarImages();
    if(motionOn()) {introRunning=true;await enterCar(true);introRunning=false;scheduleJourney()}
    else introRunning=false;
  } catch(error) {
    clearTimeout(window.motionFallback);
    document.documentElement.classList.remove('motion');
    $('#vehicleStatus').textContent='Vehicle data could not load. Please serve this folder over HTTP.';
    $('#nextCar').disabled=true;$('#previousCar').disabled=true;
    console.warn('Gallery data unavailable:',error.message);
  }
}
boot();
