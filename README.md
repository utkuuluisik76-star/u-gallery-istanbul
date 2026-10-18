# U-gallery Istanbul — continuous showroom concept

Een bestaand HTML/CSS/JavaScript-concept, uitgebreid met één horizontale 2.5D-showroom. Geen build, framework, Three.js, 3D-model of externe runtimebibliotheek. Alle auto’s blijven op hun eigen plek staan; scrollen verplaatst de camera door dezelfde ruimte. EN/TR, gele placeholders, navigatie en viewing-CTA zijn behouden.

## Bekijken

De lokale preview draait op http://127.0.0.1:4175/. Herstart vanuit de bovenliggende workspace indien nodig:

```powershell
node scripts/gallery-serve.mjs
```

Een gewone lokale HTTP-server (bijvoorbeeld VS Code Live Server) werkt ook. Open de pagina via HTTP, niet met `file://`, want de browser moet `cars.json` kunnen ophalen. Op Netlify is geen servercode of build nodig.

## Structuur

- `index.html`: bestaande hero/fallback, gedeelde HUD, bezichtiging, bezoek en footer.
- `js/app.js`: bestaande data en EN/TR, HUD, bediening en WhatsApp-formulier.
- `js/showroom.js`: centrale configuratie, ruimte, camera, parallax en snap.
- `js/hero-fallback.js`: de bewaarde oorspronkelijke hero, gebruikt bij reduced motion of een probleem met de showroom.
- `css/styles.css`: bestaand ontwerp en originele hero.
- `css/showroom.css`: aanvullende ruimte en de nieuwe secties.
- `cars.json`: voertuiggegevens en galerij-instellingen.
- `assets/cars/`: transparante WebP, inclusief mobiele varianten.
- `assets/fonts/`: lokale Space Grotesk en Manrope met Engelse/Turkse tekens en SIL OFL-licenties.
- `_headers`: noindex en eenvoudige statische hostingheaders.

## Wat je kunt aanpassen

Alle camerawaarden staan bovenaan `js/showroom.js` in `SHOWROOM_CONFIG`. Na aanpassen de pagina verversen.

| Instelling | Betekenis |
|---|---|
| `scrollVh`, `mobileScrollVh` | Lengte van het vastgezette verhaal: standaard 480vh / 440vh |
| `extraCarScrollVh` | Extra scrollruimte voor iedere auto boven de oorspronkelijke vier |
| `baySpacing` | Afstand tussen de auto’s; hoger betekent meer lege ruimte |
| `ground.desktop`, `ground.mobile` | Eén grondlijn als fractie van de schermhoogte |
| `vehicle.width…`, `vehicle.height…` | Begrenzing van de auto zodat deze volledig in beeld blijft |
| `vehicle.minScale`, `vehicle.focusScale` | Subtiele nadruk op de auto die de camera nadert |
| `camera.damping` | Traagheid; hoger laat de camera langer uitlopen |
| `camera.maxSpeed` | Maximale snelheid in autovakken per seconde |
| `camera.dolly`, `camera.yawDeg` | Voorwaartse beweging en lichte cameradraai |
| `camera.introMs`, `camera.entranceOffset` | Introduur en positie bij de ingang |
| `camera.outroStart`, `camera.outroPullback` | Begin en afstand van het terugtrekken na de laatste auto |
| `parallax` | Snelheid van achterwand, plafond, vloer, namen, auto’s en voorgrond |
| `light.ambient`, `light.focused`, `light.pool`, `light.reflection` | Licht en reflectie, waarden tussen 0 en 1 |
| `snap.delayMs`, `snap.durationMs` | Wachttijd na stoppen en duur van het uitlijnen |
| `snap.enabled` | Automatisch uitlijnen aan/uit; bediening blijft werken |
| `scene`, `swipe` | Aantal lichtdetails, positie van de auto en swipegevoeligheid |

Kleuren blijven de bestaande CSS-tokens in `css/styles.css`: #0A0A0B, #F3F1EB, #AAA8A3, #BCA587 en #FFE16A voor ontbrekende gegevens.

## Voertuigen en grondlijn

De showroom wordt uit `cars` opgebouwd. Met vier auto’s is de ruimte circa 4,36 schermbreedtes. Een extra object in `cars.json` voegt automatisch een vak, camerastop, selectiemogelijkheid en tellerpositie toe. De scrolllengte groeit mee. De vijfde auto is in een aparte test gecontroleerd; hij is niet aan de echte conceptdata toegevoegd.

Iedere auto gebruikt dezelfde schaalregel en grondlijn. De nieuwe showroom gebruikt per auto het optionele `showroom`-object in `cars.json`; daarin staan beeldpaden, afmetingen, EN/TR-altteksten en `presentation.bounds` voor de volledige auto **inclusief sokkel** (pixels: x, y, width, height). `presentation.includesPlatform:true` schakelt de extra CSS-sokkel, losse spiegeling en blurkopie uit. De bandencontacten, platformreflectie en sokkel zijn één render en bewegen/scalen dus altijd samen. De onderkant van de sokkel rust op de gedeelde grondlijn. `presentation.scale` blijft bij voorkeur 1. De oorspronkelijke beeldvelden blijven intact voor de reduced-motion-fallback.

Voor nieuwe beelden: transparante WebP/PNG, dezelfde driekwartvoorzijde met de neus naar links, vergelijkbare camerahoogte en belichting. Voor deze nieuwe stijl: auto én lage ronde sokkel samen renderen, inclusief contactschaduw en reflectie op het platform, maar zonder externe studiovloer of achtergrond. De huidige beelden zijn 1536×1024 px met 840px-varianten. Vul de zichtbare grenzen van het volledige object in. Voor losse auto-cutouts zonder sokkel blijft de oude opbouw beschikbaar: laat `includesPlatform` dan weg. Test na iedere toevoeging de volledige auto én sokkel op mobiel en desktop.

## Beelden en merkemblemen

De vier aangeleverde beelden zijn met de ingebouwde imagegen-bewerking vrijstaand gemaakt en van merkemblemen voorzien. De bronvorm, kleur en kijkrichting waren de uitgangspunten. Promptset: behoud auto, materialen en camera; herstel de fabriekspositie van Porsche-schild, Mercedes-ster of Rolls-Royce-badge/Spirit of Ecstasy; maak de grijze achtergrond echt transparant; geen extra tekst, vloer, reflectie of watermerk. De resultaten zijn naar WebP gecodeerd. Het zijn conceptvisuals met gereconstrueerde details, geen geverifieerde voorraadfoto’s of officiële persbeelden.

De oorspronkelijke bestanden zijn `porsche-911-gt.webp`, `g-wagon.webp`, `cullinan.webp` en `s-class.webp`, met `-840.webp`-varianten. Ze blijven samen met `studio.webp` beschikbaar voor de fallback.

De goedgekeurde nieuwe CGI-proeven zijn met de ingebouwde imagegen-tool vrijstaand gemaakt en als `porsche-platform-v2.webp`, `g-wagon-platform-v2.webp`, `cullinan-platform-v2.webp` en `s-class-platform-v2.webp` opgeslagen, elk met `-840.webp`-variant. Werkelijke alfatransparantie is gecontroleerd; de bron-PNG's en exacte prompts staan buiten het deploypakket in `../output/car-platform-study/`. WebP-conversie behoudt de alpha. Geometrie en badges blijven gegenereerde interpretaties, niet geverifieerde voorraadkenmerken. Alleen het licht in de showroom wordt nog los toegevoegd; contactschaduw en reflectie op de sokkel zitten in het nieuwe beeld.

## Bediening en toegankelijkheid

Scrollen blijft native; er wordt geen wiel- of verticale touchscroll geblokkeerd. Pijlen, toetsen, dots, het selectiemenu en horizontale swipes gebruiken dezelfde camerastops. Aan het begin/einde blijven de knoppen binnen de ruimte. Bij stoppen lijnt de camera rustig uit; een nieuwe scrollbeweging onderbreekt dat direct.

Op mobiel zijn voorgrondpilaren, stof en blur uitgeschakeld. Reduced motion gebruikt de oorspronkelijke hero met directe modelwissels. Zonder JavaScript blijft de oorspronkelijke eerste auto zichtbaar. De naam staat in de showroom achter de auto; reflecties zijn voor hulptechnologie verborgen. Alleen de dichtstbijzijnde auto wordt als actieve auto aangekondigd.

De viewing-CTA gaat naar het formulier onder de showroom. In de fallback blijft de oorspronkelijke viewing-dialoog beschikbaar. Zonder bevestigd telefoonnummer opent het formulier geen externe bestemming en vertelt het dat er niets is verzonden. Het aangeleverde nummer is nu actief. Het formulier opent een vooringevuld **Turks** WhatsApp-conceptbericht dat expliciet zegt dat het om een conceptsite en niet om een echte galerij/boeking gaat. De bezoeker verstuurt dat zelf. Er is geen backend, opslag of automatische verzending.

## Ingevulde gegevens en openbare bronnen

Door Utku aangeleverd: **U-gallery Istanbul**, telefoon/WhatsApp **+90 501 640 1479**, conceptlocatie **Nişantaşı, Istanbul**. Geen echt bedrijf, adrespin, showroomvoorraad of boekingen worden gesuggereerd. De kaartlink toont alleen de wijk; zonder bevestigd straatadres wordt geen fysieke galerijlocatie gemarkeerd.

Technische modelreferenties gecontroleerd op 18 oktober 2026. Dit zijn gekozen uitvoeringen voor de conceptpresentatie, geen identificatie van echte auto's. Het bronjaar is de introductiespecificatie, niet het bouwjaar van een voorraadwagen. PS is metrische paardenkracht (Nederlandse pk), niet SAE hp. Alle modelgegevens en bronlinks staan in `cars.json` onder `reference`; de zichtbare drie hoofdwaarden staan onder `specs`. Een label in de hero en de EN/TR-sectie 'Model references & sources' maken die context zichtbaar.

| Referentiemodel | Vermogen | 0–100 km/h | Motor | Topsnelheid |
|---|---|---|---|---|
| [911 GT3 RS (992), introductie 2022](https://newsroom.porsche.com/en/2022/products/porsche-911-gt3-rs-world-premiere-29177.html) | 525 PS / 386 kW | 3,2 s | 4,0-liter zescilinder boxer | 296 km/h |
| [Mercedes-AMG G 63, introductie 2018](https://event.media.mercedes-benz.com/article/037b6d2e-9ce5-4029-aa98-9f7698bd6de1) | 585 PS / 430 kW | 4,5 s | 4,0-liter V8 biturbo | 220 km/h standaard |
| [Rolls-Royce Cullinan, introductie 2018](https://www.press.rolls-roycemotorcars.com/rolls-royce-motor-cars-pressclub/article/detail/T0280959EN/%3CtagLinkPrefix%3E) | 571 PS / 420 kW | TO CONFIRM | 6,75-liter V12 twin-turbo | 250 km/h begrensd |
| [Mercedes-Benz S 500 4MATIC, introductie 2020](https://media.mercedes-benz.com/article/8af2ef8e-c8bc-43d3-87d5-1d8706fd10a5) | 435 PS / 320 kW | 4,9 s | 3,0-liter lijnzes, 48V | 250 km/h |

De G 63 kan met AMG Driver's Package 240 km/h bereiken; dat wordt niet als standaardwaarde voorgesteld. Bij de S 500 is het tijdelijke EQ Boost-vermogen van 16 kW/22 PS niet bij de 435 PS opgeteld. De officiële Cullinan-introductietabel vermeldt geen 0–100-tijd; daarom blijft die geel gemarkeerd in plaats van een onbevestigd getal te tonen. De exacte Porsche-variant en de overige referentiekeuzes blijven aanpasbaar na bevestiging. De CGI-beelden zijn geen garantie van exacte uitvoering of fabrieksspecificatie.

## Nog te leveren — gele placeholders

Alles blijft een concept; ontbrekende feiten worden niet ingevuld.

- `gallery.tagline.en/tr`: `[TAGLINE]`, `[SLOGAN]`.
- Per auto: `[YEAR]`, `[MILEAGE]`, `[COLOUR]`, `[PRICE]` als voertuigspecifieke gegevens; geen fictieve voorraadfeiten invullen.
- Cullinan-acceleratie: `[TO CONFIRM]`, zolang er geen gecontroleerde officiële bron is gekoppeld.
- `gallery.streetAddress`: `[STREET ADDRESS]`. De opgegeven wijk is geen exact adres.
- `gallery.mapsEmbed`: `[GOOGLE MAPS EMBED]` blijft in de data beschikbaar voor later; nu is alleen een duidelijk gelabelde link naar de wijk zichtbaar.
- `gallery.socials`: `[INSTAGRAM URL]`, `[SOCIAL URL]`. Het zijn pas actieve links als er echte HTTPS-adressen staan.
- Definitieve beelden en bevestiging van uitvoering/gegevens en gebruiksrechten bij eventueel commercieel gebruik.

## Controle

Playwright-scripts staan buiten de deploymap: `../scripts/gallery-showroom-qa.mjs` en `gallery-showroom-extra-qa.mjs`. De oorspronkelijke screenshots/metingen staan in `../docs/car-gallery-qa/showroom/`; de nieuwe platform-integratie wordt apart vastgelegd in `../docs/car-gallery-qa/platform-showroom/` via `--platform`. De beeldcontrole bevat ook de afwezigheid van een dubbele sokkel/spiegeling bij alle twaalf focusstops. De hieronder genoemde frametijden zijn van vóór deze assetwijziging en zijn niet opnieuw als performancecertificering gebruikt.

De vijf gevraagde voortgangspunten (0, .25, .5, .75, 1) zijn op 1440×900, 768×900 en 390×844 vastgelegd, met automatisch snap tijdelijk uitgeschakeld om de exacte tussenposities te kunnen beoordelen. Daarnaast zijn alle vier de focusstops op de drie formaten gecontroleerd: 27 geometriecontroles geslaagd, nul console-/netwerkfouten in deze test. Dit is herhaald voor de nieuwe platformrenders, plus 20 controles van camerastanden/snap in de functionele suite. Tijdens de rit lopen de vorige/volgende auto’s vanzelf buiten het kader; bij iedere focusstop staat de volledige auto met sokkel in beeld, vrij van de navigatie. De modelnaam staat achter de auto. In de nieuwe render zit de reflectie op het platform zelf; de eerdere losse spiegeling onder de grondlijn is uitgeschakeld.

Ook uitlijnen, EN/TR, formulierfouten, ontbrekende contactgegevens, toetsen, swipes, fallback en groei met een extra auto worden apart gecontroleerd. Deze lokale conceptcontrole vervangt geen volledige launch-audit of controle op een live Netlify-domein.

De contentupdate is met `../scripts/gallery-content-qa.mjs` apart getest op 390, 768 en 1440 px: alle vier de modelwaarden, volledige auto/sokkel, geen tekstoverflow, bronlinks, EN/TR, telefoonlink, formuliervalidatie en Turkse WhatsApp-concepttekst; ook reduced motion en no-JS. Resultaten en screenshots staan in `../docs/car-gallery-qa/content-v3/`. De test onderschept `window.open` lokaal: er zijn geen namen/berichten naar WhatsApp gestuurd. De oorspronkelijke showroom-QA onderschept externe conceptlinks nu ook.

### Scrollmetingen en open beperking

Dezelfde volledige scroll is tweemaal gemeten met Playwright/Edge. De oudere conceptversie had in de eerste test 2,02% frames boven 20 ms op desktop en 20,06% met 4× CPU-vertraging op mobiel. Daarna zijn mobiele lagen vereenvoudigd en is een dubbele animatielus tijdens programmagestuurde navigatie verholpen.

| Definitieve meting | p95 frametijd, twee runs | Frames >20 ms, twee runs | Langste taken |
|---|---|---|---|
| 1440 px, normale CPU | 16,8 / 16,8 ms | 0,17% / 0,17% | Geen gemeten taken ≥50 ms |
| 390 px, normale CPU | 16,9 / 16,9 ms | 0% / 0% | Geen gemeten taken ≥50 ms |
| 390 px, 4× CPU-vertraging | 33,5 / 17,0 ms | 15,66% / 4,01% | 140 / 133 ms |

Normaal loopt de scène dus rond 60 fps, maar de strenge launch-budgetten zijn **niet volledig gehaald**: desktop heeft één frame >20 ms per run en de mobiele 4× stresstest overschrijdt zowel de grens van 2% langzame frames als die van 100 ms per taak. Dit blijft een open performancepunt vóór een productie-launch; de grote variatie tussen runs is geen bewijs van een geslaagde stresstest. Er is geen volledige Lighthouse/CWV- of live-host-audit uitgevoerd. Ruwe resultaten: `fps-normal-results.json`, `fps-results.json` en `final-results.json` in de QA-map buiten het ZIP-pakket.

## Zip en Netlify

Het nieuwe opleverpakket staat naast de projectmap als `u-gallery-istanbul-v3.zip`. De eerdere showroom-/platform-ZIP-bestanden blijven bewaard als oude versies. Zelf opnieuw maken vanuit deze map (kies een nieuwe bestandsnaam als je een eerdere versie wilt bewaren):

```powershell
tar.exe -a -c -f ../u-gallery-istanbul-v3.zip index.html css js assets cars.json README.md _headers
```

Gebruik op Windows `tar.exe`, niet `Compress-Archive`, zodat de zip forward-slash-paden heeft. `index.html` moet bovenin de zip staan, niet in een extra projectmap. QA-screenshots en ontwikkelscripts hoeven niet mee.

Upload het pakket of de uitgepakte map via Netlify Drop / de Deploys-tab van je site. Geen build command, npm-installatie of publicatiestap nodig. De site blijft met `noindex` als concept gemarkeerd. Na upload: controleer beide talen, alle stops, mobiele layout, console en contactgedrag op de live URL. Een echte deploy is in deze opdracht niet uitgevoerd.
