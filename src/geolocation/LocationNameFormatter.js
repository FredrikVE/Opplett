// src/utils/location/LocationNameFormatter.js
export default class LocationNameFormatter {
	
	//Definerer reglene som instansvariabler i constructoren
	constructor() {
		this.usaVariants = ["usa", "united states", "united states of america", 
							"us", "amerikas forente stater", "de forente stater", 
							"de forente stater i amerika"];

		this.unnamedMarkers = ["unnamed road", "ubenyttet vei", "ukjent vei"];
	}

	
	//Hovedmetode som koordinerer formateringen
	format(loc) {
		if (!loc) {
			return "";
		}

		//Finner kilde fra OpenCage
		const rawName = loc.displayName || loc.label || loc.name || loc.city || "";

		if (!rawName) {
			return this._getCoordinateFallback(loc.lat, loc.lon);
		}

		//Kjør vaskeprosessen
		let parts = this._splitAndClean(rawName);

		if (parts.length === 0) {
			return rawName;
		}

		//Påfør land-spesifikke regler
		parts = this._applyCountryRules(parts);

		return parts.join(", ");
	}

	/**
	 * Deler opp strengen og fjerner tall/unnamed road
	 * @private
	 */
	_splitAndClean(rawName) {
		const rawParts = rawName.split(",");
		const cleanParts = [];

		for (const part of rawParts) {
			const cleaned = this._removeNumbers(part);
			const lowerCleaned = cleaned.toLowerCase();

			//Sjekker om delen er gyldig (ikke tom, ikke unnamed, ikke duplikat)
			const isUnnamed = this.unnamedMarkers.some(marker => lowerCleaned.includes(marker));
			const isEmpty = cleaned === "";
			const isDuplicate = cleanParts.includes(cleaned);

			if (!isUnnamed && !isEmpty && !isDuplicate) {
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
		const isUSA = this.usaVariants.includes(lastLower);

		//Vi fjerner "Norge" hvis vi har mer detaljert info
		if (isNorway && parts.length > 1) {
			parts.pop();
		}
		
		else if (isUSA) {
			//Vi tvinger alle USA-varianter til kortform
			parts[lastIndex] = "USA";
		}

		return parts;
	}

	/**
	 * Går gjennom strengen tegn for tegn og fjerner sifre
	 * @private
	 */
	_removeNumbers(text) {
		let result = "";
		for (const char of text) {
			// Beholder kun tegn som ikke er siffer
			if (char < "0" || char > "9") {
				result += char;
			}
		}
		return result.trim();
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