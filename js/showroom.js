/* All camera, geometry, light and snap tuning lives here. No runtime libraries. */
export const SHOWROOM_CONFIG = {
  scrollVh:480, mobileScrollVh:440, extraCarScrollVh:105,
  baySpacing:1.12, mobileBreakpoint:600,
  ground:{desktop:.73,mobile:.55},
  vehicle:{widthDesktop:.68,widthTablet:.65,widthMobile:.87,heightDesktop:.46,heightMobile:.29,platformHeightDesktop:.52,platformHeightMobile:.33,minScale:.92,focusScale:1.045},
  camera:{damping:.20,maxSpeed:2.0,dolly:.025,yawDeg:.42,entranceOffset:.18,introMs:2200,introHold:.035,outroStart:.91,outroPullback:.13},
  parallax:{wall:.30,ceiling:.66,floor:.89,names:1,cars:1,foreground:1.32},
  light:{ambient:.13,focused:.31,pool:.48,reflection:.19},
  focus:{falloff:5.5,dimOpacity:.18,hudFalloff:3.8,desktopPrecision:.02,mobilePrecision:.05,transitionMs:180},
  snap:{enabled:true,delayMs:260,durationMs:1050,tolerance:.006,pauseOnExitMs:2200},
  scene:{centerDesktop:.60,centerMobile:.50,wallSlatsPerBay:3,ceilingStripsPerBay:2,pillarEvery:2,dustPerBay:4,nameWidth:.80,nameSizeDesktop:.102,nameSizeMobile:.15},
  swipe:{minimumPx:48,verticalRatio:.72}
};
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const ease=n=>{const p=clamp(n);return p*p*p*(p*(p*6-15)+10)};
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function createShowroom({hero,cars,language='en',onFocus}) {
  // A showroom render may include its own physically grounded plinth. Keep the
  // original cutouts in the data for the unchanged reduced-motion hero.
  cars=cars.map(car=>({...car,...car.showroom}));
  const C=SHOWROOM_CONFIG,stage=hero.querySelector('.stage');
  const root=document.createElement('div');root.className='showroom';root.setAttribute('role','group');root.setAttribute('aria-label','Continuous car showroom');
  root.innerHTML=`<div class="camera-rig"><div class="room-layer back-wall" data-layer="wall"></div><div class="room-layer ceiling" data-layer="ceiling"></div><div class="room-layer showroom-floor" data-layer="floor"><div class="floor-grid"></div></div><div class="room-layer name-world" data-layer="names"></div><div class="room-layer car-world" data-layer="cars"></div><div class="room-layer foreground" data-layer="foreground" aria-hidden="true"></div></div><div class="room-vignette" aria-hidden="true"></div>`;
  stage.prepend(root);
  const rig=root.querySelector('.camera-rig');
  const layers=Object.fromEntries([...root.querySelectorAll('[data-layer]')].map(el=>[el.dataset.layer,el]));
  const hud=[hero.querySelector('#headlineLayer'),hero.querySelector('#statStack'),hero.querySelector('.right-note')];
  const controls=[hero.querySelector('.vehicle-controls'),hero.querySelector('#carDots')];
  let W=0,H=0,ground=0,spacing=0,travel=0,startY=0,mobile=false;
  let position=0,target=0,progress=0,lastTime=0,frame=0,focused=-1,mobileFocus=-1,inTick=false,ticks=0;
  let introStart=performance.now(),intro=0,navigation=null,snapTimer=0,snapPausedUntil=0,destroyed=false,inView=true,touch=null;
  const disposers=[];
  const styles=new WeakMap();let promoted=false;
  function paint(el,property,value){let cache=styles.get(el);if(!cache){cache={};styles.set(el,cache)}if(cache[property]===value)return;cache[property]=value;el.style[property]=value}
  const opacity=(el,value)=>paint(el,'opacity',value.toFixed(3));
  const listen=(target,event,fn,options)=>{target.addEventListener(event,fn,options);disposers.push(()=>target.removeEventListener(event,fn,options))};
  function cutout(car,className,alt='') {
    return `<div class="cutout ${className}"><img src="${safe(car.image)}" srcset="${safe(car.imageSmall)} 840w, ${safe(car.image)} ${car.width}w" sizes="(max-width:600px) 90vw, 68vw" width="${car.width}" height="${car.height}" alt="${safe(alt)}" decoding="async" ${className==='car-sharp'?'':'aria-hidden="true"'}></div>`;
  }
  const bays=cars.map((car,i)=>{
    const bay=document.createElement('article');bay.className='showroom-bay';bay.classList.toggle('has-platform',!!car.presentation?.includesPlatform);bay.dataset.carId=car.id;bay.dataset.index=String(i);
    bay.innerHTML=`<div class="spotlight" aria-hidden="true"></div><div class="light-pool" aria-hidden="true"></div><div class="round-plinth" aria-hidden="true"></div><div class="vehicle-node"><div class="vehicle-body">${cutout(car,'car-sharp',car.alt[language])}${cutout(car,'car-soft')}</div><div class="vehicle-reflection" aria-hidden="true">${cutout(car,'car-reflected')}</div></div>`;
    layers.cars.append(bay);
    const name=document.createElement('p');name.className='showroom-name';name.textContent=car.headline;name.setAttribute('aria-hidden','true');layers.names.append(name);
    return {bay,name,node:bay.querySelector('.vehicle-node'),body:bay.querySelector('.vehicle-body'),soft:bay.querySelector('.car-soft'),sharp:bay.querySelector('.car-sharp'),spot:bay.querySelector('.spotlight'),pool:bay.querySelector('.light-pool'),reflection:bay.querySelector('.vehicle-reflection'),plinth:bay.querySelector('.round-plinth'),image:bay.querySelector('.car-sharp img')};
  });
  layers.wall.innerHTML=Array.from({length:cars.length*C.scene.wallSlatsPerBay+3},(_,i)=>`<i class="wall-slat" style="left:${i*100/C.scene.wallSlatsPerBay}vw" aria-hidden="true"></i>`).join('');
  layers.ceiling.innerHTML=Array.from({length:cars.length*C.scene.ceilingStripsPerBay+2},(_,i)=>`<i class="ceiling-strip" style="left:${i*100/C.scene.ceilingStripsPerBay}vw" aria-hidden="true"></i>`).join('');
  layers.foreground.innerHTML=Array.from({length:Math.ceil(cars.length/C.scene.pillarEvery)},(_,i)=>`<i class="foreground-pillar" style="left:${(i+.9)*C.scene.pillarEvery*100}vw"></i>`).join('');
  const dust=document.createElement('div');dust.className='showroom-dust';dust.setAttribute('aria-hidden','true');
  dust.innerHTML=Array.from({length:cars.length*C.scene.dustPerBay},(_,i)=>`<i style="left:${(i*197+79)%(cars.length*100)}vw;top:${24+(i*13)%42}%"></i>`).join('');layers.cars.append(dust);
  function stopProgress(index){return cars.length===1?0:C.camera.introHold+index/(cars.length-1)*(C.camera.outroStart-C.camera.introHold)}
  function toPosition(p){return clamp((p-C.camera.introHold)/(C.camera.outroStart-C.camera.introHold))*Math.max(0,cars.length-1)}
  function promote(active) {
    const state=active?'driving':'rest';if(hero.dataset.motionState!==state)hero.dataset.motionState=state;
    // Keep the visible camera's compositor surfaces warm; release them on leaving the room.
    const enabled=(active||inView)&&!destroyed;if(promoted===enabled)return;promoted=enabled;
    for(const el of [rig,...Object.values(layers)])el.style.willChange=enabled?'transform, opacity':'';
  }
  function render() {
    const near=clamp(Math.round(position),0,cars.length-1);
    const distance=Math.abs(position-near),focus=Math.exp(-distance*distance*C.focus.falloff);
    const outro=ease((progress-C.camera.outroStart)/(1-C.camera.outroStart));
    const dolly=1+(mobile?0:C.camera.dolly*focus)-C.camera.outroPullback*outro-(1-intro)*.06;
    const yaw=Math.sin(position*Math.PI)*C.camera.yawDeg*(mobile?.35:1);
    const offset=position*spacing-W*C.camera.entranceOffset*(1-intro);
    paint(rig,'transform',mobile?`translateZ(0) scale(${dolly.toFixed(5)})`:`perspective(1800px) scale(${dolly.toFixed(5)}) rotateY(${yaw.toFixed(4)}deg)`);
    opacity(rig,.10+.90*intro);
    for(const [name,el] of Object.entries(layers)){if(mobile&&(name==='foreground'||name==='ceiling'))continue;paint(el,'transform',`translate3d(${(-offset*C.parallax[name]).toFixed(3)}px,0,0)`)}
    bays.forEach((b,i)=>{
      if(mobile){
        // On phones, focus crossfades are compositor transitions at each bay change.
        // The camera itself still scrubs continuously through four parallax planes.
        if(mobileFocus!==near){const f=i===near?1:0;paint(b.node,'transform',`scale(${f?C.vehicle.focusScale:C.vehicle.minScale})`);opacity(b.node,C.focus.dimOpacity+(1-C.focus.dimOpacity)*f);opacity(b.sharp,1);opacity(b.name,.08+.65*f);opacity(b.pool,.18+C.light.pool*f);opacity(b.reflection,C.light.reflection*(.35+.65*f))}
        if(mobileFocus!==near||intro<1)opacity(b.spot,(C.light.ambient+C.light.focused*(i===near?1:0))*intro);
        return;
      }
      const d=Math.abs(position-i),precision=mobile?C.focus.mobilePrecision:C.focus.desktopPrecision,f=Math.round(Math.exp(-d*d*C.focus.falloff)/precision)*precision;
      if(d>1.25){opacity(b.node,0);opacity(b.name,0);opacity(b.spot,0);opacity(b.pool,0);return}
      const scale=C.vehicle.minScale+(C.vehicle.focusScale-C.vehicle.minScale)*f;
      paint(b.node,'transform',`scale(${scale.toFixed(5)})`);
      opacity(b.node,C.focus.dimOpacity+(1-C.focus.dimOpacity)*f);
      if(!mobile){opacity(b.soft,(1-f)*.45);opacity(b.sharp,.55+.45*f)}
      opacity(b.name,.08+.65*f);
      opacity(b.spot,(C.light.ambient+C.light.focused*f)*intro);
      opacity(b.pool,(.18+C.light.pool*f)*intro);
      opacity(b.reflection,C.light.reflection*(.35+.65*f));
    });
    if(mobile)mobileFocus=near;
    const precision=mobile?C.focus.mobilePrecision:C.focus.desktopPrecision;
    const hudFocus=Math.round(Math.exp(-Math.pow(distance*C.focus.hudFalloff,4))/precision)*precision;
    hud.forEach(el=>opacity(el,.04+.96*hudFocus));
    controls.forEach(el=>opacity(el,.45+.55*hudFocus));
    if(near!==focused){focused=near;hero.dataset.car=cars[near].id;bays.forEach((b,i)=>b.bay.setAttribute('aria-hidden',String(i!==near)));onFocus(near)}
  }
  function resize() {
    if(destroyed)return;
    W=stage.clientWidth;H=stage.clientHeight;mobile=W<C.mobileBreakpoint;mobileFocus=-1;
    spacing=W*C.baySpacing;ground=H*C.ground[mobile?'mobile':'desktop'];
    const vh=(mobile?C.mobileScrollVh:C.scrollVh)+Math.max(0,cars.length-4)*C.extraCarScrollVh;
    hero.style.height=`${H*vh/100}px`;
    travel=Math.max(1,hero.offsetHeight-H);startY=hero.getBoundingClientRect().top+scrollY;
    const width=spacing*Math.max(0,cars.length-1)+W;
    root.style.setProperty('--room-width',`${width}px`);root.style.setProperty('--ground',`${ground}px`);
    root.style.setProperty('--focus-duration',`${C.focus.transitionMs}ms`);
    root.style.setProperty('--panel-width',`${W*.36}px`);
    for(const el of Object.values(layers))el.style.width=`${width+W}px`;
    bays.forEach((b,i)=>{
      const car=cars[i],bounds=car.presentation?.bounds||{x:0,y:0,width:car.width,height:car.height};
      const ratio=bounds.width/bounds.height;
      const maxW=W*(mobile?C.vehicle.widthMobile:(W<1100?C.vehicle.widthTablet:C.vehicle.widthDesktop));
      const withPlatform=car.presentation?.includesPlatform;
      const maxH=H*(withPlatform?(mobile?C.vehicle.platformHeightMobile:C.vehicle.platformHeightDesktop):(mobile?C.vehicle.heightMobile:C.vehicle.heightDesktop));
      const carW=Math.min(maxW,maxH*ratio)*(car.presentation?.scale||1),carH=carW/ratio;
      const center=W*(mobile?C.scene.centerMobile:C.scene.centerDesktop);
      b.bay.style.left=`${i*spacing}px`;b.bay.style.width=`${W}px`;
      b.node.style.left=`${center-carW/2}px`;b.node.style.top=`${ground-carH}px`;
      b.node.style.width=`${carW}px`;b.node.style.height=`${carH}px`;
      for(const img of b.bay.querySelectorAll('.cutout img')){
        img.style.width=`${car.width/bounds.width*100}%`;img.style.height=`${car.height/bounds.height*100}%`;
        img.style.left=`${-bounds.x/bounds.width*100}%`;img.style.top=`${-bounds.y/bounds.height*100}%`;
      }
      b.plinth.style.left=`${center-carW*.57}px`;b.plinth.style.width=`${carW*1.14}px`;b.plinth.style.top=`${ground-8}px`;b.plinth.style.height=`${Math.max(26,carW*.075)}px`;
      b.pool.style.left=`${center-carW*.72}px`;b.pool.style.top=`${ground-45}px`;b.pool.style.width=`${carW*1.44}px`;
      b.spot.style.left=`${center-carW*.57}px`;b.spot.style.width=`${carW*1.14}px`;b.spot.style.height=`${ground-H*.13}px`;
      const typeSize=W*(mobile?C.scene.nameSizeMobile:C.scene.nameSizeDesktop);
      b.name.style.left=`${i*spacing+center-W*C.scene.nameWidth/2}px`;b.name.style.top=`${ground-carH*C.vehicle.focusScale-typeSize*.62}px`;
      b.name.style.width=`${W*C.scene.nameWidth}px`;b.name.style.fontSize=`${typeSize}px`;
    });
    layers.foreground.querySelectorAll('.foreground-pillar').forEach((pillar,i)=>pillar.style.left=`${(i*C.scene.pillarEvery+.5)*spacing*C.parallax.foreground+W*.5}px`);
    readScroll(false);render();
  }
  function tick(now) {
    frame=0;if(destroyed)return;inTick=true;ticks++;
    const dt=Math.min(.05,Math.max(.001,(now-(lastTime||now-16.67))/1000));lastTime=now;
    if(navigation){const p=clamp((now-navigation.start)/navigation.duration);window.scrollTo({top:navigation.from+(navigation.to-navigation.from)*ease(p),behavior:'instant'});readScroll(false);if(p===1)navigation=null}
    intro=ease((now-introStart)/C.camera.introMs);
    const delta=target-position,step=delta*(1-Math.exp(-dt/C.camera.damping)),cap=C.camera.maxSpeed*dt;
    position+=clamp(step,-cap,cap);if(Math.abs(target-position)<.0002)position=target;
    render();
    inTick=false;
    if(navigation||position!==target||intro<1){frame=requestAnimationFrame(tick)}else{lastTime=0;promote(false)}
  }
  function schedule(){if(!frame&&!inTick&&!destroyed&&inView){promote(true);frame=requestAnimationFrame(tick)}}
  function cancelNavigation(){navigation=null;clearTimeout(snapTimer)}
  function readScroll(snap=true) {
    progress=clamp((scrollY-startY)/travel);target=toPosition(progress);
    if(snap)clearTimeout(snapTimer);
    if(snap&&!navigation&&C.snap.enabled&&performance.now()>snapPausedUntil&&progress< C.camera.outroStart+.015&&progress>.005){snapTimer=setTimeout(()=>{
      if(destroyed||!inView||document.querySelector('dialog[open]')||!C.snap.enabled)return;
      const index=clamp(Math.round(target),0,cars.length-1),desired=stopProgress(index);
      if(Math.abs(progress-desired)>C.snap.tolerance)navigate(index);
    },C.snap.delayMs)}
    schedule();
  }
  function navigate(index) {
    index=clamp(index,0,cars.length-1);clearTimeout(snapTimer);
    navigation={index,from:scrollY,to:startY+stopProgress(index)*travel,start:performance.now(),duration:C.snap.durationMs};
    introStart=Math.min(introStart,performance.now()-C.camera.introMs);schedule();
  }
  listen(window,'scroll',()=>readScroll(),{passive:true});
  listen(window,'wheel',cancelNavigation,{passive:true});
  listen(window,'touchstart',cancelNavigation,{passive:true});
  listen(stage,'touchstart',e=>{if(e.target.closest('button,a,input,select,textarea'))return;const p=e.changedTouches[0];touch={x:p.clientX,y:p.clientY}},{passive:true});
  listen(stage,'touchend',e=>{if(!touch)return;const p=e.changedTouches[0],dx=p.clientX-touch.x,dy=p.clientY-touch.y;touch=null;if(Math.abs(dx)>C.swipe.minimumPx&&Math.abs(dy)<Math.abs(dx)*C.swipe.verticalRatio)navigate((navigation?.index??Math.round(target))+(dx<0?1:-1))},{passive:true});
  listen(window,'keydown',e=>{if(!inView||e.target.closest('input,select,textarea,dialog')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();navigate((navigation?.index??Math.round(target))+(e.key==='ArrowRight'?1:-1))}});
  const observer=new ResizeObserver(()=>resize());observer.observe(stage);
  const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){readScroll(false);schedule()}else{clearTimeout(snapTimer);cancelAnimationFrame(frame);frame=0;lastTime=0;promote(false)}},{threshold:0});visibility.observe(stage);
  hero.classList.add('showroom-mode');resize();
  // Decode the next vehicles and reflections before the camera reaches their bays.
  const warm=async()=>{for(const b of bays)await Promise.all([...b.bay.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})))};warm();
  listen(window,'pagehide',()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;cancelNavigation()});
  listen(window,'pageshow',()=>readScroll(false));
  return {
    navigate,goBy:delta=>navigate((navigation?.index??Math.round(target))+delta),resize,
    pauseSnap(){cancelNavigation();snapPausedUntil=performance.now()+C.snap.pauseOnExitMs},
    setLanguage(lang){language=lang;root.setAttribute('aria-label',lang==='tr'?'Kesintisiz otomobil galerisi':'Continuous car showroom');bays.forEach((b,i)=>b.image.alt=cars[i].alt[lang])},
    getState(){return {position,target,progress,focused,count:cars.length,roomWidth:spacing*Math.max(0,cars.length-1)+W,ground,snapActive:!!navigation,intro,ticks}},
    destroy(){destroyed=true;promote(false);cancelAnimationFrame(frame);clearTimeout(snapTimer);observer.disconnect();visibility.disconnect();disposers.forEach(fn=>fn());root.remove();hero.classList.remove('showroom-mode');hero.style.height='';hud.concat(controls).forEach(el=>el.style.opacity='')}
  };
}
