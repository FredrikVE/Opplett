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


## Installere Highcharts

Highcharts og React-wrapperen installeres med:

```bash
npm install highcharts highcharts-react-official
```

Dette legger til:

- `highcharts` – selve grafbiblioteket
- `highcharts-react-official` – offisiell React-wrapper

Etter installasjon kan Highcharts importeres i komponentene der grafene konfigureres og renderes.


## Arkitektur-tegning
![Arkitekturdiagram](images/Arkitektur.png)

## Filstruktur

```bash
TestMVVMReact
│
├── ARCHITECTURE.md
├── README.md
├── vite.config.js
├── yarn.lock
│
├── public
│   ├── alert_symbols
│   ├── credit_icons
│   ├── sun_rise
│   └── weather_icons
│       ├── 100
│       └── 200
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
│   │   └── repositories
│   │       ├── LocationForecastRepository.js
│   │       ├── MetAlertsRepository.js
│   │       ├── OpenCageGeocodingRepository.js
│   │       └── SunriseRepository.js
│   │
│   └── ui
│       ├── style
│       │   ├── AlertCard.css
│       │   ├── AlertPage.css
│       │   ├── ForecastPage.css
│       │   ├── GraphPage.css
│       │   └── ...
│       │
│       ├── utils
│       │   ├── AlertPageUtils
│       │   ├── CommonUtils
│       │   ├── LocationUtils
│       │   └── TimeZoneUtils
│       │
│       ├── view
│       │   ├── pages
│       │   │   ├── ForecastPage.jsx
│       │   │   ├── GraphPage.jsx
│       │   │   └── AlertPage.jsx
│       │   │
│       │   └── components
│       │       ├── HomePage
│       │       ├── GraphPage
│       │       ├── AlertPage
│       │       └── Common
│       │
│       └── viewmodel
│           ├── ForecastPageViewModel.js
│           ├── GraphScreenViewModel.js
│           ├── AlertPageViewModel.js
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
