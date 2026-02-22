//src/model/domain/GetForecastUseCase.js
export default class GetForecastUseCase {

	//Konstruktør for å ta inn repositories i App.jsx
	constructor(forecastRepository, sunriseRepository, alertsRepository) {
		this.forecastRepository = forecastRepository;
		this.sunriseRepository = sunriseRepository;
		this.alertsRepository = alertsRepository;
	}

	async execute({ lat, lon, hoursAhead, timeZone, formatToLocalTime }) {
		if (!lat || !lon) {
			throw new Error("Latitude and longitude are required");
		}

		const hourly = await this.forecastRepository.getHourlyForecast(lat, lon, hoursAhead, timeZone);

		const hourlyByDate = {};
		for (const hour of hourly) {
			if (!hourlyByDate[hour.dateISO]) {
				hourlyByDate[hour.dateISO] = { hours: [] };
			}
			hourlyByDate[hour.dateISO].hours.push(hour);
		}

		const dailySummaryByDate = await this.forecastRepository.getDailySummary(lat, lon, hoursAhead, timeZone);
		const { alerts, alertsByDate } = await this.alertsRepository.findAlerts(lat, lon);
		const isoDates = Object.keys(hourlyByDate);
		const sunTimesByDate = await this.sunriseRepository.getFullSolarReport(lat, lon, isoDates, timeZone, formatToLocalTime);

		return {
			hourlyByDate,
			dailySummaryByDate,
			sunTimesByDate,
			alerts,
			alertsByDate
		};
	}
}