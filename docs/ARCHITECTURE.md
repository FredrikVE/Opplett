# Arkitektur – VærVarselet

Dette dokumentet beskriver hvordan VærVarselet er strukturert, og hvilke arkitekturvalg som er gjort i prosjektet.

Prosjektet er bygget som en **MVVM-inspirert React-applikasjon**, der målet har vært å skape en tydelig ansvarsdeling mellom presentasjon, UI-logikk og datalogikk. Arkitekturen er ikke ment som en rigid eller “ren” enterprise-struktur, men som en pragmatisk måte å organisere en app som kombinerer værdata, kart, søk, lokasjon, geometri og visualisering.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-arkitektonisk-retning">Arkitektonisk retning</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-lagdeling-i-prosjektet">Lagdeling i prosjektet</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-model">Model</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-viewmodel">ViewModel</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-view">View</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-appjsx-som-komposisjonsrot">App.jsx som komposisjonsrot</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-dataflyt-og-tilstandsmodell">Dataflyt og tilstandsmodell</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-hvorfor-mvvm-i-dette-prosjektet">Hvorfor MVVM i dette prosjektet</a></td>
    </tr>
    <tr>
        <td>9</td>
        <td><a href="#9-designprinsipper">Designprinsipper</a></td>
    </tr>
    <tr>
        <td>10</td>
        <td><a href="#10-fordeler-og-begrensninger">Fordeler og begrensninger</a></td>
    </tr>
    <tr>
        <td>11</td>
        <td><a href="#11-forenklet-mappestruktur">Forenklet mappestruktur</a></td>
    </tr>
    <tr>
        <td>12</td>
        <td><a href="#12-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Arkitektonisk retning

VærVarselet er strukturert etter en **MVVM-inspirert arkitektur**:

- **Model** håndterer data, transformasjon og use cases
- **ViewModel** håndterer UI-tilstand og presentasjonslogikk
- **View** håndterer rendering og brukergrensesnitt

Denne strukturen er valgt fordi appen har flere deler som lett kan føre til økt kompleksitet dersom alt legges direkte i React-komponentene:

- værvarsel
- stedssøk
- kartvisning
- geometridata
- farevarsler
- grafer
- delt lokasjonsstate

Målet har derfor vært å skille mellom:

- **hvordan data hentes og bearbeides**
- **hvordan data presenteres og styres i UI**
- **hvordan komponentene rendres**

---

# 2. Lagdeling i prosjektet

Prosjektet kan forstås som delt i tre hovedlag:

<table>
    <tr>
        <th>Lag</th>
        <th>Ansvar</th>
    </tr>
    <tr>
        <td>Model</td>
        <td>Kommunikasjon med datakilder, transformasjon av rådata og orkestrering av applikasjonslogikk.</td>
    </tr>
    <tr>
        <td>ViewModel</td>
        <td>Tilstand og presentasjonslogikk for pages og UI-flyt.</td>
    </tr>
    <tr>
        <td>View</td>
        <td>React-komponenter som viser data og reagerer på brukerinteraksjon.</td>
    </tr>
</table>

Denne oppdelingen er ikke bare kosmetisk. Den brukes for å holde presentasjonslaget renere og for å gjøre logikken lettere å teste, vedlikeholde og videreutvikle.

---

# 3. Model

Model-laget består hovedsakelig av tre deler:

- **Datasource**
- **Repository**
- **UseCases / domain**

## 3.1 Datasource

Datasource-laget har ansvar for kommunikasjon med eksterne API-er og tjenester.

Dette laget vet hvordan data skal hentes, men har ikke som hovedoppgave å gjøre dataene klare for visning i UI. Det handler først og fremst om innlesing.

Typiske oppgaver i datasource-laget:

- sende requests til API-er
- motta JSON-data
- håndtere responsformat fra eksterne tjenester

Datasource-laget fungerer som prosjektets “inngangsport” til eksterne datakilder.

---

## 3.2 Repository

Repository-laget sitter mellom datasource og resten av systemet.

Her transformeres og struktureres rådata til et format som er mer stabilt og hensiktsmessig for resten av applikasjonen. Repository-laget brukes for å skjerme UI og ViewModels fra detaljer i API-responsene.

Typiske oppgaver i repository-laget:

- mapping av rådata
- strukturering av objekter
- normalisering av data
- eventuell filtrering og forenkling av respons

Dette gjør at resten av appen slipper å kjenne til detaljer om hvordan et spesifikt API returnerer data.

---

## 3.3 UseCases / domain

UseCases representerer eksplisitte handlinger i applikasjonen.

I stedet for at komponenter eller ViewModels selv må vite hvordan alle avhengigheter skal kobles sammen, brukes use cases som et eget lag for applikasjonslogikk.

Eksempler på typiske use cases i prosjektet:

- hente værdata for en lokasjon
- hente geometri for et område
- søke etter steder
- hente varsler
- hente værpunkter til kart
- hente eller berike lokasjonsnavn

Dette gir en mer eksplisitt og lesbar modell av hva applikasjonen faktisk gjør.

---

# 4. ViewModel

ViewModel-laget består av custom hooks som representerer logikken for hver page eller funksjon.

Eksempler:

- `ForecastPageViewModel`
- `GraphPageViewModel`
- `AlertPageViewModel`
- `MapPageViewModel`

ViewModel-laget har ansvar for:

- UI-state
- loading-tilstander
- presentasjonslogikk
- samspill mellom brukerhandlinger og use cases
- transformasjon av data til noe View-laget kan rendre

En ViewModel skal i utgangspunktet ikke hente data direkte fra API-er. Den bør heller bruke use cases eller abstraherte lag i modellen.

## 4.1 Hvorfor custom hooks

I React er custom hooks en naturlig måte å implementere ViewModel-laget på. De gjør det mulig å:

- kapsle inn logikk
- dele logikk mellom komponenter
- holde page-komponentene renere
- samle state og handlers i én struktur

Dette passer godt med MVVM-tankegangen, selv om React ikke har et innebygd ViewModel-begrep på samme måte som enkelte andre plattformer.

---

# 5. View

View-laget består av React-komponenter og pages.

Her ligger det som rendres til brukeren:

- pages
- underkomponenter
- layout
- visuelle kontroller
- presentasjon av state fra ViewModels

View-laget bør i størst mulig grad være fokusert på:

- rendering
- komposisjon av komponenter
- mottak av props
- kall til handlers fra ViewModel

View-komponentene skal ideelt sett inneholde minst mulig tung logikk.

## 5.1 Typisk struktur

- `src/ui/view/pages` – toppnivå-pages
- `src/ui/view/components` – mindre, gjenbrukbare eller page-spesifikke komponenter

Dette gjør det enklere å skille mellom:
- selve siden
- byggeklossene som siden er satt sammen av

---

# 6. App.jsx som komposisjonsrot

`App.jsx` fungerer som prosjektets komposisjonsrot.

Det betyr at den har ansvar for å:

- sette sammen sentrale avhengigheter
- koble pages til felles state
- holde delt tilstand som flere deler av appen trenger

Et viktig eksempel er **aktiv lokasjon**, som fungerer som en felles kilde til sannhet for flere deler av appen.

Når aktiv lokasjon løftes opp hit, kan flere sider bruke samme grunnlag:

- forecast
- grafer
- kart
- varsler

Dette reduserer risikoen for at ulike deler av appen kommer ut av synk.

---

# 7. Dataflyt og tilstandsmodell

Arkitekturen forsøker å støtte en mest mulig tydelig og forutsigbar dataflyt.

En forenklet flyt kan beskrives slik:

```text
Brukerinteraksjon
→ View
→ ViewModel
→ UseCase
→ Repository
→ Datasource
→ Ekstern tjeneste

Respons tilbake:
Ekstern tjeneste
→ Datasource
→ Repository
→ UseCase
→ ViewModel
→ View
````

## 7.1 State hoisting

Et viktig prinsipp i prosjektet er at delt state løftes opp til et passende nivå når flere deler av UI-et trenger samme informasjon.

Eksempler på dette kan være:

* aktiv lokasjon
* device location
* valgt sted etter søk
* tidssone knyttet til lokasjon

Ved å løfte state opp unngår man at hver page eller komponent lager sine egne konkurrerende sannheter.

## 7.2 Single source of truth

Prosjektet forsøker å bruke tydelige “single sources of truth” for viktige domener, spesielt:

* aktiv lokasjon
* tilhørende koordinater
* tilhørende tidssone

Dette gjør det enklere å sikre konsistent oppførsel på tvers av forecast, kart og grafvisning.

---

# 8. Hvorfor MVVM i dette prosjektet

MVVM er valgt fordi prosjektet raskt fikk flere typer logikk som ikke passer naturlig direkte inn i UI-komponenter:

* API-orkestrering
* lokasjonshåndtering
* kartinteraksjon
* geometri og highlight-logikk
* presentasjonslogikk for værdata
* synkronisering mellom sider

Dersom alt dette legges direkte i React-komponentene, blir resultatet fort:

* større komponenter
* blanding av rendering og logikk
* dårligere oversikt
* vanskeligere testing
* høyere kognitiv kompleksitet

Ved å bruke en MVVM-inspirert struktur blir det enklere å dele opp ansvaret.

---

# 9. Designprinsipper

Prosjektet forsøker å følge noen overordnede prinsipper:

## 9.1 Tydelig ansvarsdeling

Hvert lag skal ha et tydelig formål:

* datasources henter
* repositories transformerer
* use cases orkestrerer
* viewmodels styrer UI-logikk
* view rendrer

## 9.2 Høy kohesjon

Kode som hører naturlig sammen, forsøkes samlet samme sted.

Eksempel:

* kartrelatert logikk samles rundt `MapPage`
* tidssoneformattering samles i egne utilities
* page-spesifikk presentasjonslogikk samles i tilhørende ViewModel

## 9.3 Lavere kobling

Selv om full lav kobling ikke alltid er realistisk i et prosjekt med delt UI-state og kompleks kartlogikk, forsøker strukturen å redusere unødvendige avhengigheter mellom komponenter og lag.

## 9.4 Pragmatisk modularisering

Målet er ikke maksimal abstraksjon for abstraksjonens skyld, men å gjøre prosjektet mer forståelig og lettere å arbeide videre med.

---

# 10. Fordeler og begrensninger

## 10.1 Fordeler

Denne arkitekturen gir flere fordeler:

* tydeligere struktur
* renere komponenter
* enklere videreutvikling
* bedre testbarhet
* lettere å isolere presentasjonslogikk
* lettere å gjenbruke mønstre på tvers av pages

## 10.2 Begrensninger

Samtidig finnes det noen naturlige begrensninger:

* arkitekturen gir mer struktur, men også flere filer
* noen ViewModels kan fortsatt bli store dersom siden har mye ansvar
* kartsider har ofte naturlig høy kompleksitet
* pragmatisk MVVM i React er ikke et “innebygd” mønster, så konsistens må opprettholdes bevisst

Dette betyr at arkitekturen må vedlikeholdes aktivt for å fortsette å være nyttig.

---

# 11. Forenklet mappestruktur

```bash
.
├── README.md
├── docs
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── PAGES.md
│   ├── MAP_PAGE.md
│   ├── TIMEZONES.md
│   ├── TESTING.md
│   └── CREDITS.md
├── public
├── src
│   ├── model
│   │   ├── datasource
│   │   ├── domain
│   │   └── repositories
│   └── ui
│       ├── hooks
│       ├── utils
│       ├── view
│       │   ├── components
│       │   └── pages
│       └── viewmodel
└── test
```

---

# 12. Oppsummering

VærVarselet er bygget med en MVVM-inspirert struktur for å håndtere et prosjekt som kombinerer værdata, kart, stedssøk, lokasjon, tidssoner og visualisering.

Arkitekturvalget er gjort for å:

* redusere kompleksitet i UI-laget
* gjøre ansvarsdelingen tydeligere
* gi bedre struktur for videre arbeid
* gjøre logikk lettere å teste og vedlikeholde

Dette er ikke full Domain-Driven Design eller et rigid rammeverk, men en bevisst og pragmatisk struktur som passer prosjektets behov.
