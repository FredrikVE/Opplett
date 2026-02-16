//src/ui/view/components/GraphPage/graphUtils/mapHourlyForecastToMeteogram.js
export function mapHourlyForecastToMeteogram(hourlyData, getLocalHour) {
    if (!hourlyData?.length) {
        return null;
    }

    const firstTimestamp = Date.parse(hourlyData[0].timeISO);
    const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

    const temperature = [];
    const rain = [];
    const rainExtra = [];
    const weatherSymbols = []; // Ny array for ikonene
    const midnights = [];

    // Definer hvor ofte vi vil vise et symbol (f.eks. hver 3. time)
    // Dette hindrer at ikonene overlapper hverandre i grafen.
    const symbolInterval = 3;

    hourlyData.forEach((h, index) => {
        const time = Date.parse(h.timeISO);
        const hour = getLocalHour(time);

        if (hour === 0) {
            midnights.push(time);
        }

        // 1. Temperatur-data
        temperature.push([time, h.temp]);

        // 2. Nedbør-data (forventet)
        rain.push([time, h.precipitation.amount]);

        // 3. Nedbør-data (mulig ekstra/usikkerhet)
        const max = h.precipitation.maxAmount ?? h.precipitation.amount;
        rainExtra.push([
            time,
            Math.max(max - h.precipitation.amount, 0)
        ]);

        // 4. Værsymboler
        // Vi plukker ut symboler basert på intervall, 
        // men sørger for at vi alltid har med det aller første symbolet.
        if (index % symbolInterval === 0 || index === 0) {
            weatherSymbols.push({
                x: time,
                y: 0, // Denne y-verdien er en placeholder; vi styrer høyden via yAxis-konfigurasjonen
                symbolCode: h.weatherSymbol
            });
        }
    });

    return {
        firstTimestamp,
        lastTimestamp,
        temperature,
        rain,
        rainExtra,
        weatherSymbols, // Returnerer symbol-settet til grafen
        midnights
    };
}