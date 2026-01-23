//src/model/datasource/SunriseDataSource.js
import DataSource from "./DataSource.js";

export default class SunriseDataSource extends DataSource {

    async fetchSunrise(lat, lon, dateISO, offset) {
        const path =
            `weatherapi/sunrise/3.0/sun` +
            `?lat=${lat}` +
            `&lon=${lon}` +
            `&date=${dateISO}` +
            `&offset=${encodeURIComponent(offset)}`;

        return this.get(path);
    }
}
