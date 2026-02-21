//src/ui/utils/LocationUtils/fetchInitialLocationName.js
export async function fetchInitialLocationName(setLocation, geocodingRepository, lat, lon) {
	try {
		const result = await geocodingRepository.getCoordinates(`${lat}, ${lon}`);

		if (!result?.name) {
			return;
		}

		setLocation((prev) => {
			// Hvis navn og timezone allerede er satt og like → ingen endring
			if (prev.name === result.name && prev.timezone === result.timezone) {
				return prev;
			}

			return {
				...prev,
				name: result.name,
				timezone: result.timezone,
			};
		});
	} 
	
	catch (error) {
		// stille fail – appen funker fortsatt uten navn
		console.warn("Kunne ikke hente stedsnavn", error);
	}
}
