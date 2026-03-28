//src/ui/view/components/MapPage/Timeline/TimeLine.jsx
import { useMemo, useCallback, useRef } from "react";
import PlaybackIcon from "../../Common/Icons/PlaybackIcon.jsx"
import { TimelineModel } from "./TimelineModel.js";

const TIMELINE_STEP_MS = 60_000;

export default function TimeLine(props) {
	const { isVisible, isPlaying, startMs, endMs, currentMs, timezone, onPlay, onPause, onSeek } = props;

	const wasPlayingRef = useRef(false);

	const model = useMemo(() => {
		return new TimelineModel({
			startMs,
			endMs,
			currentMs,
			timezone,
		});
	}, [startMs, endMs, currentMs, timezone]);

	const progressPercent = model.getProgressPercent();
	const hasData = model.hasValidRange();

	const handleSliderChange = useCallback((e) => {
		onSeek?.(Number(e.target.value));
	}, [onSeek]);

	const handleSliderStart = useCallback(() => {
		wasPlayingRef.current = isPlaying;
		if (isPlaying) {
			onPause?.();
		}
	}, [isPlaying, onPause]);

	const handleSliderEnd = useCallback(() => {
		if (wasPlayingRef.current) {
			onPlay?.();
		}
	}, [onPlay]);

	const handlePlayPause = useCallback(() => {
		if (isPlaying) {
			onPause?.();
		} else {
			onPlay?.();
		}
	}, [isPlaying, onPlay, onPause]);

	if (!isVisible) {
		return null;
	}

	return (
		<div className="timeline">

			<div className="timeline-header">
				<span className="timeline-current">
					{model.getCurrentLabel()}
				</span>
			</div>

			<div className="timeline-controls">
				<button
					className="timeline-play-btn"
					onClick={handlePlayPause}
					disabled={!hasData}
				>
					<PlaybackIcon isPlaying={isPlaying} />
				</button>

				<div className="timeline-slider-wrap">
					<input
						type="range"
						className="timeline-slider"
						min={startMs}
						max={endMs}
						value={Math.max(currentMs, startMs)}
						onChange={handleSliderChange}
						onPointerDown={handleSliderStart}
						onPointerUp={handleSliderEnd}
						disabled={!hasData}
						step={TIMELINE_STEP_MS}
					/>

					<div
						className="timeline-progress"
						style={{ width: `${progressPercent}%` }}
					/>

					<div className="timeline-ticks" />
				</div>
			</div>

			<div className="timeline-range">
				<span>{model.getStartLabel()}</span>
				<span>{model.getEndLabel()}</span>
			</div>

		</div>
	);
}