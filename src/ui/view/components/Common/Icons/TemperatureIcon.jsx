//src/ui/view/components/Common/Icons/TemperatureIcon.jsx

// Termometer — rør med kule nederst
const THERMOMETER_BODY = "M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z";

// Kvikksølv-nivå (strek inne i termometeret)
const MERCURY_LEVEL = "M11.5 7v7";

export default function TemperatureIcon({ size = 18 }) {

	const viewBox = "0 0 24 24";
	const strokeWidth = 1.5;

	return (
		<svg
			viewBox={viewBox}
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={THERMOMETER_BODY} />
			<path d={MERCURY_LEVEL} />
		</svg>
	);
}