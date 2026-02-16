//src/navigation/Navigation.jsx
export default function Navigation({ activeScreen, onChangeScreen, SCREENS }) {
	return (
		<div className="view-mode-selector">
			<div className="toggle-container">
				
				<button
					className={activeScreen === SCREENS.ALERTS ? "active" : ""}
					onClick={() => onChangeScreen(SCREENS.ALERTS)}
				>
		  			Varsler
				</button>
		
				<button
					className={activeScreen === SCREENS.TABLE ? "active" : ""}
					onClick={() => onChangeScreen(SCREENS.TABLE)}
				>
					Tabell
				</button>

				<button
					className={activeScreen === SCREENS.GRAPH ? "active" : ""}
					onClick={() => onChangeScreen(SCREENS.GRAPH)}
				>
					Graf
				</button>
			</div>
		</div>
	);
}
