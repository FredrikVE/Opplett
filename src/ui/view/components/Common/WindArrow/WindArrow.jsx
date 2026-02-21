import { WIND_ARROW_SHAPE } from "./WindArrowShape";

export default function WindArrow({ degrees, size }) {
	if (degrees == null) return null;

	// Vi legger til 180 grader fordi pilen skal peke dit vinden blåser MOT.
	const rotation = degrees + 180;

	return (
		<span 
			className="wind-arrow" 
			style={{ 
				"--wind-rotation": `${rotation}deg`,
				width: `${size}px`,
				height: `${size}px`
			}}
			title={`Vindretning: ${degrees}°`}
		>
			<svg 
				width={size} 
				height={size} 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				strokeWidth="2.5" 
				strokeLinecap="round" 
				strokeLinejoin="round"
			>
				<path d={WIND_ARROW_SHAPE} />
			</svg>
		</span>
	);
}