// src/ui/view/pages/AlertPage.jsx
import { useState } from "react";
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";
import ChevronIcon from "../components/Common/Buttons/ChevronIcon.jsx";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
	
	//State for å styre om vi viser alle eller bare en begrenset liste
    const [showAllOngoing, setShowAllOngoing] = useState(false);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);

    const LIMIT = 4;

    //Rendringsfunksjon for "Vis alle"-knappen
    const renderExpandButton = (count, isExpanded, setExpanded) => {
        if (count <= LIMIT) {
            return null;
        }

        let buttonText = `Vis alle (${count})`;
        if (isExpanded) {
            buttonText = "Vis færre";
        }

        const handleToggleClick = () => {
            setExpanded(!isExpanded);
        };

        return (
            <button className="expand-alerts-btn" onClick={handleToggleClick}>
                <span>{buttonText}</span>
                <ChevronIcon isOpen={isExpanded} size={16} />
            </button>
        );
    };

    //Rendringsfunksjon for Pågående varsler
    const renderOngoingSection = () => {
        const totalCount = viewModel.ongoingAlerts.length;
        if (totalCount === 0) {
            return null;
        }
        
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

    // 3. Rendringsfunksjon for Kommende varsler
    const renderUpcomingSection = () => {
        const totalCount = viewModel.upcomingAlerts.length;
        if (totalCount === 0) {
            return null;
        }

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

    // 4. Rendringsfunksjon for tom liste (infomelding)
    const renderEmptyMessage = () => {
        const hasOngoing = viewModel.ongoingAlerts.length > 0;
        const hasUpcoming = viewModel.upcomingAlerts.length > 0;
        
        if (hasOngoing || hasUpcoming) {
            return null;
        }

        let domainText = "land";
        if (viewModel.activeDomain === "marine") {
            domainText = "hav og kyst";
        }

        return (
            <div className="no-alerts-message">
                Ingen aktive farevarsler for {domainText}.
            </div>
        );
    };

    //Håndter laste-tilstand først
    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    //Regn ut knappe-klasser for domene-velgeren
    let landClass = "";
    if (viewModel.activeDomain === "land") {
        landClass = "active";
    }

    let marineClass = "";
    if (viewModel.activeDomain === "marine") {
        marineClass = "active";
    }

    return (
        <div className="alert-page">
            <header className="alert-page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

            <Navigation 
                activeScreen={activeScreen} 
                onChangeScreen={onChangeScreen} 
                SCREENS={SCREENS} 
            />

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

            <main className="alert-content">
                {renderOngoingSection()}
                {renderUpcomingSection()}
                {renderEmptyMessage()}
            </main>
        </div>
    );
}