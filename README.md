# Testprosjekt for å lære MVVM i React

## For å kjøre programmet

Kjør kommandoen i terminalen for å åpne en localhost devserver:

```bash
npm run dev
```

## Generell oppbygging

### Modellen i programmet
- Datasource-laget
- Repository-laget

### ViewModellen i programmet
Hver "page"/"screen" har sin egen viewmodell.
I dette tilfellet har vi foreløpig:
- HomeScreenViewModel

### View
Hver skjerm er en funksjonskomponent med suffiksen "-screen".

Alle disse finner du i mappe `src/ui/view/pages`

Hver page består av flere "componenter" som du finner i mappa `src/ui/view/components`

Hver og en av disse initieres i `App.jsx`, som er programmets `main`.

## Bruk av Highcharts

Applikasjonen bruker **Highcharts** (via `highcharts` og `highcharts-react-official`) for å visualisere værdata i grafvisningen. Highcharts brukes til å generere dynamiske og interaktive grafer for blant annet temperatur, vind, UV-indeks og solforhold. Grafkonfigurasjonene er strukturert og organisert i egne konfigurasjons- og hjelpefiler for å holde View-komponentene rene og fokusert på presentasjon.


## Håndtering av tidssoner og lokasjon

Applikasjonen er designet for å være geografisk agnostisk. All værdata fra MET leveres i `zulu-tid`, eller UTC (`...Z`), og denne verdien beholdes uendret gjennom hele datastrømmen. Konvertering til lokal tid skjer deterministisk ved bruk av IANA-tidssoner.

### Datastrøm og datastruktur

#### 1. Rådata fra MET

Data hentes fra `LocationForecast/2.0` og lagres som `timeISO` uten modifikasjon:

```js
{
  time: "2026-03-02T17:00:00Z", // UTC beholder 'Z' for zulutid
  data: { ... }
}

```

#### 2. Lokasjon og tidssone (SSOT)

Ved søk returnerer `MapTilerRepository` et lokasjonsobjekt med en eksplisitt tidssone. Denne lagres som *Single Source of Truth* i `App.jsx` og sendes nedover i systemet.

Hvis API-et mangler tidssonedata, brukes `tz-lookup` som fallback basert på koordinater:

```js
timezone: item.timezone ?? tzLookup(lat, lon)

```

#### 3. Intern struktur i `getHourlyForecast`

Hver timeserie-entry transformeres i Repository-laget til et objekt der lokal tid er en **derivert verdi**:

```js
{
  timeISO: "2026-03-03T12:00:00Z", // Primærkilde (UTC)
  dateISO: "2026-03-03",           // Utledet lokal dato (YYYY-MM-DD)
  localTime: 1,                    // Utledet lokal time (0–23)
  utcHour: 12                      // Utledet UTC-time
}

```

Dette sikrer korrekt håndtering av:

* **Sommertid (DST):** Luxon beregner riktig offset basert på IANA-navn.
* **Ukurante tidssoner:** Håndterer sømløst soner med 30 eller 45 minutters offset (f.eks. Nepal eller Chatham Islands).
* **Grouping:** Gruppering av data i grensesnittet skjer alltid på `dateISO`, som garanterer at værmeldingen havner på riktig lokal dag.



### Spesialhåndtering av den internasjonale datolinjen (Samoa-paradokset)

Applikasjonen inneholder en spesifikk løsning for å håndtere områder der den internasjonale datolinjen gjør geometrisk tidssone-lookup usikker.

**Problemet:**
`tz-lookup` bruker et forenklet rutenett for å spare plass. Dette fører til at Amerikansk Samoa (UTC-11) ofte feilaktig plasseres i samme tidssone som den selvstendige staten Samoa (UTC+13). Dette resulterer i en dato-feil på nøyaktig 24 timer.

**Løsningen:**
`MapTilerRepository` fungerer som en kirurgisk vaktpost. Den kombinerer koordinater med metadata fra søkeresultatet for å verifisere politiske grenser:

```js
const isAmericanSamoa = item.name.toLowerCase().includes("samoa") && 
                       (item.name.toLowerCase().includes("amerikansk") || 
                        item.name.toLowerCase().includes("american"));

if (isAmericanSamoa && finalTz === "Pacific/Apia") {
    finalTz = "Pacific/Pago_Pago"; // Korrigerer +13 til -11
}

```

Dette sikrer at to steder som ligger geografisk nær hverandre, men på hver sin side av datolinjen, får korrekt dato. Selv om klokkeslettet er likt, vil appen korrekt vise at de befinner seg i forskjellige døgn:

* **Apia, Samoa:** 02:16, Onsdag 4. mars (GMT+13)
* **Pago Pago, Amerikansk Samoa:** 02:16, Tirsdag 3. mars (GMT-11)


## Designvalg på datastrukturnivå

* **Immutabilitet:** Ingen mutasjon av rådata fra MET.
* **Eksplisitte parametere:** Tidssone sendes alltid som en eksplisitt parameter til UseCases og formatters.
* **Ingen manuell offset:** Vi bruker aldri `+1` eller `-12` i koden; alt overlates til IANA-databasen via Luxon.
* **Deterministisk modell:** Modellen er stabil uavhengig av om brukeren bytter lokasjon eller om det skjer et skifte mellom sommer- og vintertid.

### Installasjon

For å støtte denne arkitekturen kreves følgende pakker:

```bash
npm install luxon tz-lookup

```

---

## Installere Highcharts

Highcharts og React-wrapperen installeres med:

```bash
npm install highcharts highcharts-react-official
```

Dette legger til:

- `highcharts` – selve grafbiblioteket
- `highcharts-react-official` – offisiell React-wrapper

Etter installasjon kan Highcharts importeres i komponentene der grafene konfigureres og renderes.

## Om arkitekturvalg i appen

Appen er strukturert etter en MVVM-inspirert lagdeling, hvor modellen består av **DataSources, Repositories og UseCases (Domain)**, mens View og ViewModel utgjør UI-laget.

Jeg har valgt å bruke et domenelag for å skille tydelig mellom **presentasjonslogikk** og **applikasjonslogikk**. DataSources håndterer kommunikasjon med eksterne API-er. Repositories mapper og strukturerer rådata. UseCases orkestrerer flyten mellom disse. ViewModels skal kun håndtere UI-tilstand og presentasjon.

Hensikten er ikke å gjøre arkitekturen mer avansert enn nødvendig, men å redusere kognitiv kompleksitet i UI-laget. Målet med dette er å skape en enda tydeligere ansvarsdeling, og tilstrebe enda høyere kohesjon, lavere kobling, bedre utvidbarhet, bedre testbarhet og bedre forståelighet/leselighet igjennom å unngå unødvendig kognitiv kompleksitet.

Dette er ikke full Domain-Driven Design, men et bevisst og pragmatisk valg for å samle applikasjonslogikk appens i model med eksplisite og tydelige useCases. Tanken er at ved å gjøre arkitekturen mer mer modulær, så vil den også gjøre fremtidig utvidelse lettere og samtidig håndterer økende kompleksitet på en ryddig måte.


## Arkitektur-tegning
![Arkitekturdiagram](images/Arkitektur.png)

## Forenklet mappestruktur

```bash
.
├── images
├── public
├── src
│   ├── geolocation
│   ├── navigation
│   ├── model                               <- Model    (M)
│   │   ├── datasource
│   │   ├── domain
│   │   └── repositories
│   └── ui
│       ├── style
│       ├── utils
│       ├── view                           <- View      (V)
│       │   ├── components
│       │   └── pages
│       └── viewmodel                      <- ViewModel (VM)
└── test
    ├── model
    │   ├── datasource
    │   └── repositories
    └── ui
```

## Utvidet Filstruktur

```bash
TestMVVMReact
│
├── images
├── public
│   ├── alert_symbols
│   ├── credit_icons
│   ├── sun_rise
│   └── weather_icons
│
├── src
│   ├── App.jsx
│   ├── main.jsx
│   │
│   ├── geolocation
│   │   ├── LocationNameFormatter.js
│   │   └── useGeolocation.js
│   │
│   ├── navigation
│   │   ├── Navigation.jsx
│   │   └── navGraph.js
│   │
│   ├── model
│   │   ├── datasource
│   │   │   ├── DataSource.js
│   │   │   ├── LocationForecastDataSource.js
│   │   │   ├── MetAlertsDataSource.js
│   │   │   ├── OpenCageGeocodingDataSource.js
│   │   │   └── SunriseDataSource.js
│   │   │
│   │   ├── domain
│   │   │   ├── GetAlertsUseCase.js
│   │   │   ├── GetAllAlertsUseCase.js
│   │   │   ├── GetCurrentWeatherUseCase.js
│   │   │   ├── GetForecastUseCase.js
│   │   │   ├── GetLocationNameUseCase.js
│   │   │   ├── GetSunTimesUseCase.js
│   │   │   └── SearchLocationUseCase.js
│   │   │
│   │   └── repositories
│   │       ├── LocationForecastRepository.js
│   │       ├── MetAlertsRepository.js
│   │       ├── OpenCageGeocodingRepository.js
│   │       └── SunriseRepository.js
│   │
│   └── ui
│       ├── style
│       │   ├── AlertCard.css
│       │   ....
│       │   ....
│       │
│       ├── utils
│       │   ├── AlertPageUtils
│       │   │   ├── alertFilterUtils.js
│       │   │   ├── counties.js
│       │   │   └── marineAreas.js
│       │   ├── CommonUtils
│       │   │   ├── getAlertIconFileName.js
│       │   │   ├── getRiskLevelText.js
│       │   │   └── weatherIcons.js
│       │   ├── ForecastUtils
│       │   │   ├── formatPrecipitationUtil.js
│       │   │   └── windDescriptionUtil.js
│       │   └── TimeZoneUtils
│       │       └── timeFormatters.js
│       │
│       ├── view
│       │   ├── components
│       │   │   ├── AlertPage
│       │   │   ├── Common
│       │   │   ├── ForecastPage
│       │   │   └── GraphPage
│       │   │
│       │   └── pages
│       │       ├── AlertPage.jsx
│       │       ├── ForecastPage.jsx
│       │       └── GraphPage.jsx
│       │
│       └── viewmodel
│           ├── AlertPageViewModel.js
│           ├── ForecastPageViewModel.js
│           ├── GraphScreenViewModel.js
│           └── SearchViewModel.js
│
└── test
    ├── model
    │   ├── datasource
    │   └── repositories
    └── ui
```



## Om Varslingsområder for Hav og kyst


![Polygoner for varslingsområder for kyst og hav](images/HavPolygoner.png)

Se mer informasjon om dette hos met.no
https://www.met.no/vaer-og-klima/ekstremvaervarsler-og-andre-farevarsler/varslingsomrader-kyst-og-hav
