// src/ui/view/pages/GraphPage.jsx
import Navigation from "../../../navigation/Navigation.jsx";
import WeatherGraph from "../components/GraphPage/WeatherGraph.jsx";
import WindGraph from "../components/GraphPage/WindGraph.jsx";
import SunGraph from "../components/GraphPage/SunGraph.jsx";
import UVGraph from "../components/GraphPage/UVGraph.jsx";
import SearchField from "../components/Common/SearchFeild/SearchField.jsx";
import LoadingSpinner from "../components/Common/LoadingSpinner/LoadingSpinner.jsx";

export default function GraphPage({ viewModel, searchProps, activeScreen, onChangeScreen, SCREENS }) {

    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    if (viewModel.error) {
        return <p>Feil: {viewModel.error}</p>;
    }

    const allHourlyData = viewModel.hourlyData.slice(0, 48);

    return (
        <div className="graph-screen">

            <header className="graph-header">
                <h1>{viewModel.location?.name || "Min posisjon"}</h1>
            </header>

            <SearchField
                query={searchProps.query}
                suggestions={searchProps.suggestions}
                onSearchChange={searchProps.onSearchChange}
                onSuggestionSelected={searchProps.onSuggestionSelected}
                onResetToDeviceLocation={searchProps.onResetToDeviceLocation}
            />

            <Navigation
                activeScreen={activeScreen}
                onChangeScreen={onChangeScreen}
                SCREENS={SCREENS}
            />

            <section className="graph-meteogram-section">
                <WeatherGraph
                    hourlyData={allHourlyData}
                    getLocalHour={viewModel.getLocalHour}
                    formatLocalDate={viewModel.formatLocalDate}
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />

                <WindGraph
                    hourlyData={allHourlyData}
                    getLocalHour={viewModel.getLocalHour}
                    formatLocalDate={viewModel.formatLocalDate}
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />

                <UVGraph
                    hourlyData={allHourlyData}
                    getLocalHour={viewModel.getLocalHour}
                    formatLocalDate={viewModel.formatLocalDate}
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />

                <SunGraph
                    sunTimesByDate={viewModel.sunTimesByDate}
                    formatLocalDate={viewModel.formatLocalDate}
                />
            </section>
        </div>
    );
}