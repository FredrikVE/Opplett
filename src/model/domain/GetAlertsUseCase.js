//src/model/domain/GetAlertsUseCase.js
export default class GetAlertsUseCase {

	// Tar inn alertsRepository fra App.jsx
	constructor(alertsRepository) {
		this.alertsRepository = alertsRepository;
	}

	async execute({ lat, lon }) {

		if (lat == null || lon == null) {
			throw new Error("Latitude and longitude are required");
		}

		// Henter varsler fra repository
		const { alerts, alertsByDate } =
			await this.alertsRepository.findAlerts(lat, lon);

		return {
			alerts,
			alertsByDate
		};
	}
}