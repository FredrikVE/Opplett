//src/ui/viewmodel/AlertPageViewModel.js
import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/timeFormatters.js";
import { getRiskLevelText } from "../utils/getRiskLevelText.js";

export default function useAlertPageViewModel(alertsRepository) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDomain, setActiveDomain] = useState("land");
    
    // Filter-states
    const [selectedCounty, setSelectedCounty] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const defaultTz = "Europe/Oslo";

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await alertsRepository.getAllAlerts(); 
                
                // Vasker data: Beholder kun varsler som har en definert tekst (fjerner "Green")
                const actualWarnings = result.alerts.filter(a => 
                    getRiskLevelText(a.riskMatrixColor) !== ""
                );
                
                setAlerts(actualWarnings);
            } 

            catch (error) {
                console.error(error);
                setError("Kunne ikke hente varsler");
            }

            finally {
                setLoading(false);
            }
        }
        load();
    }, [alertsRepository]); 

    // Nullstiller filter ved domene-bytte
    const handleSetDomain = (domain) => {
        setSelectedCounty("");
        setActiveDomain(domain);
    };

    // Hjelpefunksjon for å telle varsler per lokasjon (fylke eller område)
    const getCountForLocation = (locationId) => {
        if (!locationId) {
            return alerts.filter(a => a.geographicDomain === activeDomain).length;
        }

        return alerts.filter(a => 
            a.geographicDomain === activeDomain && 
            (a.county?.includes(locationId) || a.area === locationId)
        ).length;
    };

    // Filtreringslogikk for listevisning
    const filteredAlerts = alerts.filter(alert => {
        const matchesDomain = alert.geographicDomain === activeDomain;
        const matchesLevel = !selectedLevel || alert.riskMatrixColor === selectedLevel;
        const matchesType = !selectedType || alert.event === selectedType;
        const matchesLocation = !selectedCounty || 
                                alert.county?.includes(selectedCounty) || 
                                alert.area === selectedCounty;

        return matchesDomain && matchesLevel && matchesType && matchesLocation;
    });

    const ongoingAlerts = filteredAlerts.filter(a => new Date(a.interval?.[0]) <= new Date());
    const upcomingAlerts = filteredAlerts.filter(a => new Date(a.interval?.[0]) > new Date());

    return {
        ongoingAlerts,
        upcomingAlerts,
        loading,
        error,
        activeDomain,
        setActiveDomain: handleSetDomain,
        selectedCounty,
        setSelectedCounty,
        selectedLevel,
        setSelectedLevel,
        selectedType,
        setSelectedType,
        getCountForLocation, 

        counts: {
            land: alerts.filter(a => a.geographicDomain === "land").length,
            marine: alerts.filter(a => a.geographicDomain === "marine").length
        },
        
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, defaultTz)
    };
}