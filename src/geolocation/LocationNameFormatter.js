// src/utils/location/LocationNameFormatter.js
export default class LocationNameFormatter {
    
    constructor() {
        this.usaVariants = new Set([
            "usa", "united states", "united states of america", 
            "us", "amerikas forente stater", "de forente stater", 
            "de forente stater i amerika"
        ]);

        this.unnamedMarkers = ["unnamed road", "ubenyttet vei", "ukjent vei"];
        
        // Lager en ferdig "regnemaskin" (Regex) for å sjekke uønskede veier raskt
        this.unnamedRegex = new RegExp(this.unnamedMarkers.join('|'), 'i');
    }

    /**
     * Hovedmetode som koordinerer formateringen
     */
    format(loc) {
        if (!loc) return "";

        const rawName = loc.displayName || loc.label || loc.name || loc.city || "";

        if (!rawName) {
            return this._getCoordinateFallback(loc.lat, loc.lon);
        }

        let parts = this._splitAndClean(rawName);

        if (parts.length === 0) return rawName;

        parts = this._applyCountryRules(parts);

        return parts.join(", ");
    }

    /**
     * Deler opp strengen, fjerner tall og uønskede markører ved bruk av funksjonell programmering
     * @private
     */
    _splitAndClean(rawName) {
        const rawParts = rawName.split(",");
        const cleanParts = [];

        for (let part of rawParts) {
            //Fjern tall med Regex fordi dette er raksere enn forløkker
            const cleaned = part.replace(/\d+/g, '').trim();
            
            if (!cleaned) {
				continue;
			}

            //Sjekk mot "unnamed road" markører (Regex er mer effektivt enn .some())
            const isUnnamed = this.unnamedRegex.test(cleaned);
            
            //Sjekk for duplikater
            const isDuplicate = cleanParts.includes(cleaned);

            if (!isUnnamed && !isDuplicate) {
                cleanParts.push(cleaned);
            }
        }

        return cleanParts;
    }

    /**
     * Håndterer forkortelser og fjerning av landnavn
     * @private
     */
    _applyCountryRules(parts) {
        const lastIndex = parts.length - 1;
        const lastLower = parts[lastIndex].toLowerCase();

        const isNorway = lastLower === "norge" || lastLower === "norway";
        // Bruker Set.has() som er O(1) - lynraskt uansett hvor mange varianter vi har
        const isUSA = this.usaVariants.has(lastLower);

        if (isNorway && parts.length > 1) {
            parts.pop();
        }
		
		else if (isUSA) {
            parts[lastIndex] = "USA";
        }

        return parts;
    }

    /**
     * Fallback til koordinater med fast presisjon
     * @private
     */
    _getCoordinateFallback(lat, lon) {
        const hasCoords = typeof lat === "number" && typeof lon === "number";
        return hasCoords ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "";
    }
}