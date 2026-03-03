//test/model/repositories/LocationForecastRepository.test.js
import assert from "assert";
import { DateTime } from "luxon";
import LocationForecastRepository from "../../../src/model/repositories/LocationForecastRepository.js";
import MockLocationForecastDataSource from "../datasource/MockWeatherDataSource.js";


class LocationForecastRepositoryTestSuite {
    constructor() {
        const dataSource = new MockLocationForecastDataSource();
        this.repo = new LocationForecastRepository(dataSource);
        this.mockDS = dataSource;

        // Lås tid
        this.fixedNow = DateTime.fromISO("2026-03-03T10:30:00Z");
        DateTime.now = () => this.fixedNow;
    }

    async testGetHourlyForecast() {
        const result = await this.repo.getHourlyForecast(
            60.66,
            6.44,
            2,
            "Europe/Oslo"
        );

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].weatherSymbol, "rain");
        assert.strictEqual(result[0].temp, 4.1);
    }

    async testCaching() {
        await this.repo.getHourlyForecast(60.66, 6.44, 2, "Europe/Oslo");
        await this.repo.getHourlyForecast(60.66, 6.44, 2, "Europe/Oslo");

        assert.strictEqual(this.mockDS.callCount, 1);
    }

    async testCoordinateNormalization() {
        await this.repo.getHourlyForecast(200, 400, 1, "Europe/Oslo");

        assert.strictEqual(this.mockDS.lastLat, 90);
        assert.strictEqual(this.mockDS.lastLon, 40);
    }

    async testGetCurrentWeatherFallbacks() {
        const result = await this.repo.getCurrentWeather(
            60.66,
            6.44,
            "Europe/Oslo"
        );

        assert.strictEqual(result.feelsLike, result.temp);
        assert.strictEqual(result.gust, result.wind);
        assert.strictEqual(result.windDir, 0);
    }

    async testDailySummary() {
        const summary = await this.repo.getDailySummary(
            60.66,
            6.44,
            24,
            "Europe/Oslo"
        );

        const day = summary["2026-03-03"];

        assert.ok(day.totalPrecip >= 0);
        assert.ok(day.precipMax >= day.precipMin);
        assert.ok(typeof day.minTemp === "number");
        assert.ok(typeof day.maxTemp === "number");
    }

    async testTimezoneHalfHour() {
        const result = await this.repo.getHourlyForecast(
            60.66,
            6.44,
            1,
            "Asia/Kathmandu"
        );

        assert.strictEqual(result[0].localMinute, 45);
    }


    async testBufferThreshold() {
        // Grenseverdi: 10:46 i Oslo (mer enn 15 min av timen har gått)
        this.fixedNow = DateTime.fromISO("2026-03-03T10:46:00", { zone: "Europe/Oslo" });
        
        const result = await this.repo.getHourlyForecast(60, 10, 1, "Europe/Oslo");
        // Skal ha hoppet til neste time i lista
        assert.strictEqual(result[0].localTime, 11);
    }

    /*
    async testMidnightBoundary() {
        // Grenseverdi: 23:55 lokal tid
        this.fixedNow = DateTime.fromISO("2026-03-02T23:55:00", { zone: "Europe/Oslo" });
        
        const result = await this.repo.getHourlyForecast(60, 10, 1, "Europe/Oslo");
        // Siden det er < 15 min til midnatt, skal den vise kl 00:00 NESTE dag
        assert.strictEqual(result[0].localTime, 0);
        assert.strictEqual(result[0].dateISO, "2026-03-03"); 
    }
    */

    async testMidnightBoundary() {
        const tz = "Europe/Oslo";
        // Grenseverdi: 5 minutter før midnatt i Oslo
        // Vi må sørge for at fixedNow faktisk er i Oslo-tid!
        this.fixedNow = DateTime.fromObject(
            { year: 2026, month: 3, day: 2, hour: 23, minute: 55 }, 
            { zone: tz }
        );
        
        const result = await this.repo.getHourlyForecast(60, 10, 1, tz);

        // Her forventer vi at 23:55 runder opp til 00:00 (neste dag)
        console.log(`--- [BOUNDARY DEBUG] ---`);
        console.log(`Input tid: ${this.fixedNow.toString()}`);
        console.log(`Resultat time: ${result[0].localTime}:${result[0].localMinute}`);
        console.log(`Resultat dato: ${result[0].dateISO}`);

        assert.strictEqual(result[0].localTime, 0, "Skulle rundet opp til midnatt (00)");
        assert.strictEqual(result[0].dateISO, "2026-03-03", "Datoen skulle skiftet til neste dag");
    }



    async run() {
        await this.testGetHourlyForecast();
        await this.testCaching();
        await this.testCoordinateNormalization();
        await this.testGetCurrentWeatherFallbacks();
        await this.testDailySummary();
        await this.testTimezoneHalfHour();
        await this.testBufferThreshold();
        await this.testMidnightBoundary();
    }
}


async function main() {
    const suite = new LocationForecastRepositoryTestSuite();
    await suite.run();
    console.log("LocationForecastRepository tests passed");
}

main();