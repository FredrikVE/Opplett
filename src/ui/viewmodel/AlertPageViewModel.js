//src/ui/viewmodel/AlertPageViewModel.js
import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/timeFormatters.js";

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
                setAlerts(result.alerts);
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

    //Hjelpefunksjon for å telle varsler per fylke innenfor valgt domene
    const getCountForCounty = (countyId) => {
        if (!countyId) {
            return alerts.filter(a => a.geographicDomain === activeDomain).length;
        }
        return alerts.filter(a => 
            a.geographicDomain === activeDomain && 
            a.county?.includes(countyId)
        ).length;
    };

    // ENDRING 3: Vi legger til fylkes-filtrering her i stedet for i API-kallet
    const filteredAlerts = alerts.filter(alert => {
        const matchesDomain = alert.geographicDomain === activeDomain;
        const matchesCounty = !selectedCounty || alert.county?.includes(selectedCounty); // Ny linje
        const matchesLevel = !selectedLevel || alert.riskMatrixColor === selectedLevel;
        const matchesType = !selectedType || alert.event === selectedType;
        
        return matchesDomain && matchesCounty && matchesLevel && matchesType; // Inkluder matchesCounty
    });

    const ongoingAlerts = filteredAlerts.filter(a => new Date(a.interval?.[0]) <= new Date());
    const upcomingAlerts = filteredAlerts.filter(a => new Date(a.interval?.[0]) > new Date());

    return {
        ongoingAlerts,
        upcomingAlerts,
        loading,
        error,
        activeDomain,
        setActiveDomain,
        selectedCounty,
        setSelectedCounty,
        selectedLevel,
        setSelectedLevel,
        selectedType,
        setSelectedType,
        getCountForCounty,

        counts: {
            land: alerts.filter(a => a.geographicDomain === "land").length,
            marine: alerts.filter(a => a.geographicDomain === "marine").length
        },
        
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, defaultTz)
    };
}