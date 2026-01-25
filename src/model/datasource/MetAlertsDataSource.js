//src/model/datasource/MetAlertsDataSource.js
import DataSource from "./DataSource.js";

export default class MetAlertsDataSource extends DataSource {
    
    async fetchMetalerts(lat, lon) {
        const path = `weatherapi/metalerts/2.0/current.json?lat=${lat}&lon=${lon}`;
        return this.get(path);
    }
}

/*
async function main() {

    const datasource = new MetAlertsDataSource();
    
    //hammerfest (to farevarsler samtidig)
    const lat = 70.674705
    const lon = 23.667911



    //bruker stavanger fordi det er en farevarsel i rogaland om skogbrannfare
    const lat = 58.952071
    const lon = 5.671383

    try {
        const alerts = await datasource.fetchMetalerts(lat, lon);

        console.log("Alerts received successfully!");
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log(JSON.stringify(alerts, null, 2));
    }

    catch(error) {
        console.log("Error fetching forecast: ", error.message);
    }
    
}
main()
*/