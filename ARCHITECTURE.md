# ARCHITECTURE.md

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
 subgraph AppLayer["App"]
        App["App.jsx"]
  end
 subgraph NavigationLayer["Navigation"]
        NavGraph["navGraph.js (NAV_SCREENS)"]
  end
 subgraph Screens["Screens / Views"]
        HomePage["HomePage.jsx"]
        GraphPage["GraphPage.jsx"]
        AlertPage["AlertPage.jsx"]
  end
 subgraph Hooks["ViewModels (Hooks)"]
        HomeVM["useHomeScreenViewModel"]
        GraphVM["useGraphScreenViewModel"]
        AlertVM["useAlertPageViewModel"]
        SearchVM["useSearchViewModel"]
  end
 subgraph Repositories["Repositories"]
        ForecastRepo["LocationForecastRepository"]
        SunriseRepo["SunriseRepository"]
        AlertsRepo["MetAlertsRepository"]
        GeoRepo["OpenCageGeocodingRepository"]
  end
 subgraph DataSources["DataSources"]
        BaseDS["DataSource (base)"]
        ForecastDS["LocationForecastDataSource"]
        SunriseDS["SunriseDataSource"]
        AlertsDS["MetAlertsDataSource"]
        GeoDS["OpenCageGeocodingDataSource"]
  end
 subgraph ExternalAPI["External API"]
        MET["api.met.no"]
        OpenCage["api.opencagedata.com"]
  end
 subgraph Device["Device"]
        GeoHook["useGeolocation"]
  end
    App --> NavGraph & GeoHook & HomePage & GraphPage & AlertPage
    HomePage --> HomeVM
    GraphPage --> GraphVM
    AlertPage --> AlertVM
    GraphVM --> HomeVM
    HomeVM --> SearchVM & ForecastRepo & SunriseRepo & AlertsRepo & GeoRepo
    AlertVM --> AlertsRepo
    SearchVM --> GeoRepo
    ForecastRepo --> ForecastDS
    SunriseRepo --> SunriseDS
    AlertsRepo --> AlertsDS
    GeoRepo --> GeoDS
    ForecastDS --> BaseDS
    SunriseDS --> BaseDS
    AlertsDS --> BaseDS
    BaseDS --> MET
    GeoDS --> OpenCage

    style AppLayer stroke:#000000,fill:#E1BEE7
    style NavigationLayer stroke:#000000,fill:#BBDEFB
    style Screens stroke:#000000,fill:#FFF9C4
    style Hooks stroke:#000000,fill:#FFCDD2
    style Repositories stroke:#000000,fill:#DCEDC8
    style DataSources stroke:#000000,fill:#FFE082
    style ExternalAPI stroke:#000000,fill:#FFAB91
    style Device stroke:#000000,fill:#BBDEFB
```