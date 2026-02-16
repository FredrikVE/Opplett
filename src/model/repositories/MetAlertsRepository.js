// src/model/repository/MetAlertsRepository.js
export default class MetAlertsRepository {
    
    constructor(metAlertDataSource) {
        this.dataSource = metAlertDataSource;
    }

    // Finn varsler for en spesifikk posisjon
    async findAlerts(lat, lon) {
        try {
            const data = await this.dataSource.fetchMetalerts(lat, lon);
            return this._mapAndProcessData(data);
        } 
		
		catch (error) {
            console.error("MetAlertsRepository (findAlerts):", error);
            return { alerts: [], alertsByDate: {} };
        }
    }

    //Finn ALLE varsler i Norge (valgfritt filtrert på fylke)
    async getAllAlerts(countyId = null) {
        try {
            const data = await this.dataSource.fetchAllMetalerts(countyId);
            return this._mapAndProcessData(data);
        } 
		
		catch (error) {
            console.error("MetAlertsRepository (getAllAlerts):", error);
            return { alerts: [], alertsByDate: {} };
        }
    }

    // Privat hjelpemetode for å transformere rådata fra MET
    _mapAndProcessData(data) {
        if (!data || !data.features) {
            return { alerts: [], alertsByDate: {} };
        }

        // 1. Data Mapping
        const alerts = data.features.map((feature) => {
            const p = feature.properties;
            return {
                id: p.id || feature.when?.interval?.[0] || p.event,
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
                riskMatrixColor: p.riskMatrixColor,
                interval: feature.when?.interval,
                geographicDomain: p.geographicDomain // Nyttig for å skille Land/Hav i UI
            };
        });

        //Preprocessing for UI (Organiser per dato)
        const alertsByDate = {};
        alerts.forEach((alert) => {
            if (alert.interval && alert.interval.length >= 2) {
                const startDate = new Date(alert.interval[0].split('T')[0]);
                const endDate = new Date(alert.interval[1].split('T')[0]);

                let currentDate = new Date(startDate);

                while (currentDate <= endDate) {
                    const dateKey = currentDate.toISOString().split('T')[0];

                    if (!alertsByDate[dateKey]) {
                        alertsByDate[dateKey] = [];
                    }

                    const alreadyAdded = alertsByDate[dateKey].some(a => a.id === alert.id);
                    
					if (!alreadyAdded) {
                        alertsByDate[dateKey].push(alert);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });

        return { alerts, alertsByDate };
    }
}