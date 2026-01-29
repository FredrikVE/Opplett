//src/ui/view/pages/HomeScreen.jsx
import SearchField from "../components/SearchField.jsx";
import SolarInformation from "../components/SolarInformation.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
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
        
        <div className="home-screen">
            {/* Sideoverskrift med dato og stedsnavn */}
            <header className="page-header">
                <h1>Værmelding: {viewModel.location.name}</h1>

                <h2 className="page-date">{date}</h2>
            </header>
           
             {/* Søkefelt */}
            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
            />

            {/* Farevarsler */}
            <AlertList alerts={viewModel.alerts} />

            {/* Soloppgang/solnedgang */}
            <SolarInformation sunTimes={viewModel.sunTimes} />
            
            {/* Værmelding */}
            {/*
            <ForecastTable forecast={viewModel.forecast} />
            */}

            {Object.entries(viewModel.forecast).map(([date, items]) => (
                <DayForecastCard key={date} date={date} forecast={items}/>
                ))
            }


            
        </div>
    );
}
