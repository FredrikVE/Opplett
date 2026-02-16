// src/ui/view/pages/AlertPage.jsx
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    // Hjelpevariabel for å sjekke om vi har noen varsler i det hele tatt
    const hasAnyAlerts = viewModel.ongoingAlerts.length > 0 || viewModel.upcomingAlerts.length > 0;

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

         

            <main className="alert-content">
                {hasAnyAlerts ? (
                    <>
                        {viewModel.ongoingAlerts.length > 0 && (
                            <section className="alerts-section">
                                <h2>Pågår</h2>
                                <AlertList 
                                    alerts={viewModel.ongoingAlerts} 
                                    formatLocalDateTime={viewModel.formatLocalDateTime}
                                />
                            </section>
                        )}

                        {viewModel.upcomingAlerts.length > 0 && (
                            <section className="alerts-section">
                                <h2>Ventes</h2>
                                <AlertList 
                                    alerts={viewModel.upcomingAlerts} 
                                    formatLocalDateTime={viewModel.formatLocalDateTime}
                                />
                            </section>
                        )}
                    </>
                ) : (
                    <div className="no-alerts-message">
                        Ingen aktive farevarsler for {viewModel.activeDomain === "land" ? "land" : "hav og kyst"}.
                    </div>
                )}
            </main>
        </div>
    );
}