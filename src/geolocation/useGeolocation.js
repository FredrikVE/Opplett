//src/geolocation/useGeolocation.js
import { useEffect, useState } from 'react';

export default function useGeolocation() {
	//Statevariabler forr loading, error og data
  	const [loading, setLoading] = useState(true);
  	const [error, setError] = useState(null);
  	const [coords, setCoords] = useState({});

	//useEffekt for å håndtere loading, error og oppdatering av data
	useEffect(() => {
		const onSucces = (error) => {
			setLoading(false);
			setError(null);
			setCoords(error.coords);
		};

		const onError = (error) => {
			setError(error);
			setLoading(false);
		};
	
		//Kaller på navigator og geolocasjon
		navigator.geolocation.getCurrentPosition(onSucces, onError);
	}, 
	[]);
	
	return { loading, error, coords };
}