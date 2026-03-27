import { useEffect, useRef, useCallback } from "react";

/**
 * Kartlag som dimmes via fill-opacity når nedbøroverlayet er aktivt.
 */
const OPACITY_LAYERS = [
	// Natur / landcover
	{ id: "Farmland",       dimmed: 0 },
	{ id: "Vegetation",     dimmed: 0 },
	{ id: "Wood",           dimmed: 0 },
	{ id: "Forest",         dimmed: 0 },
	{ id: "Grass",          dimmed: 0 },
	{ id: "Sand",           dimmed: 0 },
	{ id: "Ice",            dimmed: 0 },

    /*
	// Bebyggelse
	{ id: "Residential",    dimmed: 0.1  },
	{ id: "Commercial",     dimmed: 0.1  },
	{ id: "Industrial",     dimmed: 0.1  },

	// Spesialområder
	{ id: "Cemetery",       dimmed: 0.1  },
	{ id: "School",         dimmed: 0.1  },
	{ id: "Hospital",       dimmed: 0.1  },
	{ id: "Military",       dimmed: 0.1  },
	{ id: "Zoo",            dimmed: 0.1  },
	{ id: "Pitch",          dimmed: 0.1  },
	{ id: "Quarry",         dimmed: 0.15 },
	{ id: "Construction",   dimmed: 0.1  },

	// Infrastruktur
	{ id: "Parking",        dimmed: 0.1  },
	{ id: "Airport zone",   dimmed: 0.15 },
    */
];

/**
 * Kartlag som får endret fill-color (ikke bare opacity).
 * Havet må bli lysere/gråere for at blå nedbør skal synes.
 */
const COLOR_LAYERS = [
	{ id: "Water",  property: "fill-color",  dimmed: "hsl(0, 0%, 88%)" },
];

/**
 * useMapLayerDimming
 *
 * Dimmer kartlag når nedbøroverlayet er aktivt:
 * - Landcover/landuse → redusert fill-opacity
 * - Hav → endret fill-color til lysgrå
 *
 * Gjenoppretter alt når overlayet skrus av.
 */
export function useMapLayerDimming(map, isDimmed) {
	const savedOpacityRef = useRef(new Map());
	const savedColorRef = useRef(new Map());
	const wasDimmedRef = useRef(false);

	const saveAndDim = useCallback(() => {
		if (!map) return;

		// Opacity-lag
		for (const layer of OPACITY_LAYERS) {
			if (!map.getLayer(layer.id)) continue;
			try {
				const original = map.getPaintProperty(layer.id, "fill-opacity");
				savedOpacityRef.current.set(layer.id, original ?? 1);
				map.setPaintProperty(layer.id, "fill-opacity", layer.dimmed);
			} catch (error) {
				console.warn(`[Dimming] opacity feil ${layer.id}:`, error);
			}
		}

		// Farge-lag (hav osv.)
		for (const layer of COLOR_LAYERS) {
			if (!map.getLayer(layer.id)) continue;
			try {
				const original = map.getPaintProperty(layer.id, layer.property);
				savedColorRef.current.set(layer.id, { property: layer.property, original });
				map.setPaintProperty(layer.id, layer.property, layer.dimmed);
			} catch (error) {
				console.warn(`[Dimming] color feil ${layer.id}:`, error);
			}
		}
	}, [map]);

	const restore = useCallback(() => {
		if (!map) return;

		// Gjenopprett opacity
		for (const [layerId, originalOpacity] of savedOpacityRef.current) {
			if (!map.getLayer(layerId)) continue;
			try {
				map.setPaintProperty(layerId, "fill-opacity", originalOpacity);
			} catch (error) {
				console.warn(`[Dimming] restore opacity feil ${layerId}:`, error);
			}
		}
		savedOpacityRef.current.clear();

		// Gjenopprett farger
		for (const [layerId, saved] of savedColorRef.current) {
			if (!map.getLayer(layerId)) continue;
			try {
				map.setPaintProperty(layerId, saved.property, saved.original);
			} catch (error) {
				console.warn(`[Dimming] restore color feil ${layerId}:`, error);
			}
		}
		savedColorRef.current.clear();
	}, [map]);

	const onDimStateChanged = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

		if (isDimmed && !wasDimmedRef.current) {
			saveAndDim();
			wasDimmedRef.current = true;
		}

		if (!isDimmed && wasDimmedRef.current) {
			restore();
			wasDimmedRef.current = false;
		}

		return () => {
			if (wasDimmedRef.current) {
				restore();
				wasDimmedRef.current = false;
			}
		};
	}, [map, isDimmed, saveAndDim, restore]);

	useEffect(onDimStateChanged, [onDimStateChanged]);
}