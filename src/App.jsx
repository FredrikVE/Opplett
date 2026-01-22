//src/App.jsx
import "./ui/style/App.css"
import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js"
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";
import useHourlyForecastViewModel from "./ui/viewmodel/useHourlyForecastViewModel.js";
import HomeScreen from "./ui/view/HomeScreen.jsx";

export default function App() {
    const lat = 27.777835
    const lon = -15.692579
    const hoursAhead = 12;

    const datasource = new LocationForecastDataSource();
    const repository = new LocationForecastRepository(datasource);
    const viewModel = useHourlyForecastViewModel(repository, lat, lon, hoursAhead);
    return <HomeScreen viewModel={viewModel} />;
}
