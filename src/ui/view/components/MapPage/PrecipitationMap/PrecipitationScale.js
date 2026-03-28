export const PRECIP_SCALE = [
	{ mmFrom: 0,    mmTo: 0.1,  color: [200, 220, 240,   0],  label: null      },  // Transparent
	{ mmFrom: 0.1,  mmTo: 0.2,  color: [185, 225, 255, 150],  label: "<0.2"    },  // Svak lysblå
	{ mmFrom: 0.2,  mmTo: 0.5,  color: [140, 210, 250, 190],  label: null      },  // Lys himmelblå
	{ mmFrom: 0.5,  mmTo: 1,    color: [ 80, 190, 245, 210],  label: "0.5"     },  // Klar cyan
	{ mmFrom: 1,    mmTo: 2,    color: [ 30, 160, 235, 225],  label: "1"       },  // Sterk cyan
	{ mmFrom: 2,    mmTo: 5,    color: [ 20, 120, 220, 235],  label: "2"       },  // Mellomblå
	{ mmFrom: 5,    mmTo: 10,   color: [ 10,  80, 200, 245],  label: "5"       },  // Dyp blå
	{ mmFrom: 10,   mmTo: 15,   color: [ 10,  40, 170, 250],  label: "10"      },  // Mørk blå
	{ mmFrom: 15,   mmTo: 20,   color: [ 80,  20, 140, 250],  label: ">15"     },  // Lilla (ekstremt)
];

export function buildPrecipColorStops() {
	const stops = [];

	for (const step of PRECIP_SCALE) {
		stops.push({ value: step.mmFrom, color: step.color });

		if (step.mmTo < 20) {
			stops.push({ value: step.mmTo - 0.01, color: step.color });
		} 
		else {
			stops.push({ value: step.mmTo, color: step.color });
		}
	}

	return stops;
}