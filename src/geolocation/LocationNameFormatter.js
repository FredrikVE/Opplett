// src/utils/location/LocationNameFormatter.js
export default class LocationNameFormatter {
    constructor() {
        this.unnamedMarkers = ["unnamed road", "ubenyttet vei", "ukjent vei", "nordsjøen", "norskehavet"];
        this.unnamedRegex = new RegExp(this.unnamedMarkers.join('|'), 'i');
    }

    /**
     * @param {Object} loc - Lokasjonsobjektet
     * @param {boolean} isMapIcon - Hvis true, fjernes ALT unntatt gatenavn/stedsnavn
     */
    format(loc, isMapIcon = false) {
        if (!loc) return "";

        const rawName = loc.name || loc.displayName || loc.label || "";
        if (!rawName) return this._getCoordinateFallback(loc.lat, loc.lon);

        let parts = this._splitAndClean(rawName);
        if (parts.length === 0) return rawName;

        // Standard vasking (fjerner "Norge", fikser "USA")
        parts = this._applyCountryRules(parts);

        // SPESIFIKK LOGIKK FOR VÆRIKONER:
        if (isMapIcon) {
            // Vi tar kun det første leddet (gatenavnet)
            return parts[0]; 
        }

        // LOGIKK FOR OVERSKRIFTER OG SØK:
        // Her beholder vi f.eks "Mellombølgen, Oslo"
        return parts.join(", ");
    }

    _splitAndClean(rawName) {
        const rawParts = rawName.split(",");
        const cleanParts = [];

        for (let part of rawParts) {
            // Fjerner tall og husnummer-bokstaver (7b, 150 osv)
            let cleaned = part.replace(/\b\d+[a-z]?\b/gi, '').trim();
            
            if (!cleaned || cleaned.length <= 1) continue;
            if (this.unnamedRegex.test(cleaned)) continue;

            if (!cleanParts.some(p => p.toLowerCase() === cleaned.toLowerCase())) {
                cleanParts.push(cleaned);
            }
        }
        return cleanParts;
    }

    _applyCountryRules(parts) {
        if (parts.length <= 1) return parts;
        const lastLower = parts[parts.length - 1].toLowerCase();
        if (lastLower === "norge" || lastLower === "norway") {
            parts.pop();
        }
        return parts;
    }

    _getCoordinateFallback(lat, lon) {
        return (lat != null && lon != null) ? `${lat.toFixed(2)}, ${lon.toFixed(2)}` : "";
    }
}