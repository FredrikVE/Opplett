//src/ui/view/components/MapPage/MapHooks/useTimelineController.js
import { useState, useCallback } from "react";

const INITIAL_TIMELINE = {
	startMs: 0,
	endMs: 0,
	currentMs: 0,
	isPlaying: false,
};

export default function useTimelineController() {
	const [timeline, setTimeline] = useState(INITIAL_TIMELINE);

	const onTimeUpdate = useCallback((event) => {
		switch (event.type) {
			case "ready":
				setTimeline({
					startMs: event.startMs,
					endMs: event.endMs,
					currentMs: event.currentMs,
					isPlaying: event.isPlaying,
				});
				break;

			case "tick":
			case "seek":
				setTimeline((prev) => ({
					...prev,
					currentMs: event.currentMs,
					isPlaying: event.isPlaying,
				}));
				break;

			case "removed":
				setTimeline(INITIAL_TIMELINE);
				break;

			default:
				break;
		}
	}, []);

	const play = useCallback(() => {
		setTimeline((prev) => ({
			...prev,
			isPlaying: true,
		}));
	}, []);

	const pause = useCallback(() => {
		setTimeline((prev) => ({
			...prev,
			isPlaying: false,
		}));
	}, []);

	return {
		timeline,
		onTimeUpdate,
		play,
		pause,
	};
}