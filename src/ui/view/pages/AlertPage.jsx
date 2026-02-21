// src/ui/view/pages/AlertPage.jsx
import LoadingSpinner from "../components/Common/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";
import FilterSelect from "../components/AlertPage/FilterSelect.jsx";
import AlertSection from "../components/AlertPage/AlertSection.jsx";
import EmptyAlertMessage from "../components/AlertPage/EmptyAlertMessage.jsx";

import { COUNTIES } from "../../utils/counties.js";
import { MARINE_AREAS } from "../../utils/marineAreas.js";
import { buildLocationOptions, buildTypeOptions, getLevelOptions } from "../../utils/alertFilterUtils.js";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    
    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    //Event-handlers for land/kyst-knapp
    const switchToLand = () => {
        viewModel.setActiveDomain("land");
    };

    const switchToMarine = () => {
        viewModel.setActiveDomain("marine");
    };

    const isLandActive = viewModel.activeDomain === "land";
    
    let allAlerts = [];
    for (const alert of viewModel.ongoingAlerts) {
        allAlerts.push(alert);
    }
    for (const alert of viewModel.upcomingAlerts) {
        allAlerts.push(alert);
    }
    
    const locationOptions = buildLocationOptions(viewModel, COUNTIES, MARINE_AREAS);
    const levelOptions = getLevelOptions();
    const typeOptions = buildTypeOptions(allAlerts);

    const totalCountForAllLocations = viewModel.getCountForLocation("");

    let locationDefaultLabel = "Alle områder";
    if (isLandActive) {
        locationDefaultLabel = "Alle fylker";
    }

    let landButtonClass = "";
    if (isLandActive) {
        landButtonClass = "active";
    }

    let marineButtonClass = "";
    if (isLandActive === false) {
        marineButtonClass = "active";
    }

    return (
        <div className="alert-page">
            <header className="alert-page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

            <div className="search-placeholder"></div>

            <Navigation 
                activeScreen={activeScreen} 
                onChangeScreen={onChangeScreen} 
                SCREENS={SCREENS} 
            />

            <div className="domain-selector">
                <div className="domain-toggle-wrapper">
                    <button 
						className={landButtonClass} 
						onClick={switchToLand}>

                        	Land ({viewModel.counts.land})

                    </button>
                    <button 
						className={marineButtonClass} 
						onClick={switchToMarine}>

                        	Hav og kyst ({viewModel.counts.marine})
							
                    </button>
                </div>
            </div>

            <div className="filter-row">
                <FilterSelect
                    value={viewModel.selectedCounty}
                    onChange={(event) => viewModel.setSelectedCounty(event.target.value)}
                    options={locationOptions}
                    defaultLabel={locationDefaultLabel}
                    totalCount={totalCountForAllLocations}
                />
                
                <FilterSelect
                    value={viewModel.selectedLevel}
                    onChange={(event) => viewModel.setSelectedLevel(event.target.value)}
                    options={levelOptions}
                    defaultLabel="Alle farenivåer"
                />

                <FilterSelect
                    value={viewModel.selectedType}
                    onChange={(event) => viewModel.setSelectedType(event.target.value)}
                    options={typeOptions}
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
                
                <EmptyAlertMessage 
                    allAlerts={allAlerts} 
                    isLandActive={isLandActive} 
                    viewModel={viewModel} 
                />
            </main>
        </div>
    );
}