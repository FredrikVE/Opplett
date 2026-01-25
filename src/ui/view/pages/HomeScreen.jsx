//src/ui/view/pages/HomeScreen.jsx
import SearchField from "../components/SearchField.jsx";
import SolarInformation from "../components/SolarInformation.jsx";
import ForecastTable from "../components/ForecastTable.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomeScreen({ viewModel }) {

    if (viewModel.loading) {
        return <p>Laster værmelding…</p>;
    }

    if (viewModel.error) {
        return <p>Feil: {viewModel.error}</p>;
    }

    const date = viewModel.forecast.length > 0 ? viewModel.forecast[0].date : "";

    return (
        <div>
            {/* Sideoverskrift med dato og stedsnavn */}
            <div>
                <h1>Værmelding {location?.name ? `– ${location.name}` : ""}</h1>
                <h2>{date}</h2>
            </div>

            {/* Farevarsler */}
            <AlertList alerts={viewModel.alerts} />
           
             {/* Søkefelt */}
            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
            />

            {/* Soloppgang/solnedgang */}
            <SolarInformation sunTimes={viewModel.sunTimes} />
            
            {/* Værmelding */}
            <ForecastTable forecast={viewModel.forecast} />
        </div>
    );
}
