//src/ui/view/components/MapPage/Timeline/TimeLine.jsx
import { useMemo, useCallback } from "react";
import PlaybackIcon from "./PlaybackIcon";
import { TimelineModel } from "./TimelineModel.js";

export default function TimeLine(props) {
	const { isVisible, isPlaying, startMs, endMs, currentMs, timezone, onPlay, onPause, onSeek } = props;

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
	}, 
	[onSeek]);

	const handlePlayPause = useCallback(() => {
		if (isPlaying) {
			onPause?.();
		}
		
		else {
			onPlay?.();
		}
	}, 
	[isPlaying, onPlay, onPause]);

	if (!isVisible) {
		return null;
	}

	return (
		<div className="precip-timeline">

			<div className="precip-timeline-time">
				<span className="precip-timeline-current">
					{model.getCurrentLabel()}
				</span>
			</div>

			<div className="precip-timeline-controls">
				<button
					className="precip-timeline-play-btn"
					onClick={handlePlayPause}
					disabled={!hasData}
				>
					<PlaybackIcon isPlaying={isPlaying} />
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

					<div
						className="precip-timeline-progress"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			<div className="precip-timeline-range">
				<span>{model.getStartLabel()}</span>
				<span>{model.getEndLabel()}</span>
			</div>
		</div>
	);
}