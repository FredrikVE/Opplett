// SunriseRepository.js
export default class SunriseRepository {

    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
    }

    async getSunTimes(lat, lon, dateISO, offset) {

        const result = await this.datasource.fetchSunrise(lat, lon, dateISO, offset);
        const properties = result.properties;

        return {
            // Sunrise-API returnerer allerede lokal tid
            sunrise: properties.sunrise?.time?.slice(11, 16) ?? null,
            sunset: properties.sunset?.time?.slice(11, 16) ?? null
        };
    }
}


import SunriseDataSource from "../datasource/SunriseDataSource.js"
async function testSunrise() {
    const lat = 59.86;
    const lon = 10.82;
    const dateISO = "2026-01-22";
    const offset = "+01:00";

    const datasource = new SunriseDataSource();
    const repository = new SunriseRepository(datasource);

    try {
        const sunTimes = await repository.getSunTimes(lat, lon, dateISO, offset);

        console.log("Soldata:");
        console.log(`\t- Soloppgang: ${sunTimes.sunrise}`);
        console.log(`\t- Solnedgang: ${sunTimes.sunset}`);
        console.log();
    } catch (error) {
        console.error("Feil ved henting av soldata:");
        console.error(error);
    }
}

testSunrise();
