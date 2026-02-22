//src/model/domain/GetForecastUseCase.js
export default class GetForecastUseCase {

	// Konstruktør for å ta inn forecastRepository fra App.jsx
	constructor(forecastRepository) {
		this.forecastRepository = forecastRepository;
	}

	async execute({ lat, lon, hoursAhead, timeZone }) {

		if (lat == null || lon == null) {
			throw new Error("Latitude and longitude are required");
		}

		// Henter time-for-time værdata
		const hourly = await this.forecastRepository.getHourlyForecast(
			lat,
			lon,
			hoursAhead,
			timeZone
		);

		// Grupperer timer per dato
		const hourlyByDate = {};
		for (const hour of hourly) {
			if (!hourlyByDate[hour.dateISO]) {
				hourlyByDate[hour.dateISO] = { hours: [] };
			}
			hourlyByDate[hour.dateISO].hours.push(hour);
		}

		// Henter dagsoppsummering
		const dailySummaryByDate =
			await this.forecastRepository.getDailySummary(
				lat,
				lon,
				hoursAhead,
				timeZone
			);

		return {
			hourlyByDate,
			dailySummaryByDate
		};
	}
}