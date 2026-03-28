//src/ui/view/components/MapPage/Timeline/TimelineModel.js
import { DateTime } from "luxon";

const UI_LOCALE = "nb-NO";

export class TimelineModel {
	constructor({ startMs, endMs, currentMs, timezone }) {
		this.startMs = startMs;
		this.endMs = endMs;
		this.currentMs = currentMs;
		this.timezone = timezone;
	}


	hasValidRange() {
		return (
			this.startMs > 0 &&
			this.endMs > 0 &&
			this.endMs > this.startMs
		);
	}

	getProgressPercent() {
		if (!this.hasValidRange()) {
            return 0;
        }

		const range = this.endMs - this.startMs;
		const elapsed = (this.currentMs || this.startMs) - this.startMs;

		return Math.max(0, Math.min(100, (elapsed / range) * 100));
	}

	formatTime(timestampMs) {
		if (!timestampMs) return "";

		const datetime = DateTime.fromMillis(timestampMs)
			.setZone(this.timezone)
			.setLocale(UI_LOCALE);

		if (!datetime.isValid) {
            return "";
        }

		return datetime;
	}

	getCurrentLabel() {
		const datetime = this.formatTime(this.currentMs || this.startMs);
		return datetime ? datetime.toFormat("ccc d. MMM HH:mm") : "";
	}

	getStartLabel() {
		const datetime = this.formatTime(this.startMs);
		return datetime ? datetime.toFormat("ccc HH:mm") : "";
	}

	getEndLabel() {
		const datetime = this.formatTime(this.endMs);
		return datetime ? datetime.toFormat("ccc HH:mm") : "";
	}
}