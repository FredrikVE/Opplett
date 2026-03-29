# Testing – VærVarselet

Dette dokumentet beskriver hvordan testing er tenkt organisert i VærVarselet, hva som bør testes, og hvordan testene kan kjøres i et lokalt utviklingsmiljø.

Prosjektet er bygget med en MVVM-inspirert struktur, og denne oppdelingen gjør det lettere å teste ulike typer logikk mer isolert. Spesielt gjelder dette modellaget og ViewModel-laget, siden mye av logikken er flyttet ut av UI-komponentene.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-hvorfor-testing-er-viktig-i-dette-prosjektet">Hvorfor testing er viktig i dette prosjektet</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-hva-som-bør-testes">Hva som bør testes</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-testing-av-model-laget">Testing av Model-laget</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-testing-av-viewmodels">Testing av ViewModels</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-testing-av-view-og-ui">Testing av View og UI</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-teststruktur">Teststruktur</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-kjøre-tester">Kjøre tester</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-praktiske-testmål">Praktiske testmål</a></td>
    </tr>
    <tr>
        <td>9</td>
        <td><a href="#9-begrensninger-og-prioriteringer">Begrensninger og prioriteringer</a></td>
    </tr>
    <tr>
        <td>10</td>
        <td><a href="#10-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Hvorfor testing er viktig i dette prosjektet

VærVarselet kombinerer flere typer funksjonalitet i samme applikasjon:

- værdata
- stedssøk
- lokasjonshåndtering
- tidssonelogikk
- kart og geometri
- farevarsler
- grafvisualisering

Når en app kombinerer flere slike domener, blir det viktig å teste logikken som kobler dem sammen. Testing er spesielt nyttig for å oppdage feil i:

- mapping av rådata
- presentasjonslogikk
- tidssonehåndtering
- lokasjonsbasert oppførsel
- state-avhengig UI-logikk

Siden prosjektet er strukturert med tydeligere lagdeling, er det også lettere å teste logikk uten å måtte rendre hele appen for hver verifisering.

---

# 2. Hva som bør testes

I prosjektet er det særlig tre nivåer som er naturlige å teste:

- **Model-laget**
- **ViewModel-laget**
- **View / UI-laget**

Disse har ulike testbehov.

<table>
    <tr>
        <th>Lag</th>
        <th>Hva som typisk testes</th>
    </tr>
    <tr>
        <td>Model</td>
        <td>Rådata, mapping, transformasjon, use cases og datalogikk.</td>
    </tr>
    <tr>
        <td>ViewModel</td>
        <td>UI-state, handlers, loading-state og presentasjonslogikk.</td>
    </tr>
    <tr>
        <td>View</td>
        <td>Rendering, props, conditional rendering og enkel brukerinteraksjon.</td>
    </tr>
</table>

Det er vanlig at mesteparten av testverdien ligger i Model og ViewModel, siden det ofte er der den mest kritiske logikken bor.

---

# 3. Testing av Model-laget

Model-laget består av datasources, repositories og use cases. Dette er ofte det viktigste laget å teste fordi det håndterer dataflyt og transformasjon.

## 3.1 Datasources

Datasources kan testes for å verifisere at:

- riktige kall gjøres mot eksterne tjenester
- respons håndteres riktig
- feiltilstander håndteres kontrollert

I praksis vil man ofte mocke nettverkslag eller eksterne kall i slike tester.

## 3.2 Repositories

Repositories er spesielt godt egnet for testing fordi de ofte:

- mapper rådata
- normaliserer struktur
- skjuler API-spesifikke detaljer
- bygger opp mer stabile objekter for resten av appen

Typiske tester kan verifisere:

- at inputdata blir transformert riktig
- at manglende felter håndteres robust
- at feil eller tomme responser ikke ødelegger resten av flyten

## 3.3 UseCases

UseCases bør testes for å sikre at applikasjonslogikken er riktig.

Typiske testmål:

- at riktig repository brukes
- at riktig input sendes videre
- at riktig resultat returneres
- at use casen oppfører seg korrekt ved spesialtilfeller eller feil

Dette er nyttig fordi use cases ofte representerer selve “handlingene” i appen.

---

# 4. Testing av ViewModels

ViewModels er et naturlig testpunkt i en MVVM-inspirert applikasjon.

Siden mye UI-logikk ligger her, kan testene fokusere på oppførsel uten å måtte teste hele komponenttreet samtidig.

## 4.1 Hva som er naturlig å teste

Typiske ting å teste i ViewModels er:

- initial state
- loading-state
- state-overganger
- handlers
- utledede verdier
- hvordan data fra use cases transformeres til UI-vennlig form

## 4.2 Eksempler på relevant logikk

Eksempler på logikk som ofte er verdt å teste:

- hvordan forecast-data presenteres
- hvordan grafer bygges opp fra rådata
- hvordan varsler filtreres eller velges
- hvordan `MapPageViewModel` håndterer highlight, viewport og reset
- hvordan aktiv lokasjon påvirker resten av state

## 4.3 Hvorfor dette laget er viktig

ViewModels ligger tett på brukeropplevelsen. Feil her gir ofte:

- feil rendering
- feil brukerflyt
- inkonsistent state
- uventet oppførsel i pages

Derfor gir det ofte høy verdi å teste dette laget grundig.

---

# 5. Testing av View og UI

View-laget kan også testes, men testene her bør vanligvis være mer fokusert på rendering og enkel interaksjon enn på intern logikk.

## 5.1 Hva som typisk testes i UI

Typiske UI-tester kan verifisere:

- at riktige komponenter vises
- at riktig tekst eller label rendres
- at conditional rendering fungerer
- at knapper eller enkle handlers trigges som forventet
- at komponenter reagerer riktig på props

## 5.2 Hva som helst bør unngås

Det er ofte mindre nyttig å teste detaljer som er for tett koblet til implementasjon, som for eksempel:

- intern struktur i komponenttrær uten brukerrelevans
- for mange snapshots
- logikk som egentlig burde være testet i ViewModel eller Model

Målet er at UI-testene skal støtte opp under brukeropplevelsen, ikke låse implementasjonen unødvendig hardt.

---

# 6. Teststruktur

Prosjektet har en egen `test`-mappe for testing av ulike deler av appen.

En forenklet teststruktur kan for eksempel se slik ut:

```bash id="ily7rr"
test
├── model
│   ├── datasource
│   ├── repositories
│   └── domain
└── ui
    ├── viewmodel
    └── view
````

Dette speiler i stor grad hvordan prosjektet er delt opp ellers, og gjør det lettere å finne relevante tester.

## 6.1 Hvorfor samme struktur er nyttig

Når testmappene ligner på produksjonskoden, blir det lettere å:

* finne riktige tester
* forstå hva en test hører til
* holde vedlikeholdet ryddig
* utvide testdekningen gradvis

---

# 7. Kjøre tester

Hvordan tester kjøres avhenger av hvilket testoppsett prosjektet faktisk bruker.

Vanlige kommandoer kan være:

```bash
npm test
```

eller:

```bash id="ek3d6s"
npm run test
```

Dersom prosjektet bruker Vite/Vitest, vil det ofte være `npm run test` som er mest naturlig.

## 7.1 Før du kjører tester

Sørg for at prosjektets avhengigheter er installert:

```bash id="lyndmb"
npm install
```

Dersom testoppsettet ikke er konfigurert ennå, kan denne dokumentasjonen likevel fungere som en beskrivelse av hvordan testene er tenkt organisert.

---

# 8. Praktiske testmål

I dette prosjektet er det særlig noen områder som gir høy verdi å teste.

## 8.1 Lokasjon og tidssone

Dette er viktig fordi feil her kan slå ut på flere sider samtidig.

Det kan være nyttig å teste:

* at riktig tidssone brukes for valgt lokasjon
* at fallback-logikk for tidssone virker
* at forecast grupperes på riktig lokal dato
* at lokasjonsbytte gir konsistent oppdatering

## 8.2 Repository-mapping

Det bør testes at rådata fra eksterne tjenester blir transformert til riktig intern struktur.

## 8.3 ViewModel-logikk

Det bør testes at:

* loading-state oppfører seg riktig
* handlers gjør det de skal
* state nullstilles eller oppdateres riktig
* presentasjonslogikken for ulike sider er stabil

## 8.4 Kartlogikk

Kartlogikk er ofte kompleks og derfor et godt sted å prioritere testing.

Relevante områder kan være:

* map target
* highlight-state
* reset til device location
* logikk for synlige værpunkter
* tilstandsendringer ved viewport-oppdatering

---

# 9. Begrensninger og prioriteringer

Som i mange prosjekter er det ikke alltid realistisk å teste absolutt alt.

Derfor er det ofte lurt å prioritere:

1. logikk med høyest kompleksitet
2. logikk som brukes på tvers av flere sider
3. logikk som håndterer data og transformasjon
4. logikk som er kritisk for brukeropplevelsen

I VærVarselet betyr dette ofte at man bør prioritere:

* repositories
* use cases
* ViewModels
* tidssone- og lokasjonslogikk
* sentrale deler av kartlogikken

UI-tester er fortsatt nyttige, men bør ofte komme etter at den underliggende logikken er testet godt.

---

# 10. Oppsummering

Testing i VærVarselet er tenkt organisert rundt den samme lagdelingen som resten av prosjektet:

* **Model** testes for dataflyt og transformasjon
* **ViewModel** testes for UI-state og presentasjonslogikk
* **View** testes for rendering og brukerrelevant oppførsel

Denne strukturen passer godt til prosjektets MVVM-inspirerte arkitektur, fordi den gjør det mulig å teste mye av logikken isolert fra selve UI-renderingen.

Målet er ikke nødvendigvis maksimal testmengde, men å få god dekning der det gir mest verdi:

* datalogikk
* lokasjon
* tidssoner
* presentasjonslogikk
* kartrelatert state og oppførsel
