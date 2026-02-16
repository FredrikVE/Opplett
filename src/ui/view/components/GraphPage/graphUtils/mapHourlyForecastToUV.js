//src/ui/view/components/HomePage/Graph/graphUtils/mapHourlyForecastToUV.js
export function mapHourlyForecastToUV(hourlyData, getLocalHour) {
    if (!hourlyData?.length) return null;

    const firstTimestamp = Date.parse(hourlyData[0].timeISO);
    const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);
    const midnights = [];
    
    const uvData = hourlyData.map(h => {
        const time = Date.parse(h.timeISO);
        if (getLocalHour(time) === 0) midnights.push(time);
        
        const val = h.uv ?? 0;
        let color = '#28a745'; // Default grønn

        if (val >= 11) color = '#7b1fa2';
        else if (val >= 8) color = '#e64a19';
        else if (val >= 6) color = '#d32f2f';
        else if (val >= 3) color = '#fbc02d';

        return {
            x: time,
            y: val,
            color: color
        };
    });

    return { firstTimestamp, lastTimestamp, uvData, midnights };
}