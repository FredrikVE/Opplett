// src/ui/viewmodel/useAlertPageViewModel.js
import { useState, useEffect } from "react";
import { formatLocalDateTime } from "../utils/timeFormatters.js"; 

export default function useAlertPageViewModel(alertsRepository) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Siden farevarsler kun finnes for Norge, bruker vi Oslo-tidssone som standard
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

    // Bruk useMemo her hvis du vil optimalisere filtreringen, 
    // men for en enkel liste fungerer dette fint:
    const ongoingAlerts = alerts.filter(a => new Date(a.interval?.[0]) <= new Date());
    const upcomingAlerts = alerts.filter(a => new Date(a.interval?.[0]) > new Date());

    return {
        ongoingAlerts,
        upcomingAlerts,
        loading,
        error,
        // Vi sender med funksjonen bundet til norsk tidssone
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, defaultTz)
    };
}