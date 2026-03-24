// src/ui/utils/MapUtils/Camera/MapBoundsHelper.js
//
// Geometri-hjelpere for kart.
//   - getBoundsFromGeometry: bounding box fra GeoJSON (for kamera)
//   - isPointInGeometry: punkt-i-polygon-sjekk (for prioritering av værpunkter)

/**
 * Sjekker om et punkt (lon, lat) er innenfor en GeoJSON FeatureCollection.
 */
function isPointInRing(lon, lat, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const xi = ring[i][0], yi = ring[i][1];
		const xj = ring[j][0], yj = ring[j][1];
		const intersect = ((yi > lat) !== (yj > lat)) &&
			(lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}

export function isPointInGeometry(lon, lat, geojson) {
	if (!geojson?.features?.length) return false;

	for (const feature of geojson.features) {
		const { type, coordinates } = feature.geometry || {};
		if (type === "Polygon") {
			if (isPointInRing(lon, lat, coordinates[0])) return true;
		} else if (type === "MultiPolygon") {
			for (const poly of coordinates) {
				if (isPointInRing(lon, lat, poly[0])) return true;
			}
		}
	}
	return false;
}

/**
 * Beregner geografiske yttergrenser (BBox) basert på GeoJSON-geometri.
 * Prioriterer den største landmassen for å unngå for vidt utsnitt
 * på land med fjerne øyer.
 *
 * @param {Object} geojson - GeoJSON FeatureCollection
 * @returns {Array|null} - [[SW_lng, SW_lat], [NE_lng, NE_lat]]
 */
export function getBoundsFromGeometry(geojson) {
	if (!geojson?.features?.length) {
		return null;
	}

	function getRingArea(ring) {
		if (!Array.isArray(ring) || ring.length < 4) return 0;

		let area = 0;
		for (let i = 0; i < ring.length - 1; i++) {
			const [x1, y1] = ring[i];
			const [x2, y2] = ring[i + 1];
			area += x1 * y2 - x2 * y1;
		}
		return Math.abs(area / 2);
	}

	const outerRings = [];

	geojson.features.forEach((feature) => {
		const { type, coordinates } = feature.geometry || {};

		if (type === "Polygon" && Array.isArray(coordinates?.[0])) {
			outerRings.push(coordinates[0]);
		} else if (type === "MultiPolygon" && Array.isArray(coordinates)) {
			coordinates.forEach((polygonCoords) => {
				if (Array.isArray(polygonCoords?.[0])) {
					outerRings.push(polygonCoords[0]);
				}
			});
		}
	});

	if (outerRings.length === 0) return null;

	const mainlandRing = outerRings.reduce((largest, current) => {
		return getRingArea(current) > getRingArea(largest) ? current : largest;
	});

	const pointsToCalculate =
		mainlandRing.length > 10 ? mainlandRing : outerRings.flat();

	if (!pointsToCalculate.length) return null;

	const lons = pointsToCalculate.map((p) => p[0]);
	const lats = pointsToCalculate.map((p) => p[1]);

	return [
		[Math.min(...lons), Math.min(...lats)],
		[Math.max(...lons), Math.max(...lats)],
	];
}