// src/ui/view/components/GraphPage/graphUtils/mapHourlyForecastToWind.js

export function mapHourlyForecastToWind(hourlyData, getLocalHour) {
    if (!hourlyData?.length) return null;

    const firstTimestamp = Date.parse(hourlyData[0].timeISO);
    const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

    const wind = [];
    const gust = [];
    const windDirections = []; // Ny liste for piler
    const midnights = [];

    const symbolInterval = 3;

    hourlyData.forEach((h, index) => {
        const time = Date.parse(h.timeISO);

        if (getLocalHour(time) === 0) {
            midnights.push(time);
        }

        wind.push([time, h.wind ?? 0]);
        gust.push([time, h.details?.wind_speed_of_gust ?? 0]);

        // Hent vindretning hver 3. time
        if (index % symbolInterval === 0 || index === 0) {
            windDirections.push({
                x: time,
                y: 0,
                degrees: h.details?.wind_from_direction
            });
        }
    });

    return {
        firstTimestamp,
        lastTimestamp,
        wind,
        gust,
        windDirections, // Returner denne
        midnights
    };
}