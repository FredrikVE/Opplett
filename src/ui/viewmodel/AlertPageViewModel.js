import { useState, useEffect, useMemo } from "react";
import { formatLocalDateTime } from "../utils/TimeZoneUtils/timeFormatters.js";
import { getRiskLevelText } from "../utils/CommonUtils/getRiskLevelText.js";

export default function useAlertPageViewModel(alertsRepository) {
    
    //Statevariabler for alert-data, loading og error
    const [allAlerts, setAllAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    //Filter-tilstander
    const [activeDomain, setActiveDomain] = useState("land");
    const [selectedCounty, setSelectedCounty] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const defaultTz = "Europe/Oslo";

    //Hook for datahenting
    useEffect(() => {

        const fetchAlerts = async () => {
            try {
                setLoading(true);
                const { alerts } = await alertsRepository.getAllAlerts();
                
                // Beholder kun varsler med gyldig risikonivå (fjerner "grønne/ufarlige" varsler)
                const validAlerts = alerts.filter(a => getRiskLevelText(a.riskMatrixColor) !== "");
                
                setAllAlerts(validAlerts);
                setError(null);
            } 

            catch (err) {
                console.error("Feil ved henting av varsler:", err);
                setError("Kunne ikke laste inn varsler. Vennligst prøv igjen senere.");
            } 

            finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, 
    [alertsRepository]);


    //Nullstiller filtre når man bytter mellom Land/Sjø
    const changeDomain = (domain) => {
        setSelectedCounty("");
        setSelectedType("");
        setSelectedLevel("");
        setActiveDomain(domain);
    };

    //Global telling for tabs/knapper (uavhengig av filtre)
    const counts = useMemo(() => ({
        land: allAlerts.filter(a => a.geographicDomain === "land").length,
        marine: allAlerts.filter(a => a.geographicDomain === "marine").length
    }),

    [allAlerts]);

    // Hovedfiltrering: Kjøres kun når data eller filtre endres
    const filteredAlerts = useMemo(() => {

        return allAlerts.filter(alert => {    
            
            //Domene-sjekk for sjø eller land
            if (alert.geographicDomain !== activeDomain) {
                return false;
            }
            
            //Fare-nivå-sjekk
            if (selectedLevel && alert.riskMatrixColor !== selectedLevel) {
                return false;
            }
            
            //Sjekk for faretype (Snø, Vind, etc.)
            if (selectedType && alert.event !== selectedType) {
                return false;
            }
            
            //Sjekk for advarselsområde som fylke eller havpolygon
            if (selectedCounty) {
                const matchesCounty = alert.county?.includes(selectedCounty);
                const matchesArea = alert.area === selectedCounty;
                if (!matchesCounty && !matchesArea) {
                    return false;
                }
            }

            //Hvis ingen av de over returnerte false, er varslet godkjent
            return true;
        });
    }, 

    [allAlerts, activeDomain, selectedLevel, selectedType, selectedCounty]);

    //Deler varsler inn i pågående og kommende varsler
    const { ongoingAlerts, upcomingAlerts } = useMemo(() => {
        const now = new Date();

        const ongoing = [];
        const upcoming = [];

        filteredAlerts.forEach(alert => {
            const startTime = new Date(alert.interval?.[0]);
            const hasStarted = startTime <= now;

            if (hasStarted) {
                ongoing.push(alert);
            } 

            else {
                upcoming.push(alert);
            }
        });

        return { 
            ongoingAlerts: ongoing, 
            upcomingAlerts: upcoming 
        };
    }, 

    [filteredAlerts]);

    //Hjelpefunksjon for å telle varsler i en spesifikk region
    const getCountForLocation = (locationId) => {
        let count = 0;

        for (const alert of allAlerts) {
            // Vi bryr oss bare om varsler i det aktive domenet (land eller marine)
            if (alert.geographicDomain === activeDomain) {
                
                if (!locationId) {
                    count++;    // Hvis ingen spesifikk lokasjon er valgt, teller vi alt i domenet
                } 
                
                else {
                    // Hvis en lokasjon er valgt, sjekker vi om varslet matcher
                    const isMatch = alert.county?.includes(locationId) || alert.area === locationId;
                    
                    if (isMatch) {
                        count++;
                    }
                }
            }
        }
        return count;
    };
 

    return {
        //Data
        ongoingAlerts,
        upcomingAlerts,
        loading,
        error,
        counts,
        
        //Filter-verdier
        activeDomain,
        selectedCounty,
        selectedLevel,
        selectedType,

        //Setters
        setActiveDomain: changeDomain,
        setSelectedCounty,
        setSelectedLevel,
        setSelectedType,
        
        //Hjelpefunksjoner
        getCountForLocation,
        formatLocalDateTime: (zulu) => formatLocalDateTime(zulu, defaultTz)
    };
}