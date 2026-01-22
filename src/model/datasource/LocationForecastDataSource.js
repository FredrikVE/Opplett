//src/model/datasource/LocationForecastDataSource.js
import DataSource from "./DataSource.js";

export default class LocationForecastDataSource extends DataSource {

    async fetchLocationForecast(lat, lon) {
        //const apiVersion = "compact"
        const apiVersion = "complete"
        const path = `weatherapi/locationforecast/2.0/${apiVersion}?lat=${lat}&lon=${lon}`;

        return this.get(path);
    }
}

//testmain
/*
async function main() {
    const datasource = new LocationForecastDataSource();
    const lat = 60.10;
    const lon = 9.58;

    try {
        const forecast = await datasource.fetchLocationForecast(lat, lon);

        console.log("Forecast received successfully!");
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log(JSON.stringify(forecast, null, 2));
    }

    catch(error) {
        console.log("Error fetching forecast: ", error.message);
    }
}

main();
*/