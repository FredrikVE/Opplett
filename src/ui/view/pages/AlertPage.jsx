// src/ui/view/pages/AlertPage.jsx
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx"; // Endret fra AlertCard
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import Navigation from "../../../navigation/Navigation.jsx";

export default function AlertPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
    
    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="alert-page">
            <header className="page-header">
                <h1>Farevarsler i Norge</h1>
            </header>

            <Navigation 
                activeScreen={activeScreen} 
                onChangeScreen={onChangeScreen} 
                SCREENS={SCREENS} 
            />

            <main className="alert-content">
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

                {viewModel.ongoingAlerts.length === 0 && viewModel.upcomingAlerts.length === 0 && (
                    <div className="no-alerts-message">Ingen aktive farevarsler i Norge akkurat nå.</div>
                )}
            </main>
        </div>
    );
}