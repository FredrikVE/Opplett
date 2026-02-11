// src/ui/view/components/HomePage/Graph/graphUtils/mapSunData.js
export function mapSunData(sunTimesByDate) {
    if (!sunTimesByDate) return [];

    return Object.entries(sunTimesByDate)
        .map(([dateISO, data]) => {
            // Vi henter ut timene fra strengen (f.eks "08:30" -> 8.5)
            // Eller enda bedre: Vi regner det ut basert på tidsdifferansen hvis vi har den
            
            // Siden du har formatert tidene til strenger i ViewModel, 
            // må vi parse dem tilbake eller sende med råminutter. 
            // La oss anta vi parser strengene "HH:mm":
            const [riseH, riseM] = data.sunrise.split(':').map(Number);
            const [setH, setM] = data.sunset.split(':').map(Number);
            
            const riseInMinutes = riseH * 60 + riseM;
            const setInMinutes = setH * 60 + setM;
            const durationMinutes = setInMinutes - riseInMinutes;
            const hours = durationMinutes / 60;

            return {
                x: Date.parse(dateISO),
                y: parseFloat(hours.toFixed(2)),
                displayLabel: `${Math.floor(hours)}t ${durationMinutes % 60}m`,
                diffText: data.dayLengthDiffText // "+2 min"
            };
        })
        .sort((a, b) => a.x - b.x);
}