//src/ui/view/components/MapPage/Timeline/TimeLine.jsx
import { useMemo, useCallback } from "react";
import PlaybackIcon from "./PlaybackIcon";
import { TimelineModel } from "./TimelineModel.js";

export default function TimeLine(props) {
	const {
		isVisible,
		isPlaying,
		startMs,
		endMs,
		currentMs,
		timezone,
		onPlay,
		onPause,
		onSeek
	} = props;

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
						min={startMs || 0}						//Hvorfor OR 0? Jeg tror disse er undøvendige...
						max={endMs || 1}						//Hvorfor OR 1?
						value={currentMs || startMs || 0}		//Hvorfor OR 0?
						onChange={handleSliderChange}
						disabled={!hasData}
						step={60000}					//Dette er codesmell med "Magic numbers midt inne i koden"
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