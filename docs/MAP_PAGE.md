# MapPage – kartlogikk og struktur i VærVarselet

Dette dokumentet beskriver hvordan `MapPage` er bygd opp, og hvilke arkitekturvalg som er gjort rundt kartfunksjonaliteten i VærVarselet.

`MapPage` er en av de mest sentrale og komplekse sidene i appen. Den kombinerer kartvisning, lokasjon, værpunkter, highlight av geografiske områder, kartlag og vær-layers i én samlet visning. Derfor er det også naturlig at kartsiden har en tydelig struktur og en egen ViewModel som samler presentasjonslogikken.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-hva-mappage-er">Hva MapPage er</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-hvorfor-mappage-er-en-egen-side">Hvorfor MapPage er en egen side</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-ansvarsområder">Ansvarsområder</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-mappageviewmodel">MapPageViewModel</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-viktige-tilstander-i-kartet">Viktige tilstander i kartet</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-highlight-og-geometri">Highlight og geometri</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-værpunkter-og-synlige-punkter">Værpunkter og synlige punkter</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-kartlag-og-vær-layers">Kartlag og vær-layers</a></td>
    </tr>
    <tr>
        <td>9</td>
        <td><a href="#9-lokasjonshåndtering">Lokasjonshåndtering</a></td>
    </tr>
    <tr>
        <td>10</td>
        <td><a href="#10-map-target-og-kamerastyring">Map target og kamerastyring</a></td>
    </tr>
    <tr>
        <td>11</td>
        <td><a href="#11-state-hoisting-og-felles-lokasjon">State hoisting og felles lokasjon</a></td>
    </tr>
    <tr>
        <td>12</td>
        <td><a href="#12-hvorfor-denne-strukturen">Hvorfor denne strukturen</a></td>
    </tr>
    <tr>
        <td>13</td>
        <td><a href="#13-utfordringer-og-begrensninger">Utfordringer og begrensninger</a></td>
    </tr>
    <tr>
        <td>14</td>
        <td><a href="#14-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Hva MapPage er

`MapPage` er siden i applikasjonen som samler all kartrelatert funksjonalitet.

Mens andre sider i appen primært viser værdata som tekst, kort eller grafer, presenterer `MapPage` data i en geografisk kontekst. Dette gjør det mulig å se hvor et sted ligger, hvilke områder varsler gjelder for, hvilke punkter som er synlige i kartutsnittet, og hvordan værdata kan kobles til faktiske koordinater og områder.

`MapPage` er derfor mer enn bare en “kartvisning”. Den fungerer som et eget arbeidsområde for lokasjonsbasert presentasjon av data.

---

# 2. Hvorfor MapPage er en egen side

Kartfunksjonalitet har ofte en annen type kompleksitet enn vanlig UI.

På en kartsiden må systemet typisk forholde seg til:

- zoomnivå
- viewport-bounds
- kameramål og navigasjon
- markører
- geometri
- synlige punkter
- kartlag
- vær-layers
- device location
- manuell lokasjonsendring

Hvis alt dette hadde vært blandet inn i andre pages eller generelle komponenter, ville løsningen fort blitt vanskelig å lese og vedlikeholde.

Ved å samle denne funksjonaliteten i `MapPage` og `MapPageViewModel`, får kartet sitt eget tydelige ansvarsområde i arkitekturen.

---

# 3. Ansvarsområder

`MapPage` har ansvar for å presentere og styre kartrelatert funksjonalitet i appen.

Typiske ansvarsområder er:

- visning av kart
- bytte mellom kartlag
- visning av markører
- visning av synlige kartpunkter
- vær-layers via MapTiler Weather
- highlight av geografiske områder
- visning av geometridata
- reset til device location
- navigasjon til aktiv lokasjon
- oppdatering av kartkamera og map target

Dette gjør `MapPage` til en side som kombinerer både visuell presentasjon og mye interaktiv logikk.

---

# 4. MapPageViewModel

`MapPageViewModel` fungerer som presentasjonslogikken for kartsiden.

Den er implementert som en custom hook og samler UI-state, handlers og utledet kartlogikk på ett sted. Dette gjør at selve `MapPage` i større grad kan fokusere på rendering og komposisjon av komponenter.

## 4.1 Typiske ansvarsområder i ViewModelen

`MapPageViewModel` har typisk ansvar for:

- kartets UI-state
- nåværende zoomnivå
- viewport-bounds
- aktive værpunkter
- highlight-geometri
- valg av kartlag
- toggling av markører
- reset-logikk
- håndtering av synlige punkter i kartutsnittet
- samspill mellom aktiv lokasjon og kamerastyring

## 4.2 Hvorfor dette ligger i ViewModel

Dette er logikk som er tett koblet til brukergrensesnittet, men som ikke bør ligge direkte i komponentene som rendrer kartet.

Ved å legge denne logikken i ViewModelen blir det lettere å:

- lese komponenthierarkiet
- teste presentasjonslogikk mer isolert
- holde kartsiden mer ryddig
- endre kartoppførsel uten å spre logikk utover mange komponenter

---

# 5. Viktige tilstander i kartet

Kartsiden har flere tilstander som må holdes synkronisert.

Noen av de viktigste er:

- aktiv lokasjon
- device location
- highlight state
- værpunkter
- synlige kartpunkter
- viewport-bounds
- valgt kartlag
- om markører skal vises sammen med valgt lag
- zoomnivå
- map target

Disse tilstandene beskriver ikke bare *hva* som skal vises, men også *hvordan* kartet skal oppføre seg.

## 5.1 Hvorfor dette er viktig

I en vanlig side kan state ofte være enkel og lokal. På en kartsiden må flere tilstander spille sammen samtidig.

Et eksempel er:

- brukeren velger en lokasjon
- kartet navigerer til riktig område
- geometri lastes inn dersom stedet er et område
- relevante værpunkter vises
- viewport endres
- nye synlige punkter fører til oppdatering av værdata

Det er nettopp dette som gjør `MapPage` mer kompleks enn mange andre pages.

---

# 6. Highlight og geometri

En sentral del av `MapPage` er støtte for highlight av områder og visning av geometri.

Dette brukes når den aktive lokasjonen ikke bare er et punkt, men et område med en faktisk geografisk utstrekning.

## 6.1 Hva highlight brukes til

Highlight brukes for å:

- visualisere valgt område i kartet
- tydeliggjøre hvilket geografisk objekt som er valgt
- koble stedssøk og kartpresentasjon sammen
- gi brukeren en geografisk forståelse av lokasjonen

## 6.2 Samspill med geometri

Når valgt lokasjon representerer et område, kan geometridata hentes inn og brukes til:

- tegning av polygon eller annen geometri
- utregning av bounds
- kameratilpasning
- kontroll av om området fortsatt er synlig i viewport

## 6.3 Hvorfor dette er nyttig

Dette gjør det mulig å skille mellom:

- rene punktlokasjoner
- områdelokasjoner
- kartvisning som skal sentrere på et punkt
- kartvisning som skal tilpasses et helt område

---

# 7. Værpunkter og synlige punkter

Kartet forholder seg ikke bare til én valgt lokasjon, men også til en samling punkter som er synlige i det gjeldende kartutsnittet.

Dette er viktig fordi kartet ofte skal vise værinformasjon for flere steder samtidig.

## 7.1 Synlige kartpunkter

Når brukeren panorerer eller zoomer i kartet, endrer det hvilke punkter som er synlige.

Disse punktene brukes som grunnlag for:

- hvilke markører som skal vises
- hvilke værdata som skal lastes
- hvilke deler av kartet som er relevante akkurat nå

## 7.2 Værpunkter

Basert på de synlige punktene kan appen hente værdata som brukes til å vise værrelatert informasjon direkte i kartvisningen.

Dette gjør kartet mer dynamisk og relevant for det utsnittet brukeren faktisk ser på.

## 7.3 Debouncing og oppdateringskontroll

Fordi kartet kan endres svært ofte ved zoom og panorering, er det viktig å unngå unødvendig hyppige kall. Derfor er det naturlig at logikken bruker debouncing eller lignende strategier for å vente litt før nye værdata hentes.

Dette gjør løsningen mer effektiv og reduserer belastningen på både UI og datakilder.

---

# 8. Kartlag og vær-layers

`MapPage` støtter både vanlige kartlag og værvisualiseringer.

## 8.1 Kartlag

Kartlag brukes for å endre hvordan bakgrunnskartet eller tilleggsinformasjon presenteres.

Dette kan være nyttig for å:

- skifte fokus mellom ulike kartvisninger
- redusere visuelt støy
- kombinere eller skjule enkelte typer informasjon

## 8.2 Vær-layers

I tillegg brukes vær-layers fra **MapTiler Weather** for å vise animert eller geografisk værinformasjon direkte i kartet.

Dette gir brukeren en annen type innsikt enn vanlig forecast-visning, fordi været presenteres som et lag over kartet.

## 8.3 Markører og lag

Kartet kan også ha logikk for om markører skal vises samtidig som et valgt lag. Dette er viktig fordi noen kartvisninger blir mer lesbare når markører skjules, mens andre fungerer best når de beholdes.

---

# 9. Lokasjonshåndtering

`MapPage` er tett knyttet til hvordan lokasjon håndteres i appen.

Kartet må kunne forholde seg til flere ulike typer lokasjonskilder:

- enhetens posisjon
- manuelt valgt lokasjon
- beriket lokasjon med navn og metadata
- områdebasert lokasjon med geometri

## 9.1 Enhetens posisjon

Brukeren kan velge å bruke device location som grunnlag for kartet. Da må kartsiden kunne:

- navigere til denne lokasjonen
- resette tilbake til den
- skille den fra manuelt valgt sted

## 9.2 Manuelt valgt lokasjon

Når brukeren velger et sted via søk eller annen interaksjon, må kartet kunne oppdatere seg til dette stedet uten å miste sammenhengen med resten av appen.

## 9.3 Beriket lokasjon

Lokasjon er ikke bare koordinater. Den kan også inneholde:

- navn
- bounds
- type
- countryCode
- tidssone
- id

Dette gjør det mulig for kartet å reagere ulikt avhengig av hva slags lokasjon som er valgt.

---

# 10. Map target og kamerastyring

En viktig del av kartlogikken er å bestemme *hvor* kartet skal navigere, og *hvordan* kameraet skal oppføre seg.

Dette kan beskrives som kartets “måltilstand”, ofte representert som et `mapTarget`.

## 10.1 Hva map target brukes til

`mapTarget` brukes til å beskrive hvordan kartet skal navigere basert på aktuell tilstand, for eksempel:

- valgt punktlokasjon
- valgt områdelokasjon
- geometri-bounds
- reset til device location

## 10.2 Hvorfor dette er nyttig

Ved å skille ut kartets måltilstand i en egen utledet struktur, blir det lettere å kontrollere:

- når kartet faktisk skal flytte seg
- når det ikke skal flytte seg
- hvordan reset og ny lokasjon skal påvirke kamerat
- hvordan geometri påvirker zoom og utsnitt

## 10.3 Forholdet mellom kart og state

Kartet er i praksis en visuell representasjon av tilstand. Derfor er kamerastyring ikke bare en visuell detalj, men en viktig del av appens presentasjonslogikk.

---

# 11. State hoisting og felles lokasjon

`MapPage` fungerer ikke isolert. Den deler lokasjonsgrunnlag med resten av applikasjonen.

Dette betyr at aktiv lokasjon ofte løftes opp til et høyere nivå, slik at flere sider kan bruke samme informasjon.

## 11.1 Hva dette gjør mulig

Dette gjør det mulig at:

- `MapPage` viser samme sted som `ForecastPage`
- `GraphPage` bruker samme lokasjon og tidssone
- `AlertPage` kan tolke samme område eller geografiske kontekst
- søk og manuell lokasjonsendring slår gjennom i hele appen

## 11.2 Hvorfor dette er viktig

Uten en delt lokasjonstilstand kunne ulike pages lett havnet i utakt, slik at én side viste ett sted mens en annen viste noe annet.

Ved å bruke state hoisting og en tydelig single source of truth, blir appens oppførsel mer konsistent og lettere å forstå.

---

# 12. Hvorfor denne strukturen

Kartfunksjonalitet blir fort kompleks. Derfor er det viktig å strukturere den slik at ansvar ikke blandes unødvendig sammen.

Denne løsningen forsøker å oppnå følgende:

- `MapPage` fokuserer på UI og komposisjon
- `MapPageViewModel` samler presentasjonslogikk og state
- modellaget håndterer datatilgang og transformasjon
- delt lokasjon løftes opp der det gir mening

Dette gjør at kartsiden passer inn i resten av appens MVVM-inspirerte struktur i stedet for å bli et spesialtilfelle med helt egne mønstre.

---

# 13. Utfordringer og begrensninger

Selv med god struktur vil en kartside ofte være en av de mest komplekse delene av en applikasjon.

Noen naturlige utfordringer er:

- mange samtidige tilstander
- tett kobling mellom interaksjon og data
- hyppige viewport-endringer
- behov for kontrollert oppdatering av værdata
- høy visuell og teknisk kompleksitet i samme side

Dette betyr at `MapPageViewModel` naturlig kan bli større enn ViewModels for enklere sider.

Det er ikke nødvendigvis et tegn på dårlig design, men heller på at kartsiden faktisk bærer mer funksjonelt ansvar enn andre sider.

Samtidig er det viktig å fortsette å refaktorere og dele opp logikken dersom én ViewModel blir for omfattende.

---

# 14. Oppsummering

`MapPage` er siden som samler kart, lokasjon, geometri, værpunkter, kartlag og kamerastyring i én helhetlig visning.

Den er strukturert slik at:

- kartet får sitt eget tydelige ansvarsområde
- presentasjonslogikken samles i `MapPageViewModel`
- lokasjon og kartoppførsel kan holdes konsistent med resten av appen
- kompleksiteten håndteres innenfor samme MVVM-inspirerte struktur som resten av prosjektet

Dette gjør kartsiden lettere å forstå, teste og videreutvikle enn om kartlogikken skulle vært spredt rundt i mange ulike komponenter og filer.