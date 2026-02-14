// src/model/repository/MetAlertsRepository.js
export default class MetAlertsRepository {
    
    constructor(metAlertDataSource) {
        this.dataSource = metAlertDataSource;
    }

    async findAlerts(lat, lon) {
        try {
            const data = await this.dataSource.fetchMetalerts(lat, lon);

            if (!data || !data.features) {
                return { alerts: [], alertsByDate: {} };
            }

            //Map rådata til et konsistent og rent format (Data Mapping)
            const alerts = data.features.map((feature) => {
                const p = feature.properties;
                
                return {
                    //Vi foretrekker id fra intervallet eller event-navnet som unik nøkkel
                    id: feature.when?.interval?.[0] || p.event,
                    area: p.area,
                    awarenessResponse: p.awarenessResponse,
                    awarenessSeriousness: p.awarenessSeriousness,
                    awarenessLevel: p.awareness_level,
                    awarenessType: p.awareness_type,
                    consequences: p.consequences,
                    contact: p.contact,
                    description: p.description,
                    event: p.event,
                    eventAwarenessName: p.eventAwarenessName,
                    instruction: p.instruction,
                    resources: p.resources,
                    severity: p.severity,
                    moreInfoURL: p.web,
                    riskMatrixColor: p.riskMatrixColor, // Brukes til styling (Yellow, Orange, Red)
                    interval: feature.when?.interval,   // [startISO, endISO]
                };
            });

            //Organiser varsler per dato (Preprocessing for UI)
            const alertsByDate = {};

            alerts.forEach((alert) => {
                if (alert.interval && alert.interval.length >= 2) {
                    
                    //Vi bruker midlertidige dato-objekter for å iterere gjennom dager
                    const startDate = new Date(alert.interval[0].split('T')[0]);
                    const endDate = new Date(alert.interval[1].split('T')[0]);

                    let currentDate = new Date(startDate);

                    //Gå gjennom hver dag varselet er aktivt
                    while (currentDate <= endDate) {
                        const dateKey = currentDate.toISOString().split('T')[0];

                        if (!alertsByDate[dateKey]) {
                            alertsByDate[dateKey] = [];
                        }

                        //Sjekk for å unngå duplikater (hvis API-et sender samme varsel flere ganger)
                        const alreadyAdded = alertsByDate[dateKey].some(a => a.id === alert.id);
                        if (!alreadyAdded) {
                            alertsByDate[dateKey].push(alert);
                        }

                        //Gå til neste dag
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            });

            return { alerts, alertsByDate };

        } 
        catch (error) {
            console.error("MetAlertsRepository: Error fetching and processing alerts:", error);
            return { alerts: [], alertsByDate: {} };
        }
    }
}