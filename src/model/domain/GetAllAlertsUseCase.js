// src/model/domain/GetAllAlertsUseCase.js
export default class GetAllAlertsUseCase {
	constructor(alertsRepository) {
		this.alertsRepository = alertsRepository;
	}

	async execute({ countyId } = {}) {
		// Delegér rett videre til repository.
		// Vi kan senere legge på ekstra domenelogikk her hvis vi vil.
		return this.alertsRepository.getAllAlerts(countyId);
	}
}