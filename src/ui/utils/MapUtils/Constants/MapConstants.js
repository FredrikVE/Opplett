//src/ui/utils/MapUtils/Constants/MapConstants.js
export const MAP_DEFAULTS = {
	CENTER_LON: 10,
	CENTER_LAT: 60,
	PITCH: 0,
	BEARING: 0
};

export const MAP_CAMERA = {
	BOUNDS: "bounds",
	CENTER: "center"
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
	WORLD: 2,
	WORLD_CLOSE: 2.5,
	COUNTRY: 3,
	COUNTRY_CLOSE: 3.5,
	REGION_WIDE: 4,
	REGION: 5,
	SUB_REGION: 6,
	COUNTY: 7,
	DISTRICT: 8,
	CITY: 9,
	STREET: 12,
	ADDRESS: 14,
	DEFAULT: 12
};

export const MAP_ZOOM_LIMITS = {
	MIN: MAP_ZOOM_LEVELS.WORLD,
	MAX: MAP_ZOOM_LEVELS.ADDRESS
};

export const MAP_ANIMATION = {
	DURATION_MS: 1500,
	FLY_SPEED: 1.2,
	PADDING: {
		AREA: 80,
		POINT: 40
	}
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
	LABEL_LAYER_ZOOM_RANGE: {
		MIN: 1,
		MAX: 24
	},
	IDLE_REPORT_DEBOUNCE_MS: 300
};

export const MAP_MARKER_DISTRIBUTION = {
	BASE_DISTANCE_DEGREES: 45,
	GLOBAL_ZOOM_THRESHOLD: 4.5,
	MAX_DISTANCE_CAP_DEGREES: 3.0,
	LOW_ZOOM_THRESHOLD: 4.0,
	LOW_ZOOM_DISTANCE_MULTIPLIER: 0.3,
	LOW_ZOOM_MIN_DISTANCE_CAP: 0.01,
	MARKER_LIMITS: {
		AREA: {
			FAR: 14,
			MID: 20,
			DEFAULT: MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS
		},
		POINT: {
			FAR: 12,
			MID: 18,
			DEFAULT: MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS
		}
	},
	ZOOM_BREAKPOINTS: {
		FAR: MAP_ZOOM_LEVELS.COUNTRY,
		MID: MAP_ZOOM_LEVELS.SUB_REGION
	},
	MIN_DISTANCE_CAP_DEGREES: {
		AREA: 0.55,
		POINT: 0.01
	},
	SPACING_MULTIPLIERS: {
		AREA: {
			HORIZONTAL: 1.2,
			VERTICAL: 0.8
		},
		POINT: {
			HORIZONTAL: 1.8,
			VERTICAL: 0.9
		}
	}
};