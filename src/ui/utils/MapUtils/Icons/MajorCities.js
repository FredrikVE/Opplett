// src/ui/utils/MapUtils/Icons/MajorCities.js
//
// Hardkodede storbyer for land som er for store til at
// MarkerLayout finner nok byer på lav zoom (< 3).
//
// Brukes som fallback i DistributeWeatherPoints.
// Nøkkel = country ID-prefix fra MapTiler (f.eks. "country.10688" → "RU").

const MAJOR_CITIES = {
	RU: [
		{ name: "Moskva", lat: 55.75, lon: 37.62 },
		{ name: "St. Petersburg", lat: 59.93, lon: 30.32 },
		{ name: "Novosibirsk", lat: 55.01, lon: 82.93 },
		{ name: "Jekaterinburg", lat: 56.84, lon: 60.60 },
		{ name: "Kazan", lat: 55.80, lon: 49.11 },
		{ name: "Krasnojarsk", lat: 56.01, lon: 92.87 },
		{ name: "Irkutsk", lat: 52.29, lon: 104.30 },
		{ name: "Vladivostok", lat: 43.12, lon: 131.89 },
		{ name: "Khabarovsk", lat: 48.48, lon: 135.08 },
		{ name: "Murmansk", lat: 68.97, lon: 33.07 },
		{ name: "Jakutsk", lat: 62.04, lon: 129.74 },
		{ name: "Volgograd", lat: 48.72, lon: 44.50 },
		{ name: "Omsk", lat: 54.99, lon: 73.37 },
		{ name: "Samara", lat: 53.20, lon: 50.15 },
		{ name: "Arkhangelsk", lat: 64.54, lon: 40.54 },
	],
	CA: [
		{ name: "Ottawa", lat: 45.42, lon: -75.69 },
		{ name: "Toronto", lat: 43.65, lon: -79.38 },
		{ name: "Vancouver", lat: 49.28, lon: -123.12 },
		{ name: "Montreal", lat: 45.50, lon: -73.57 },
		{ name: "Calgary", lat: 51.05, lon: -114.07 },
		{ name: "Edmonton", lat: 53.55, lon: -113.49 },
		{ name: "Winnipeg", lat: 49.90, lon: -97.14 },
		{ name: "Halifax", lat: 44.65, lon: -63.57 },
		{ name: "Québec", lat: 46.81, lon: -71.21 },
		{ name: "Whitehorse", lat: 60.72, lon: -135.05 },
		{ name: "Yellowknife", lat: 62.45, lon: -114.37 },
		{ name: "St. John's", lat: 47.56, lon: -52.71 },
		{ name: "Iqaluit", lat: 63.75, lon: -68.52 },
		{ name: "Thunder Bay", lat: 48.38, lon: -89.25 },
	],
	US: [
		{ name: "Washington D.C.", lat: 38.91, lon: -77.04 },
		{ name: "New York", lat: 40.71, lon: -74.01 },
		{ name: "Los Angeles", lat: 34.05, lon: -118.24 },
		{ name: "Chicago", lat: 41.88, lon: -87.63 },
		{ name: "Houston", lat: 29.76, lon: -95.37 },
		{ name: "Phoenix", lat: 33.45, lon: -112.07 },
		{ name: "Seattle", lat: 47.61, lon: -122.33 },
		{ name: "Denver", lat: 39.74, lon: -104.99 },
		{ name: "Atlanta", lat: 33.75, lon: -84.39 },
		{ name: "Miami", lat: 25.76, lon: -80.19 },
		{ name: "Dallas", lat: 32.78, lon: -96.80 },
		{ name: "San Francisco", lat: 37.77, lon: -122.42 },
		{ name: "Minneapolis", lat: 44.98, lon: -93.27 },
		{ name: "Anchorage", lat: 61.22, lon: -149.90 },
	],
	CN: [
		{ name: "Beijing", lat: 39.90, lon: 116.40 },
		{ name: "Shanghai", lat: 31.23, lon: 121.47 },
		{ name: "Guangzhou", lat: 23.13, lon: 113.26 },
		{ name: "Chengdu", lat: 30.57, lon: 104.07 },
		{ name: "Ürümqi", lat: 43.83, lon: 87.60 },
		{ name: "Harbin", lat: 45.80, lon: 126.53 },
		{ name: "Wuhan", lat: 30.59, lon: 114.31 },
		{ name: "Xi'an", lat: 34.26, lon: 108.94 },
		{ name: "Kunming", lat: 25.04, lon: 102.68 },
		{ name: "Lhasa", lat: 29.65, lon: 91.17 },
	],
	BR: [
		{ name: "Brasília", lat: -15.79, lon: -47.88 },
		{ name: "São Paulo", lat: -23.55, lon: -46.63 },
		{ name: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
		{ name: "Manaus", lat: -3.12, lon: -60.02 },
		{ name: "Recife", lat: -8.05, lon: -34.87 },
		{ name: "Porto Alegre", lat: -30.03, lon: -51.23 },
		{ name: "Belém", lat: -1.46, lon: -48.50 },
		{ name: "Salvador", lat: -12.97, lon: -38.51 },
		{ name: "Cuiabá", lat: -15.60, lon: -56.10 },
		{ name: "Fortaleza", lat: -3.72, lon: -38.53 },
	],
	AU: [
		{ name: "Canberra", lat: -35.28, lon: 149.13 },
		{ name: "Sydney", lat: -33.87, lon: 151.21 },
		{ name: "Melbourne", lat: -37.81, lon: 144.96 },
		{ name: "Brisbane", lat: -27.47, lon: 153.03 },
		{ name: "Perth", lat: -31.95, lon: 115.86 },
		{ name: "Adelaide", lat: -34.93, lon: 138.60 },
		{ name: "Darwin", lat: -12.46, lon: 130.84 },
		{ name: "Alice Springs", lat: -23.70, lon: 133.88 },
		{ name: "Hobart", lat: -42.88, lon: 147.33 },
	],
	IN: [
		{ name: "New Delhi", lat: 28.61, lon: 77.21 },
		{ name: "Mumbai", lat: 19.08, lon: 72.88 },
		{ name: "Bangalore", lat: 12.97, lon: 77.59 },
		{ name: "Chennai", lat: 13.08, lon: 80.27 },
		{ name: "Kolkata", lat: 22.57, lon: 88.36 },
		{ name: "Hyderabad", lat: 17.39, lon: 78.49 },
		{ name: "Jaipur", lat: 26.91, lon: 75.79 },
		{ name: "Ahmedabad", lat: 23.02, lon: 72.57 },
		{ name: "Lucknow", lat: 26.85, lon: 80.95 },
	],
	AR: [
		{ name: "Buenos Aires", lat: -34.60, lon: -58.38 },
		{ name: "Córdoba", lat: -31.42, lon: -64.18 },
		{ name: "Mendoza", lat: -32.89, lon: -68.83 },
		{ name: "Ushuaia", lat: -54.80, lon: -68.30 },
		{ name: "Salta", lat: -24.79, lon: -65.41 },
		{ name: "Bariloche", lat: -41.13, lon: -71.31 },
		{ name: "Rosario", lat: -32.94, lon: -60.63 },
	],
	NO: [
		{ name: "Oslo", lat: 59.91, lon: 10.75 },
		{ name: "Bergen", lat: 60.39, lon: 5.32 },
		{ name: "Trondheim", lat: 63.43, lon: 10.40 },
		{ name: "Stavanger", lat: 58.97, lon: 5.73 },
		{ name: "Tromsø", lat: 69.65, lon: 18.96 },
		{ name: "Bodø", lat: 67.28, lon: 14.40 },
		{ name: "Kristiansand", lat: 58.15, lon: 8.00 },
		{ name: "Ålesund", lat: 62.47, lon: 6.15 },
		{ name: "Kirkenes", lat: 69.73, lon: 30.05 },
		{ name: "Hammerfest", lat: 70.66, lon: 23.68 },
		{ name: "Alta", lat: 69.97, lon: 23.27 },
		{ name: "Longyearbyen", lat: 78.22, lon: 15.63 },
	],
	SE: [
		{ name: "Stockholm", lat: 59.33, lon: 18.07 },
		{ name: "Göteborg", lat: 57.71, lon: 11.97 },
		{ name: "Malmö", lat: 55.60, lon: 13.00 },
		{ name: "Uppsala", lat: 59.86, lon: 17.64 },
		{ name: "Umeå", lat: 63.83, lon: 20.26 },
		{ name: "Luleå", lat: 65.58, lon: 22.15 },
		{ name: "Kiruna", lat: 67.86, lon: 20.23 },
		{ name: "Östersund", lat: 63.18, lon: 14.64 },
		{ name: "Karlstad", lat: 59.38, lon: 13.50 },
		{ name: "Linköping", lat: 58.41, lon: 15.63 },
		{ name: "Växjö", lat: 56.88, lon: 14.81 },
	],
	FI: [
		{ name: "Helsinki", lat: 60.17, lon: 24.94 },
		{ name: "Tampere", lat: 61.50, lon: 23.76 },
		{ name: "Oulu", lat: 65.01, lon: 25.47 },
		{ name: "Turku", lat: 60.45, lon: 22.27 },
		{ name: "Rovaniemi", lat: 66.50, lon: 25.73 },
		{ name: "Kuopio", lat: 62.89, lon: 27.68 },
		{ name: "Jyväskylä", lat: 62.24, lon: 25.75 },
		{ name: "Vaasa", lat: 63.10, lon: 21.62 },
		{ name: "Joensuu", lat: 62.60, lon: 29.76 },
		{ name: "Sodankylä", lat: 67.42, lon: 26.59 },
	],
};

/**
 * Henter hardkodede storbyer for et land basert på countryCode.
 * @param {string|null} countryCode - ISO 3166-1 alpha-2 (f.eks. "RU", "CA")
 * @returns {Array<{ name, lat, lon }>} - Tom array hvis ingen match
 */
export function getMajorCities(countryCode) {
	if (!countryCode) return [];
	return MAJOR_CITIES[countryCode.toUpperCase()] || [];
}

/**
 * Sjekker om et land har hardkodede storbyer.
 */
export function hasMajorCities(countryCode) {
	if (!countryCode) return false;
	return countryCode.toUpperCase() in MAJOR_CITIES;
}