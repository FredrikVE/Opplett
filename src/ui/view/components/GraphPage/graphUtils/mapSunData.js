//src/ui/view/components/GraphPage/graphUtils/mapSunData.js
export function mapSunData(sunTimesByDate) {
    if (!sunTimesByDate) {
        return [];
    }

    const entries = Object.entries(sunTimesByDate).map(([dateISO, data]) => {
        const [riseH, riseM] = data.sunrise.split(':').map(Number);
        const [setH, setM] = data.sunset.split(':').map(Number);
        
        const totalMinutes = (setH * 60 + setM) - (riseH * 60 + riseM);
        const diffMinutes = Math.abs(parseInt(data.dayLengthDiffText, 10)) || 0;
        
        const currentTotal = totalMinutes / 60;
        const prevDay = (totalMinutes - diffMinutes) / 60;

        return {
            x: Date.parse(dateISO),
            y: currentTotal,           // Total høyde (oransje)
            prevY: prevDay,            // Gårsdagens høyde (gul)
            diffText: data.dayLengthDiffText,
            fullDisplay: `${Math.floor(totalMinutes / 60)}t ${totalMinutes % 60}m`
        };
    });

    return entries.sort((a, b) => a.x - b.x);
}