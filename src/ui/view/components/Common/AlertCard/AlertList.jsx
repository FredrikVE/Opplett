// src/ui/view/components/HomePage/AlertCard/AlertList.jsx
import { useState } from "react";
import AlertCard from "./AlertCard.jsx";

export default function AlertList({ alerts, formatLocalDateTime }) {

	//State som holder styr på hvilken alert som er åpen og ikke
	const [openAlertId, setOpenAlertId] = useState(null);

	//Hvis ingen alerts, render vi ingenting
	if (!alerts || alerts.length === 0) {
		return null;
	}

	//Funksjon for å toggle et alertCard
	const handleToggle = (clickedAlertId) => {

		const isSameAlert = openAlertId === clickedAlertId;

		if (isSameAlert) {
			setOpenAlertId(null);       //Lukker hvis samme er klikket på.
		} 
		else {
			setOpenAlertId(clickedAlertId);  //Åpner ny hvis ny er klikket på.
		}
	}

	return (
		<div className="alerts-list-container">
			{alerts.map((alert) => {

				const isThisAlertOpen = openAlertId === alert.id;

				return (
					<AlertCard
						key={alert.id}
						alert={alert}
						isOpen={isThisAlertOpen}
						onToggle={() => handleToggle(alert.id)}
						formatLocalDateTime={formatLocalDateTime}
					/>
				);
			})}
		</div>
	);
}
