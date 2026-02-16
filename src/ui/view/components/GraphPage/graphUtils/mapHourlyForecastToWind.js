//src/ui/view/components/GraphPage/graphUtils/mapHourlyForecastToWind.js
export function mapHourlyForecastToWind(hourlyData, getLocalHour) {
    if (!hourlyData?.length) {
        return null;
    }

    const firstTimestamp = Date.parse(hourlyData[0].timeISO);
    const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

    const wind = [];
    const gust = [];
    const midnights = [];

    hourlyData.forEach(h => {
        const time = Date.parse(h.timeISO);

        if (getLocalHour(time) === 0) {
            midnights.push(time);
        }

        wind.push([time, h.wind ?? 0]);
        gust.push([time, h.details?.wind_speed_of_gust ?? 0]);
    });

    return {
        firstTimestamp,
        lastTimestamp,
        wind,
        gust,
        midnights
    };
}
