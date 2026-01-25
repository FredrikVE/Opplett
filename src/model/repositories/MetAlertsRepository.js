//src/model/repository/MetAlertsRepository.js
export default class MetAlertsRepository {
    
    constructor(metAlertDataSource) {
        this.dataSource = metAlertDataSource;
    }

    async findAlerts(lat, lon) {
        try {
            const data = await this.dataSource.fetchMetalerts(lat, lon);

            const alerts = [];

            if (data.features) {

                for (const feature of data.features) {
                    const property = feature.properties;

                    alerts.push({
                        area: property.area,
                        awarenessResponse: property.awarenessResponse,
                        awarenessSeriousness: property.awarenessSeriousness,
                        awarenessLevel: property.awareness_level,
                        awarenessType: property.awareness_type,
                        consequences: property.consequences,
                        contact: property.contact,
                        description: property.description,
                        event: property.event,
                        eventAwarenessName: property.eventAwarenessName,
                        instruction: property.instruction,
                        resources: property.resources,
                        severity: property.severity,
                        moreInfoURL: property.web,
                        riskColor: property.riskMatrixColor,
                        interval: feature.when.interval,
                    });
                }
            }

            // MetAlerts returnerer normalt 0–1 aktive varsler per punkt.
            return { alerts };

        } 
        
        catch (error) {
            console.error("Error fetching alerts:", error);
            return { alerts: [] };
        }
    }
}

/*
//Testmain
import MetAlertsDataSource from "../datasource/MetAlertsDataSource.js";

const repo = new MetAlertsRepository(new MetAlertsDataSource());
async function main() {
     //hammerfest (to farevarsler samtidig)
    const lat = 70.674705
    const lon = 23.667911
    //stavanger
    //const lat = 58.952071;
    //const lon = 5.671383;

    const result = await repo.findAlerts(lat, lon);

    console.log(result);    
}


main();
*/