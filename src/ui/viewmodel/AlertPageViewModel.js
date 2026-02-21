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
                const result = await alertsRepository.getAllAlerts(selectedCounty);
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

    }, [alertsRepository, selectedCounty]);

    //Hjelpefunksjon for å telle varsler per fylke innenfor valgt domene
    const getCountForCounty = (countyId) => {
        if (!countyId) {
            // Denne teller alle varsler uavhengig av om de har fylkesinfo eller ikke
            return alerts.filter(a => a.geographicDomain === activeDomain).length;
        }

        return alerts.filter(a => 
            a.geographicDomain === activeDomain && 
            a.county?.includes(countyId) // NÅ fungerer denne fordi county er mappet!
        ).length;
    };

    //Filtreringslogikk for listevisning
    const filteredAlerts = alerts.filter(alert => {
        const matchesDomain = alert.geographicDomain === activeDomain;
        const matchesLevel = !selectedLevel || alert.riskMatrixColor === selectedLevel;
        const matchesType = !selectedType || alert.event === selectedType;
        return matchesDomain && matchesLevel && matchesType;
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