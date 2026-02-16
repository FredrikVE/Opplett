// src/ui/viewmodel/useAlertPageViewModel.js
import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/timeFormatters.js"; 

export default function useAlertPageViewModel(alertsRepository) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for å velge mellom 'land' eller 'marine' (kyst/hav)
    const [activeDomain, setActiveDomain] = useState("land");

    const defaultTz = "Europe/Oslo";

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await alertsRepository.getAllAlerts();
                setAlerts(result.alerts);
            } 
            catch (error) {
                console.log(error)
                setError("Kunne ikke hente varsler");
            } 
            
            finally {
                setLoading(false);
            }
        }
        load();
    }, [alertsRepository]);

    //Filtrer basert på geographicDomain-attributten fra API-et
    const filteredByDomain = alerts.filter(a => a.geographicDomain === activeDomain);

    //Del opp i Pågår og Ventes
    const ongoingAlerts = filteredByDomain.filter(a => new Date(a.interval?.[0]) <= new Date());
    const upcomingAlerts = filteredByDomain.filter(a => new Date(a.interval?.[0]) > new Date());

    //Tellere for knappene i UI
    const countLand = alerts.filter(a => a.geographicDomain === "land").length;
    const countMarine = alerts.filter(a => a.geographicDomain === "marine").length;

    return {
        ongoingAlerts,
        upcomingAlerts,
        loading,
        error,
        activeDomain,
        setActiveDomain,
        counts: { land: countLand, marine: countMarine },
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, defaultTz)
    };
}