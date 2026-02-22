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

%% =========================
%% APP LAYER (COMPOSITION ROOT)
%% =========================
subgraph AppLayer["App (Composition Root)"]
	App["App.jsx"]
end

%% =========================
%% NAVIGATION
%% =========================
subgraph NavigationLayer["Navigation"]
	NavGraph["navGraph.js (NAV_SCREENS)"]
	Navigation["Navigation.jsx"]
end

%% =========================
%% SCREENS
%% =========================
subgraph Screens["Screens / Views"]
	ForecastPage["ForecastPage.jsx"]
	GraphPage["GraphPage.jsx"]
	AlertPage["AlertPage.jsx"]
end

%% =========================
%% VIEWMODELS (MVVM)
%% =========================
subgraph Hooks["ViewModels (Hooks)"]
	ForecastVM["useForecastPageViewModel"]
	GraphVM["useGraphScreenViewModel"]
	AlertVM["useAlertPageViewModel"]
	SearchVM["useSearchViewModel"]
end

%% =========================
%% DOMAIN / USECASES
%% =========================
subgraph UseCases["Domain Layer (UseCases)"]
	GetForecastUC["GetForecastUseCase"]
	GetAlertsUC["GetAlertsUseCase"]
	GetAllAlertsUC["GetAllAlertsUseCase"]
	GetCurrentUC["GetCurrentWeatherUseCase"]
	GetSunTimesUC["GetSunTimesUseCase"]
	SearchLocationUC["SearchLocationUseCase"]
	GetLocationNameUC["GetLocationNameUseCase"]
end

%% =========================
%% REPOSITORIES
%% =========================
subgraph Repositories["Repositories"]
	ForecastRepo["LocationForecastRepository"]
	AlertsRepo["MetAlertsRepository"]
	SunriseRepo["SunriseRepository"]
	GeoRepo["OpenCageGeocodingRepository"]
end

%% =========================
%% DATASOURCES
%% =========================
subgraph DataSources["DataSources"]
	BaseDS["DataSource (base)"]
	ForecastDS["LocationForecastDataSource"]
	AlertsDS["MetAlertsDataSource"]
	SunriseDS["SunriseDataSource"]
	GeoDS["OpenCageGeocodingDataSource"]
end

%% =========================
%% DEVICE
%% =========================
subgraph Device["Device"]
	GeoHook["useGeolocation"]
end

%% =========================
%% EXTERNAL APIS
%% =========================
subgraph ExternalAPI["External APIs"]
	MET["api.met.no"]
	OpenCage["api.opencagedata.com"]
end

%% =========================
%% APP CONNECTIONS
%% =========================
App --> NavGraph
App --> GeoHook
App --> ForecastPage
App --> GraphPage
App --> AlertPage

%% =========================
%% SCREEN → VIEWMODEL
%% =========================
ForecastPage --> ForecastVM
GraphPage --> GraphVM
AlertPage --> AlertVM

GraphVM --> ForecastVM
ForecastVM --> SearchVM

%% =========================
%% VIEWMODEL → USECASE
%% =========================
ForecastVM --> GetForecastUC
ForecastVM --> GetAlertsUC
ForecastVM --> GetCurrentUC
ForecastVM --> GetSunTimesUC
ForecastVM --> GetLocationNameUC

AlertVM --> GetAllAlertsUC
SearchVM --> SearchLocationUC

%% =========================
%% USECASE → REPOSITORY
%% =========================
GetForecastUC --> ForecastRepo
GetCurrentUC --> ForecastRepo

GetAlertsUC --> AlertsRepo
GetAllAlertsUC --> AlertsRepo

GetSunTimesUC --> SunriseRepo

SearchLocationUC --> GeoRepo
GetLocationNameUC --> GeoRepo

%% =========================
%% REPOSITORY → DATASOURCE
%% =========================
ForecastRepo --> ForecastDS
AlertsRepo --> AlertsDS
SunriseRepo --> SunriseDS
GeoRepo --> GeoDS

ForecastDS --> BaseDS
AlertsDS --> BaseDS
SunriseDS --> BaseDS

%% =========================
%% DATASOURCE → EXTERNAL
%% =========================
BaseDS --> MET
GeoDS --> OpenCage

%% =========================
%% STYLING
%% =========================
style AppLayer stroke:#000000,fill:#E1BEE7
style NavigationLayer stroke:#000000,fill:#BBDEFB
style Screens stroke:#000000,fill:#FFF9C4
style Hooks stroke:#000000,fill:#FFCDD2
style UseCases stroke:#000000,fill:#C5CAE9
style Repositories stroke:#000000,fill:#DCEDC8
style DataSources stroke:#000000,fill:#FFE082
style ExternalAPI stroke:#000000,fill:#FFAB91
style Device stroke:#000000,fill:#BBDEFB
```