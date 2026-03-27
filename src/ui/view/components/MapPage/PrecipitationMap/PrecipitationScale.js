//src/ui/view/components/MapPage/PrecipitationMap/PrecipitationScale.js

export const PRECIP_SCALE = [
	{ mmFrom: 0,    mmTo: 0.1,  color: [200, 220, 240,   0],  label: null      },  // Transparent
	{ mmFrom: 0.1,  mmTo: 0.2,  color: [185, 225, 255, 150],  label: "<0.2"    },  // Svak lysblå
	{ mmFrom: 0.2,  mmTo: 0.5,  color: [140, 210, 250, 190],  label: null      },  // Lys himmelblå
	{ mmFrom: 0.5,  mmTo: 1,    color: [ 80, 190, 245, 210],  label: "0.5"     },  // Klar cyan
	{ mmFrom: 1,    mmTo: 2,    color: [ 30, 160, 235, 225],  label: "1"       },  // Sterk cyan
	{ mmFrom: 2,    mmTo: 5,    color: [ 20, 120, 220, 235],  label: "2"       },  // Mellomblå
	{ mmFrom: 5,    mmTo: 10,   color: [ 10,  80, 200, 245],  label: "5"       },  // Dyp blå
	{ mmFrom: 10,   mmTo: 15,   color: [ 10,  40, 170, 250],  label: "10"      },  // Mørk blå
	{ mmFrom: 15,   mmTo: 50,   color: [ 80,  20, 140, 250],  label: ">15"     },  // Lilla (ekstremt)
];

export function buildPrecipColorStops() {
	const stops = [];

	for (const step of PRECIP_SCALE) {
		//Start av intervallet
		stops.push({ value: step.mmFrom, color: step.color });

		//Hold til rett før neste trinn (epsilon-gap)
		if (step.mmTo < 50) {
			stops.push({ value: step.mmTo - 0.01, color: step.color });
		} 

        else {
			//Siste trinn – hold til maks
			stops.push({ value: step.mmTo, color: step.color });
		}
	}

	return stops;
}

/**
 * Henter synlige legend-trinn (de med label).
 * Returnerer array med { label, cssColor } – fra mye til lite regn.
 */
export function getPrecipLegendSteps() {
	return PRECIP_SCALE
		.filter(step => step.label !== null)
		.reverse()
		.map(step => ({
			label: step.label,
			cssColor: `rgba(${step.color[0]}, ${step.color[1]}, ${step.color[2]}, ${(step.color[3] / 255).toFixed(2)})`,
		}));
}