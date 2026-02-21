//src/ui/view/components/AlertPage/EmptyAlertMessage.jsx
export default function EmptyAlertMessage({ allAlerts, isLandActive, viewModel }) {
	//Hvis vi har varsler, skal vi ikke vise noen melding
	if (allAlerts.length > 0) {
		return null;
	}

	//Finn ut om det i det hele tatt finnes varsler for valgt domene (før filtrering)
	const totalInDomain = isLandActive ? viewModel.counts.land : viewModel.counts.marine;
	const hasNoAlertsAtAll = totalInDomain === 0;

	//Bestem domenetekst
	let domainLabel = "hav og kyst";
	if (isLandActive) {
		domainLabel = "land";
	}

	//Bestem selve meldingen eksplisitt
	let messageText = "Ingen aktive farevarsler for " + domainLabel + " med valgte filtre.";
	
	if (hasNoAlertsAtAll) {
		messageText = "Det er for øyeblikket ingen aktive farevarsler i Norge for " + domainLabel + ".";
	}

	return (
		<div className="no-alerts-message">
			{messageText}
		</div>
	);
}