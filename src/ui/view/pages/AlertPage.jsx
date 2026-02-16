//src/ui/view/pages/AlertPage.jsx
import LoadingSpinner from "../components/Common/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";
import FilterSelect from "../components/AlertPage/FilterSelect.jsx";
import AlertSection from "../components/AlertPage/AlertSection.jsx";
import { COUNTIES } from "../../utils/counties.js";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    
    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    //LOGIKK FOR FYLKES-TALL
    const countiesWithCounts = COUNTIES.map((county) => {
		const count = viewModel.getCountForCounty(county.id);  //Hent antall varsler for fylket

		//Opprett det nye objektet eksplisitt
		const countyWithCount = {
			id: county.id,
			name: county.name,
			displayName: county.name + " (" + count + ")"
		};

		return countyWithCount;
	});
	
    const totalDomainCount = viewModel.getCountForCounty("");

    //LOGIKK FOR TOM MELDING
    let emptyMessage = null;
    const hasNoAlerts = viewModel.ongoingAlerts.length === 0 && viewModel.upcomingAlerts.length === 0;
    
    if (hasNoAlerts) {
        let domainText = "land";
        if (viewModel.activeDomain === "marine") {
            domainText = "hav og kyst";
        }
        
        emptyMessage = (
            <div className="no-alerts-message">
                Ingen aktive farevarsler for {domainText} med valgte filtre.
            </div>
        );
    }

    //CSS KLASSER FOR DOMENE-KNAPPER
    let landButtonClass = "";
    if (viewModel.activeDomain === "land") {
        landButtonClass = "active";
    }

    let marineButtonClass = "";
    if (viewModel.activeDomain === "marine") {
        marineButtonClass = "active";
    }

    return (
        <div className="alert-page">

            {/*Overskrift for siden */}
            <header className="alert-page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

            {/* Tomt felt som matcher SearchField i høyde og marginer */}
            <div className="search-placeholder"></div>

            {/*Navigasjonsbar for navigasjonskanpper */}
            <Navigation activeScreen={activeScreen} onChangeScreen={onChangeScreen} SCREENS={SCREENS} />

            {/* Hav/Land kanpper */}
            <div className="domain-selector">
                <div className="domain-toggle-wrapper">

                    {/*Land-knapp */}
                    <button 
                        className={landButtonClass} 
                        onClick={() => viewModel.setActiveDomain("land")}
                    >
                        Land ({viewModel.counts.land})
                    </button>

                    {/* Hav-knapp */}
                    <button 
                        className={marineButtonClass} 
                        onClick={() => viewModel.setActiveDomain("marine")}
                    >
                        Hav og kyst ({viewModel.counts.marine})
                    </button>
                </div>
            </div>

            {/* Rad med filterknapper */}
            <div className="filter-row">
                <FilterSelect
                    value={viewModel.selectedCounty}
                    onChange={(event) => viewModel.setSelectedCounty(event.target.value)}
                    options={countiesWithCounts}
                    defaultLabel="Alle fylker"
                    totalCount={totalDomainCount}
                />

                <FilterSelect
                    value={viewModel.selectedLevel}
                    onChange={(event) => viewModel.setSelectedLevel(event.target.value)}
                    options={[
                        { value: "Yellow", label: "Gult nivå" },
                        { value: "Orange", label: "Oransje nivå" },
                        { value: "Red", label: "Rødt nivå" }
                    ]}
                    defaultLabel="Alle farenivåer"
                />

                <FilterSelect
                    value={viewModel.selectedType}
                    onChange={(event) => viewModel.setSelectedType(event.target.value)}
                    options={[
                        { value: "snow", label: "Snø" },
                        { value: "wind", label: "Vind" },
                        { value: "gale", label: "Kuling" },
                        { value: "rain", label: "Regn" },
                        { value: "forestFire", label: "Skogbrann" },
                        { value: "avalanche", label: "Snøskred" }
                    ]}
                    defaultLabel="Alle faretyper"
                />
            </div>

            <main className="alert-content">
                <AlertSection 
                    title="Pågår" 
                    alerts={viewModel.ongoingAlerts} 
                    formatLocalDateTime={viewModel.formatLocalDateTime} 
                />
                
                <AlertSection 
                    title="Ventes" 
                    alerts={viewModel.upcomingAlerts} 
                    formatLocalDateTime={viewModel.formatLocalDateTime} 
                />
                
                {emptyMessage}
            </main>
        </div>
    );
}