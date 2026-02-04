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

            return { alerts };

        } 
        
        catch (error) {
            console.error("Error fetching alerts:", error);
            return { alerts: [] };
        }
    }
}