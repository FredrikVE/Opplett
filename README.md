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

Her er en mer datastruktur-fokusert versjon av teksten din, uten fluff.


## Bruk av `tz-lookup` for å styre tidssone etter søk

All værdata fra MET leveres i UTC (`...Z`).
UTC beholdes uendret i hele datastrømmen.
Konvertering til lokal tid skjer først når data struktureres eller vises.


### Datastrøm og datastruktur

#### 1. Rådata fra MET

MET returnerer timeserie slik:

```js
{
  properties: {
    timeseries: [
      {
        time: "2026-03-02T17:00:00Z",
        data: { ... }
      }
    ]
  }
}
```

`time` er alltid UTC.

Repository lagrer dette som `timeISO` uten modifikasjon.



#### 2. Lokasjon og tidssone

Ved søk returnerer `MapTilerRepository`:

```js
{
  name,
  lat,
  lon,
  bounds,
  type,
  timezone
}
```

Hvis `timezone` mangler brukes:

```js
tzLookup(lat, lon)
```

Denne tidssonen lagres i `manualLocation` i `App.jsx` og blir derfra systemets aktive tidssone.

Ingen beregning av offset gjøres manuelt.


#### 3. Intern struktur i `getHourlyForecast`

Hver timeserie-entry transformeres til:

```js
{
  timeISO,        // UTC (uendret)
  dateISO,        // Lokal dato (YYYY-MM-DD)
  localTime,      // 0–23 (lokal time)
  utcHour,        // 0–23 (UTC)
  weatherSymbol,
  precipitation,
  temp,
  wind,
  uv,
  details
}
```

Viktig:

* `timeISO` forblir UTC
* `localTime` er derivert verdi
* `dateISO` er derivert verdi

UTC beholdes alltid som primær kilde.


**getLocalHour**

```js
getLocalHour(isoString, timeZone)
```

Input:

* `isoString` (UTC)
* `timeZone` (IANA string, f.eks `Asia/Kathmandu`)

Output:

* Lokalt timetall (0–23)

Eksempel:

```
UTC: 17:00Z
Asia/Kathmandu → 22:45 lokal
localTime = 22
```

Minutter påvirker konverteringen, men lagres ikke i strukturen.


**getLocalDateKey**

Brukes før grouping:

```
UTC → lokal dato → YYYY-MM-DD
```

Dette er avgjørende for korrekt dagsskifte i:

* DST
* Halvtimers tidssoner
* 45-minutters tidssoner

Grouping skjer alltid på lokal dato, aldri på UTC-dato.


**Forecast vs nå-tid**

Forecast-strukturen representerer starttidspunktet for hver slot.

Hvis MET leverer:

```
17:00Z
```

og lokal tid er:

```
22:45
```

så lagres:

```
localTime: 22
```

**Dette betyr:**
Forecast gjelder intervallet som starter 22:45 lokal tid.

Appen viser ikke faktisk nå-tid i forecast-tabellen.

## Designvalg på datastrukturnivå

* UTC lagres uendret i alle domeneobjekter
* Tidssone er en eksplisitt parameter
* Lokal tid er alltid derivert verdi
* Ingen mutasjon av rå MET-data
* Ingen manuell offset-logikk

Dette gjør modellen deterministisk og stabil ved:

* DST-endringer
* Ikke-hele-timers tidssoner
* Geografisk bytte av lokasjon


## Installasjon med følgende kommando

```bash
npm install tz-lookup
```


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
