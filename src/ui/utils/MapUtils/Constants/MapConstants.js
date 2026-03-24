// src/ui/utils/MapUtils/Constants/MapConstants.js
export const MAP_DEFAULTS = {
	CENTER_LON: 10,
	CENTER_LAT: 60,
};

export const MAP_HIGHLIGHT = {
	SOURCE_ID: "highlight-source",
	FILL_LAYER_ID: "highlight-fill",
	GLOW_LAYER_ID: "highlight-line-glow",
	LINE_LAYER_ID: "highlight-line-main"
};

export const LOCATION_TYPES = {
	CONTINENT: "continental_marine",
	MAJOR_LANDFORM: "major_landform",
	COUNTRY: "country",
	REGION: "region",
	SUBREGION: "subregion",
	COUNTY: "county",
	MUNICIPALITY: "municipality",
	CITY: "place",
	LOCALITY: "locality",
	NEIGHBOURHOOD: "neighbourhood",
	ADDRESS: "address"
};

export const MAP_ZOOM_LEVELS = {
	WORLD: 2.5,
	COUNTRY: 3,
	REGION: 5,
	SUB_REGION: 6,
	COUNTY: 7,
	CITY: 9,
	STREET: 12,
	DEFAULT: 14,
};

export const MAP_ZOOM_LIMITS = {
	MIN: MAP_ZOOM_LEVELS.WORLD,
	MAX: MAP_ZOOM_LEVELS.DEFAULT,
};

export const MAP_ANIMATION = {
	FLY_SPEED: 1.2,
};

export const MAP_MARKER_CONFIG = {
	MAX_LAYOUT_MARKERS: 60,
	MAX_WEATHER_MARKERS: 25,
	LABEL_LAYERS: [
		"Capital city labels",
		"City labels",
		"Town labels",
		"Place labels"
	],
};

export const MAP_MARKER_DISTRIBUTION = {
	BASE_DISTANCE_DEGREES: 45,
	MAX_DISTANCE_CAP_DEGREES: 3.0,
	LOW_ZOOM_THRESHOLD: 4.0,
	LOW_ZOOM_DISTANCE_MULTIPLIER: 0.3,
	LOW_ZOOM_MIN_DISTANCE_CAP: 0.01,
	MIN_DISTANCE_CAP_DEGREES: 0.01,
	ZOOM_BREAKPOINTS: {
		FAR: MAP_ZOOM_LEVELS.COUNTRY,
		MID: MAP_ZOOM_LEVELS.SUB_REGION
	},
	MARKER_LIMITS: {
		FAR: 12,
		MID: 18,
		DEFAULT: 25,
	},
};
