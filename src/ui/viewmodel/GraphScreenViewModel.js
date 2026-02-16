//src/ui/viewmodel/GraphScreenViewModel.js
import { useEffect, useState, useMemo } from "react";
import { resolveTimezone, formatLocalDate, getLocalHour } from "../utils/timeFormatters.js";

export default function GraphScreenViewModel(forecastRepository, sunriseRepository, lat, lon, hoursAhead, timezone) {

	const [hourlyData, setHourlyData] = useState([]);
	const [sunTimesByDate, setSunTimesByDate] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	//SSOT for tid.
	const tz = useMemo(() => resolveTimezone(timezone), [timezone]);

	useEffect(() => {
		if (!lat || !lon) {
			return;
		}

		let cancelled = false;

		async function loadGraphData() {
			try {
				setLoading(true);

				// Henter kun graf-relevant data
				const hourly = await forecastRepository.getHourlyForecast(lat, lon, hoursAhead, tz);

				if (cancelled) {
					return;
				}

				setHourlyData(hourly);

				// Gruppér datoer for sunrise
				//Lager en liste med alle datoer fra hourly-data
				const dateList = hourly.map(function (hour) {
					return hour.dateISO;
				});

				//Lager et Set for å fjerne duplikater
				const uniqueDates = new Set(dateList);

				//Konverterer Set tilbake til vanlig array
				const isoDates = Array.from(uniqueDates);

				//henter data fra SolarInfo til dagslengde-graf
				const sunReport = await sunriseRepository.getFullSolarReport(lat, lon, isoDates, tz, formatLocalDate);

				if (cancelled) {
					return;
				}

				setSunTimesByDate(sunReport);
			} 
			
			catch (error) {
				if (!cancelled) {
					setError(error.message);
				}
			} 

			finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		loadGraphData();

		//Cleanup-function
		return () => {
			cancelled = true;
		};

	}, [lat, lon, hoursAhead, tz, forecastRepository, sunriseRepository]);

	return {
		hourlyData,
		sunTimesByDate,
		loading,
		error,
		getLocalHour: (iso) => getLocalHour(iso, tz),
		formatLocalDate: (iso) => formatLocalDate(iso, tz)
	};
}
