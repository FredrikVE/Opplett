//test/model/datasource/MockWeatherDataSource.js
import { mockWeatherResponse } from "../data/weather.mock.js";

export default class MockLocationForecastDataSource {
    constructor() {
        this.callCount = 0;
    }

    async fetchLocationForecast(lat, lon) {
        this.callCount++;

        this.lastLat = lat;
        this.lastLon = lon;

        return mockWeatherResponse;
    }
}