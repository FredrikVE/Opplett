//src/ui/view/components/HomePage/UVNowBar/UVNowBar.jsx
export default function UVNowBar({ uvValue }) {

	const uvPercent = Math.min((uvValue / 12) * 100, 100);      // Mapping av UV-indeks (0-12) til prosent (0-100%)

	const getUvLevelText = (uv) => {
		if (uv < 3) return "Lav";
		if (uv < 6) return "Moderat";
		if (uv < 8) return "Høy";
		if (uv < 11) return "Svært høy";
		return "Ekstrem";
	};

	return (
		<div className="uv-now-container">
			<div className="uv-header">
				<span className="uv-label">UV-indeks nå</span>
				<span className="uv-value">
					{uvValue.toFixed(1)} <span className="uv-text-hint">({getUvLevelText(uvValue)})</span>
				</span>
			</div>
			
			<div className="uv-gradient-bar">
				<div className="uv-gradient-track"></div>
				<div 
					className="uv-indicator" 
					style={{ left: `${uvPercent}%` }}
					aria-label={`UV-indeks er ${uvValue}`}
				></div>
			</div>
		</div>
	);
}