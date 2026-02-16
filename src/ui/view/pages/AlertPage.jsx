// src/ui/view/pages/AlertPage.jsx
import { useState } from "react";
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";
import ChevronIcon from "../components/Common/Buttons/ChevronIcon.jsx";
import { COUNTIES } from "../../utils/counties.js";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    
    // State for å styre om vi viser alle eller bare en begrenset liste
    const [showAllOngoing, setShowAllOngoing] = useState(false);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);

    const LIMIT = 4;

    // --- HJELPEFUNKSJONER FOR RENDERING ---

    // Gjenbrukbar funksjon for select-filtrene for å få ikonet korrekt plassert uten CSS-bakgrunnsbilde
    const renderSelectFilter = (value, onChange, options, defaultLabel) => {
        return (
            <div className="alert-select-wrapper">
                <select 
                    className="alert-select-filter"
                    value={value} 
                    onChange={onChange}
                >
                    <option value="">{defaultLabel}</option>
                    {options.map((opt) => (
                        <option key={opt.id || opt.value} value={opt.id || opt.value}>
                            {opt.name || opt.label}
                        </option>
                    ))}
                </select>
                <div className="select-chevron-overlay">
                    <ChevronIcon isOpen={false} size={14} />
                </div>
            </div>
        );
    };

    const renderExpandButton = (count, isExpanded, setExpanded) => {
        if (count <= LIMIT) return null;

        let buttonText = `Vis alle (${count})`;
        if (isExpanded) {
            buttonText = "Vis færre";
        }

        return (
            <button className="expand-alerts-btn" onClick={() => setExpanded(!isExpanded)}>
                <span>{buttonText}</span>
                <ChevronIcon isOpen={isExpanded} size={16} />
            </button>
        );
    };

    const renderOngoingSection = () => {
        const totalCount = viewModel.ongoingAlerts.length;
        if (totalCount === 0) return null;
        
        let alertsToShow = viewModel.ongoingAlerts;
        if (showAllOngoing === false) {
            alertsToShow = viewModel.ongoingAlerts.slice(0, LIMIT);
        }

        return (
            <section className="alerts-section">
                <h2>Pågår</h2>
                <AlertList 
                    alerts={alertsToShow} 
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />
                {renderExpandButton(totalCount, showAllOngoing, setShowAllOngoing)}
            </section>
        );
    };

    const renderUpcomingSection = () => {
        const totalCount = viewModel.upcomingAlerts.length;
        if (totalCount === 0) return null;

        let alertsToShow = viewModel.upcomingAlerts;
        if (showAllUpcoming === false) {
            alertsToShow = viewModel.upcomingAlerts.slice(0, LIMIT);
        }

        return (
            <section className="alerts-section">
                <h2>Ventes</h2>
                <AlertList 
                    alerts={alertsToShow} 
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />
                {renderExpandButton(totalCount, showAllUpcoming, setShowAllUpcoming)}
            </section>
        );
    };

    const renderEmptyMessage = () => {
        const hasOngoing = viewModel.ongoingAlerts.length > 0;
        const hasUpcoming = viewModel.upcomingAlerts.length > 0;
        if (hasOngoing || hasUpcoming) return null;

        const domainText = viewModel.activeDomain === "marine" ? "hav og kyst" : "land";
        return (
            <div className="no-alerts-message">
                Ingen aktive farevarsler for {domainText} med valgte filtre.
            </div>
        );
    };

    // --- HOVED RENDER ---

    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    let landClass = viewModel.activeDomain === "land" ? "active" : "";
    let marineClass = viewModel.activeDomain === "marine" ? "active" : "";

    return (
        <div className="alert-page">
            <header className="alert-page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

            <div className="domain-selector">
                <div className="domain-toggle-wrapper">
                    <button 
                        className={landClass}
                        onClick={() => viewModel.setActiveDomain("land")}
                    >
                        Land ({viewModel.counts.land})
                    </button>
                    <button 
                        className={marineClass}
                        onClick={() => viewModel.setActiveDomain("marine")}
                    >
                        Hav og kyst ({viewModel.counts.marine})
                    </button>
                </div>
            </div>

            <Navigation 
                activeScreen={activeScreen} 
                onChangeScreen={onChangeScreen} 
                SCREENS={SCREENS} 
            />

            <div className="filter-row">
                {renderSelectFilter(
                    viewModel.selectedCounty,
                    (e) => viewModel.setSelectedCounty(e.target.value),
                    COUNTIES,
                    "Alle fylker"
                )}

                {renderSelectFilter(
                    viewModel.selectedLevel,
                    (e) => viewModel.setSelectedLevel(e.target.value),
                    [
                        { value: "Yellow", label: "Gult nivå" },
                        { value: "Orange", label: "Oransje nivå" },
                        { value: "Red", label: "Rødt nivå" }
                    ],
                    "Alle farenivåer"
                )}

                {renderSelectFilter(
                    viewModel.selectedType,
                    (e) => viewModel.setSelectedType(e.target.value),
                    [
                        { value: "snow", label: "Snø" },
                        { value: "wind", label: "Vind" },
                        { value: "gale", label: "Kuling" },
                        { value: "rain", label: "Regn" },
                        { value: "forestFire", label: "Skogbrann" },
                        { value: "avalanche", label: "Snøskred" }
                    ],
                    "Alle faretyper"
                )}
            </div>

            <main className="alert-content">
                {renderOngoingSection()}
                {renderUpcomingSection()}
                {renderEmptyMessage()}
            </main>
        </div>
    );
}