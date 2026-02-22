//src/model/domain/GetSunTimesUseCase.js
export default class GetSunTimesUseCase {

	constructor(sunriseRepository) {
		this.sunriseRepository = sunriseRepository;
	}

	async execute({ lat, lon, isoDates, timeZone, formatToLocalTime }) {
		if (!lat || !lon || !isoDates?.length) {
			throw new Error("Missing required parameters for sun times");
		}

		return this.sunriseRepository.getFullSolarReport(
			lat,
			lon,
			isoDates,
			timeZone,
			formatToLocalTime
		);
	}
}