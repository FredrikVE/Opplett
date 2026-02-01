//src/model/datasource/SunriseDataSource.js
import DataSource from "./DataSource.js";

export default class SunriseDataSource extends DataSource {
  async fetchSunrise(lat, lon, dateISO, offset) {
    let path =
      `weatherapi/sunrise/3.0/sun` +
      `?lat=${lat}` +
      `&lon=${lon}` +
      `&date=${dateISO}`;

    // offset er valgfritt – ikke send param om den er undefined/null
    if (offset != null) {
      path += `&offset=${encodeURIComponent(offset)}`;
    }

    return this.get(path);
  }
}