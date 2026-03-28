//src/ui/view/components/MapPage/MapCanvasLegend.jsx
import { useEffect, useRef, useMemo } from "react";

const TARGET_TICKS = 10;

/**
 * Genererer pene, jevnt fordelte tick-verdier mellom min og max.
 * Bruker "runde" tall (1, 2, 5, 10, 20, 50 osv.) for lesbarhet.
 * Legger til min/max bare hvis de ikke er for nærme en eksisterende tick.
 */
function buildTicks(colorRamp) {
	const bounds = colorRamp.getBounds();
	const min = bounds.min;
	const max = bounds.max;
	const range = max - min;
	if (range === 0) {
		return [];
	}

	const rawStep = range / (TARGET_TICKS - 1);
	const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
	const niceSteps = [1, 2, 5, 10];
	const niceStep = niceSteps.find(s => s * magnitude >= rawStep) * magnitude;

	// Generer runde ticks
	const ticks = [];
	const start = Math.ceil(min / niceStep) * niceStep;

	for (let v = start; v <= max; v += niceStep) {
		ticks.push(Math.round(v));
	}

	// Legg til min/max bare hvis de er langt nok unna nærmeste tick
	const minThreshold = niceStep * 0.4;
	const roundedMin = Math.round(min);
	const roundedMax = Math.round(max);

	if (ticks.length === 0 || Math.abs(ticks[0] - roundedMin) > minThreshold) {
		ticks.unshift(roundedMin);
	}

	if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - roundedMax) > minThreshold) {
		ticks.push(roundedMax);
	}

	return ticks.map(value => ({
		value,
		percent: ((max - value) / range) * 100,
	}));
}

/**
 * MapCanvasLegend
 *
 * Rendrer en vertikal gradient-legend basert på en ColorRamp fra @maptiler/weather.
 * Bruker getCanvasStrip() for å garantere at fargene matcher kartlaget 1:1.
 *
 * Props:
 *   colorRamp  – ColorRamp-instans fra layer.getColorRamp()
 *   unit       – Enhet-label (f.eks. "°C", "hPa", "m/s", "mm/t")
 *   isVisible  – Vis/skjul legenden
 */
export default function MapCanvasLegend({ colorRamp, unit, isVisible }) {

	const canvasContainerRef = useRef(null);

	useEffect(() => {
		const container = canvasContainerRef.current;

		if (!container || !colorRamp) {
			return;
		}

		container.innerHTML = "";

		const canvas = colorRamp.getCanvasStrip({
			horizontal: false,
			size: 256,
			smooth: true,
		});

		canvas.style.width = "100%";
		canvas.style.height = "100%";
		canvas.style.borderRadius = "50px";
		canvas.style.transform = "scaleY(-1)";

		container.appendChild(canvas);
	}, 
	[colorRamp]);

	const ticks = useMemo(() => {
		if (!colorRamp) return [];
		return buildTicks(colorRamp);
	}, 
	[colorRamp]);

	if (!isVisible || !colorRamp) {
		return null;
	}

	return (
		<div className="map-legend">
			<div className="map-legend-header">
				<span className="map-legend-unit">{unit}</span>
			</div>

			<div className="map-legend-gradient">
				<div className="map-legend-canvas-area">
					<div
						className="map-legend-canvas-wrap"
						ref={canvasContainerRef}
					/>

					<div className="map-legend-ticks">
						{ticks.map((tick) => (
							<span
								key={tick.value}
								className="map-legend-tick"
								style={{ top: `${tick.percent}%` }}
							>
								{tick.value}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}