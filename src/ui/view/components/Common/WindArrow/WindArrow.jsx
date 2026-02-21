//src/ui/view/components/Common/WindArrow/WindArrow.jsx

/**
 * WindArrow komponent
 * @param {number} degrees - Retningen vinden kommer FRA (0 = Nord, 90 = Øst, etc.)
 * @param {number} size - Størrelse i piksler (default 20)
 */
export default function WindArrow({ degrees, size}) {
    if (degrees == null) return null;

    // Vi legger til 180 grader fordi pilen skal peke dit vinden blåser MOT.
    const rotation = degrees + 180;

    return (
        <span 
            className="wind-arrow" 
            style={{ 
                display: 'inline-block',
                transform: `rotate(${rotation}deg)`,
                width: `${size}px`,
                height: `${size}px`,
                lineHeight: 0
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
                <path d="M12 19V5M12 5L5 12M12 5L19 12" />
            </svg>
        </span>
    );
}