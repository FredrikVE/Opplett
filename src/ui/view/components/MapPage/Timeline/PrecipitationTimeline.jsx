import { useCallback, useMemo } from "react";
import { DateTime } from "luxon";

const UI_LOCALE = "nb-NO";

/**
 * Formaterer en UNIX-timestamp (ms) til lesbar dato/tid via Luxon.
 * Eksempel: "fre 27. mar 14:00"
 * Følger samme SSOT-mønster som timeFormatters.js
 */
function formatTimeLabel(timestampMs, tz) {
	if (!timestampMs) return "";

	const dt = DateTime.fromMillis(timestampMs).setZone(tz).setLocale(UI_LOCALE);
	if (!dt.isValid) return "";

	return dt.toFormat("ccc d. MMM HH:mm");
}

/**
 * Kort tidslabel for start/slutt (f.eks. "fre 14:00").
 */
function formatShortTime(timestampMs, tz) {
	if (!timestampMs) return "";

	const dt = DateTime.fromMillis(timestampMs).setZone(tz).setLocale(UI_LOCALE);
	if (!dt.isValid) return "";

	return dt.toFormat("ccc HH:mm");
}

export default function PrecipitationTimeline({
	isVisible,
	isPlaying,
	startMs,
	endMs,
	currentMs,
	timezone,
	onPlay,
	onPause,
	onSeek,
}) {
	// Alle hooks MÅ kjøres før early return
	const hasData = startMs > 0 && endMs > 0 && endMs > startMs;

	const progressPercent = useMemo(() => {
		if (!hasData) return 0;
		const range = endMs - startMs;
		const elapsed = (currentMs || startMs) - startMs;
		return Math.max(0, Math.min(100, (elapsed / range) * 100));
	}, [hasData, startMs, endMs, currentMs]);

	const handleSliderChange = useCallback((e) => {
		const value = Number(e.target.value);
		onSeek?.(value);
	}, [onSeek]);

	const handlePlayPause = useCallback(() => {
		if (isPlaying) {
			onPause?.();
		} else {
			onPlay?.();
		}
	}, [isPlaying, onPlay, onPause]);

	const currentLabel = formatTimeLabel(currentMs || startMs, timezone);
	const startLabel = formatShortTime(startMs, timezone);
	const endLabel = formatShortTime(endMs, timezone);

	// Early return ETTER alle hooks
	if (!isVisible) {
		return null;
	}

	return (
		<div className="precip-timeline">
			{/* Tidslabel */}
			<div className="precip-timeline-time">
				<span className="precip-timeline-current">{currentLabel}</span>
			</div>

			{/* Kontrollrad: play/pause + slider */}
			<div className="precip-timeline-controls">
				<button
					className="precip-timeline-play-btn"
					onClick={handlePlayPause}
					aria-label={isPlaying ? "Pause" : "Spill av"}
					disabled={!hasData}
				>
					{isPlaying ? (
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<rect x="6" y="4" width="4" height="16" rx="1" />
							<rect x="14" y="4" width="4" height="16" rx="1" />
						</svg>
					) : (
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<polygon points="6,4 20,12 6,20" />
						</svg>
					)}
				</button>

				<div className="precip-timeline-slider-wrap">
					<input
						type="range"
						className="precip-timeline-slider"
						min={startMs || 0}
						max={endMs || 1}
						value={currentMs || startMs || 0}
						onChange={handleSliderChange}
						disabled={!hasData}
						step={60000}
					/>

					{/* Progresjonsfyll */}
					<div
						className="precip-timeline-progress"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			{/* Start/slutt-labels */}
			<div className="precip-timeline-range">
				<span className="precip-timeline-start">{startLabel}</span>
				<span className="precip-timeline-end">{endLabel}</span>
			</div>
		</div>
	);
}