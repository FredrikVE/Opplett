//src/di/dependencies.js
//
// Composition Root – Dependency Injection Container
// Samler all instansiering av DataSources, Repositories og UseCases
// på ett sted, slik at App.jsx slipper å gjøre dette.

// DataSources
import LocationForecastDataSource from "../model/datasource/LocationForecastDataSource.js";
import MetAlertsDataSource from "../model/datasource/MetAlertsDataSource.js";
import SunriseDataSource from "../model/datasource/SunriseDataSource.js";
import MapTilerDataSource from "../model/datasource/MapTilerDataSource.js";

// Repositories
import LocationForecastRepository from "../model/repositories/LocationForecastRepository.js";
import MetAlertsRepository from "../model/repositories/MetAlertsRepository.js";
import SunriseRepository from "../model/repositories/SunriseRepository.js";
import MapTilerRepository from "../model/repositories/MapTilerRepository.js";

// UseCases
import GetForecastUseCase from "../model/domain/GetForecastUseCase.js";
import GetAllAlertsUseCase from "../model/domain/GetAllAlertsUseCase.js";
import GetCurrentWeatherUseCase from "../model/domain/GetCurrentWeatherUseCase.js";
import SearchLocationUseCase from "../model/domain/SearchLocationUseCase.js";
import GetLocationNameUseCase from "../model/domain/GetLocationNameUseCase.js";
import GetSunTimesUseCase from "../model/domain/GetSunTimesUseCase.js";
import GetAlertsUseCase from "../model/domain/GetAlertsUseCase.js";
import GetMapWeatherUseCase from "../model/domain/GetMapWeatherUseCase.js";
import GetLocationGeometryUseCase from "../model/domain/GetLocationGeometryUseCase.js";

// --- DataSources ---
const locationForecastDataSource = new LocationForecastDataSource();
const metAlertsDataSource = new MetAlertsDataSource();
const sunriseDataSource = new SunriseDataSource();
const mapTilerDataSource = new MapTilerDataSource();

// --- Repositories ---
const locationForecastRepository = new LocationForecastRepository(locationForecastDataSource);
const metAlertsRepository = new MetAlertsRepository(metAlertsDataSource);
const sunriseRepository = new SunriseRepository(sunriseDataSource);
const mapTilerRepository = new MapTilerRepository(mapTilerDataSource);

// --- UseCases ---
const getForecastUseCase = new GetForecastUseCase(locationForecastRepository);
const getSunTimesUseCase = new GetSunTimesUseCase(sunriseRepository);
const getAlertsUseCase = new GetAlertsUseCase(metAlertsRepository);
const getAllAlertsUseCase = new GetAllAlertsUseCase(metAlertsRepository);
const getCurrentWeatherUseCase = new GetCurrentWeatherUseCase(locationForecastRepository);
const searchLocationUseCase = new SearchLocationUseCase(mapTilerRepository);
const getLocationNameUseCase = new GetLocationNameUseCase(mapTilerRepository);
const getMapWeatherUseCase = new GetMapWeatherUseCase(getCurrentWeatherUseCase);
const getLocationGeometryUseCase = new GetLocationGeometryUseCase(mapTilerRepository);

// Eksporterer ferdige instanser
export {
    // Repositories (MapPageViewModel trenger direkte tilgang til mapTilerRepository for getMapStyle)
    mapTilerRepository,

    // UseCases
    getForecastUseCase,
    getSunTimesUseCase,
    getAlertsUseCase,
    getAllAlertsUseCase,
    getCurrentWeatherUseCase,
    searchLocationUseCase,
    getLocationNameUseCase,
    getMapWeatherUseCase,
    getLocationGeometryUseCase,
};