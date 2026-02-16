// src/ui/viewmodel/useAlertPageViewModel.js
import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/timeFormatters.js";

export default function useAlertPageViewModel(alertsRepository) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDomain, setActiveDomain] = useState("land");
    
    // Filter-states
    const [selectedCounty, setSelectedCounty] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedType, setSelectedType] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // Vi henter alle varsler for fylket (eller hele landet hvis empty)
                const result = await alertsRepository.getAllAlerts(selectedCounty);
                setAlerts(result.alerts);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [alertsRepository, selectedCounty]);

    // Filtreringslogikk for alle dropdowns + domene
    const filteredAlerts = alerts.filter(alert => {
        const matchesDomain = alert.geographicDomain === activeDomain;
        
        // Sjekk farenivå (Yellow, Orange, Red)
        const matchesLevel = !selectedLevel || alert.riskMatrixColor === selectedLevel;
        
        // Sjekk faretype (event)
        const matchesType = !selectedType || alert.event === selectedType;

        return matchesDomain && matchesLevel && matchesType;
    });

    // Tellere for knappene (basert på nåværende filtre, men uavhengig av domene)
    const countLand = alerts.filter(a => a.geographicDomain === "land").length;
    const countMarine = alerts.filter(a => a.geographicDomain === "marine").length;

    return {
        ongoingAlerts: filteredAlerts.filter(a => new Date(a.interval?.[0]) <= new Date()),
        upcomingAlerts: filteredAlerts.filter(a => new Date(a.interval?.[0]) > new Date()),
        loading,
        activeDomain,
        setActiveDomain,
        selectedCounty,
        setSelectedCounty,
        selectedLevel,
        setSelectedLevel,
        selectedType,
        setSelectedType,
        counts: { land: countLand, marine: countMarine },
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, "Europe/Oslo")
    };
}