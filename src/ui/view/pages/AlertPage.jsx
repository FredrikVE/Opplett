// src/ui/view/pages/AlertPage.jsx
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    
    //Definer logikken som funksjoner (ikke komponenter)
    const renderOngoingSection = () => {
        if (viewModel.ongoingAlerts.length === 0) return null;
        
        return (
            <section className="alerts-section">
                <h2>Pågår</h2>
                <AlertList 
                    alerts={viewModel.ongoingAlerts} 
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />
            </section>
        );
    };

    const renderUpcomingSection = () => {
        if (viewModel.upcomingAlerts.length === 0) {
			return null;
		}

        return (
            <section className="alerts-section">
                <h2>Ventes</h2>
                <AlertList 
                    alerts={viewModel.upcomingAlerts} 
                    formatLocalDateTime={viewModel.formatLocalDateTime}
                />
            </section>
        );
    };

    const renderEmptyMessage = () => {
        const hasAnyAlerts = viewModel.ongoingAlerts.length > 0 || viewModel.upcomingAlerts.length > 0;
        if (hasAnyAlerts) return null;

        const domainText = viewModel.activeDomain === "marine" ? "hav og kyst" : "land";

        return (
            <div className="no-alerts-message">
                Ingen aktive farevarsler for {domainText}.
            </div>
        );
    };

    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="alert-page">

			{/* Overskrift */}
            <header className="alert-page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

			{/* Navigasjonsknapper */}
            <Navigation 
                activeScreen={activeScreen} 
                onChangeScreen={onChangeScreen} 
                SCREENS={SCREENS} 
            />

			{/* Knapper for å velge geografisk domene (land/hav) */}
            <div className="domain-selector">
                <div className="domain-toggle-wrapper">
                    <button 
                        className={viewModel.activeDomain === "land" ? "active" : ""}
                        onClick={() => viewModel.setActiveDomain("land")}
                    >
                        Land ({viewModel.counts.land})
                    </button>
                    <button 
                        className={viewModel.activeDomain === "marine" ? "active" : ""}
                        onClick={() => viewModel.setActiveDomain("marine")}
                    >
                        Hav og kyst ({viewModel.counts.marine})
                    </button>
                </div>
            </div>

			{/* Område som viser farevarsler */}
            <main className="alert-content">
                {renderOngoingSection()}
                {renderUpcomingSection()}
                {renderEmptyMessage()}
            </main>
        </div>
    );
}