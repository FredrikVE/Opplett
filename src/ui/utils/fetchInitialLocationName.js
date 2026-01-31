//src/ui/utils/fetchInitialLocationName.js
export async function fetchInitialLocationName (setLocation ,geocodingRepository, initialLat, initialLon) {
    try {
        //henter koordinater fra geocoding repo
        const result = await geocodingRepository.getCoordinates(`${initialLat}, ${initialLon}`);
        if (result?.name) {

            //Oppdaterer lokasjonen dersom det finnes et navn.
            setLocation({lat: initialLat, lon: initialLon, name: result.name, timezone: result.timezone});
        }
    } 
    
    catch (error) {
        // stille fail – appen funker fortsatt uten navn
        console.warn("Kunne ikke hente stedsnavn", error);
    }
}