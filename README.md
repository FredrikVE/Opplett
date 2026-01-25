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

## Arkitektur-tegning
![Arkitekturdiagram](images/Arkitektur.png)

## Mermaidkode for arkitektur-tegning

```javaScript
---
config:
  theme: forest
  layout: fixed
---
flowchart TB
 subgraph Main["Main"]
        App["App.jsx"]
  end
 subgraph Pages["Pages / Views"]
        HomeScreen["HomeScreen.jsx"]
  end
 subgraph Components["UI Components"]
        SearchField["SearchField.jsx"]
        SolarInformation["SolarInformation.jsx"]
        ForecastTable["ForecastTable.jsx"]
        AlertList["AlertList.jsx"]
  end
 subgraph ViewModels["ViewModels"]
        HomeScreenViewModel["HomeScreenViewModel.js"]
        SearchViewModel["SearchViewModel.js"]
  end
 subgraph Repositories["Repositories"]
        LocationForecastRepository["LocationForecastRepository.js"]
        SunriseRepository["SunriseRepository.js"]
        MetAlertsRepository["MetAlertsRepository.js"]
        OpenCageGeocodingRepository["OpenCageGeocodingRepository.js"]
  end
 subgraph DataSources["DataSources"]
        DataSource["DataSource.js"]
        LocationForecastDataSource["LocationForecastDataSource.js"]
        SunriseDataSource["SunriseDataSource.js"]
        MetAlertsDataSource["MetAlertsDataSource.js"]
        OpenCageGeocodingDataSource["OpenCageGeocodingDataSource.js"]
  end
 subgraph ExternalAPIs["External APIs"]
        MET_API["api.met.no"]
        OpenCageAPI["OpenCage API"]
  end
    App --> HomeScreen
    HomeScreen --> HomeScreenViewModel & SearchField & SolarInformation & ForecastTable & AlertList
    HomeScreenViewModel --> SearchViewModel & LocationForecastRepository & SunriseRepository & MetAlertsRepository & OpenCageGeocodingRepository
    SearchViewModel --> OpenCageGeocodingRepository
    LocationForecastRepository --> LocationForecastDataSource
    SunriseRepository --> SunriseDataSource
    MetAlertsRepository --> MetAlertsDataSource
    OpenCageGeocodingRepository --> OpenCageGeocodingDataSource
    LocationForecastDataSource --> DataSource
    SunriseDataSource --> DataSource
    MetAlertsDataSource --> DataSource
    DataSource --> MET_API
    OpenCageGeocodingDataSource --> OpenCageAPI

    style Main stroke:#000000,fill:#E1BEE7
    style Pages stroke:#000000,fill:#FFF9C4
    style Components stroke:#000000,fill:#BBDEFB
    style ViewModels stroke:#000000,fill:#FFCDD2
    style Repositories stroke:#000000,fill:#DCEDC8
    style DataSources stroke:#000000,fill:#FFE082
    style ExternalAPIs stroke:#000000,fill:#FFAB91
```