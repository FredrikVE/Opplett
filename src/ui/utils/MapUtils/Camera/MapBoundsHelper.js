// src/ui/utils/MapUtils/Camera/MapBoundsHelper.js
export function getBoundsFromGeometry(geojson) {
	if (!geojson?.features?.length) {
		return null;
	}

	function getRingArea(ring) {
		if (!Array.isArray(ring) || ring.length < 4) {
			return 0;
		}

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
		} 
		
		else if (type === "MultiPolygon" && Array.isArray(coordinates)) {
			coordinates.forEach((polygonCoords) => {
				
				if (Array.isArray(polygonCoords?.[0])) {
					outerRings.push(polygonCoords[0]);
				}
			});
		}
	});

	if (outerRings.length === 0) {
		return null;
	}

	const mainlandRing = outerRings.reduce((largest, current) => {
		return getRingArea(current) > getRingArea(largest) ? current : largest;
	});

	const pointsToCalculate = mainlandRing.length > 10 ? mainlandRing : outerRings.flat();

	if (!pointsToCalculate.length) {
		return null;
	}

	const lons = pointsToCalculate.map((p) => p[0]);
	const lats = pointsToCalculate.map((p) => p[1]);

	return [
		[Math.min(...lons), Math.min(...lats)],
		[Math.max(...lons), Math.max(...lats)],
	];
}
