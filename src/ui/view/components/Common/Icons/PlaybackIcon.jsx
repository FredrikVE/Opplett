//src/ui/view/components/MapPage/Timeline/PlaybackIcon.jsx
export default function PlaybackIcon({ isPlaying, size = 20 }) {
	const viewBox = "0 0 24 24";

	// SVG shapes (lokal – ingen grunn til egen fil)
	const PLAY_ICON_SHAPE = "6,4 20,12 6,20";

	const PAUSE_ICON_SHAPES = [
		{ x: 6,  y: 4, width: 4, height: 16, rx: 1 },
		{ x: 14, y: 4, width: 4, height: 16, rx: 1 },
	];

	return (
		<svg
			viewBox={viewBox}
			width={size}
			height={size}
			fill="currentColor"
		>
			{isPlaying ? (
				PAUSE_ICON_SHAPES.map((rect, index) => (
					<rect key={index} {...rect} />
				))
			) : (
				<polygon points={PLAY_ICON_SHAPE} />
			)}
		</svg>
	);
}