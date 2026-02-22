//src/geolocation/FormatLocationName.js
import { useEffect, useState } from 'react';

export function useGeolocation() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	
	//Initialiserer startkoordinater som null for lat og lon
	const [coords, setCoords] = useState({ lat: null, lon: null });

	useEffect(() => {
		const onSuccess = (position) => {
			
			// Hvis suksess, så settes loading til false og error til null
			setLoading(false);
			setError(null);

			setCoords({
				lat: position.coords.latitude,
				lon: position.coords.longitude
			});
		};

		// Hvis feil settes feilmeldingen til "error" og loading til false
		const onError = (error) => {
			setError(error);
			setLoading(false);
		};
	
		//Legger til en timeout for å unngå uendelig loading
		const options = { timeout: 15_000 };

		navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
	}, 
	[]);
	
	return { loading, error, coords };
}