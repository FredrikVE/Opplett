//src/ui/view/components/HomePage/Graph/graphConfig/weatherGraphSeries.js
import { COLORS } from "./constants.js";
import { getWeatherIconFileName } from "../../../../../utils/weatherIcons.js";

function buildWeatherSymbolSeries(symbolData) {
    if (!symbolData || symbolData.length === 0) {
        return { 
            type: "scatter", 
            data: [] 
        };
    }

    const weatherSymbolPoints = symbolData.map((symbol) => {

        //Hent filnavnet basert på symbolkoden
        const iconFileName = getWeatherIconFileName(symbol.symbolCode);

        //Hvis vi ikke finner et ikon, returnerer vi null (som filtreres bort senere)
        if (!iconFileName) {
            return null;
        }

        //Definer bilde-stien for værikoner
        const iconUrl = `/weather_icons/200/${iconFileName}`;

        //Returner det ferdige Highcharts-punktobjektet
        return {
            x: symbol.x,     // Tidspunkt på x-aksen
            y: 0.5,          // Vertikal plassering (midt i ikon-sonen)
            marker: {
                symbol: `url(${iconUrl})`,
                width: 32,
                height: 32
            }
        };
    })

    return {
        name: "Vær",
        type: "scatter",
        data: weatherSymbolPoints,
        yAxis: 2,
        zIndex: 5,
        enableMouseTracking: false,
        showInLegend: false,
        pointPlacement: "on",
        clip: false, 
        dataLabels: {
            enabled: false
        }
    };
}

export function buildForecastLayers(data) {
    return [

        buildWeatherSymbolSeries(data.weatherSymbols),
        {
            name: "Temperatur",
            type: "areaspline",
            data: data.temperature,
            zIndex: 2,
            pointPlacement: "on",
            tooltip: {
                valueSuffix: "°C"
            }
        },
        {
            name: "Nedbør",
            type: "column",
            data: data.rain,
            yAxis: 1,
            color: COLORS.rainExpected,
            zIndex: 3,
            pointPlacement: "on",
            tooltip: {
                valueSuffix: " mm"
            }
        },
        {
            name: "Mulig ekstra",
            type: "column",
            data: data.rainExtra,
            yAxis: 1,
            color: COLORS.rainPossible,
            zIndex: 1,
            pointPlacement: "on",
            tooltip: {
                valueSuffix: " mm"
            }
        }
    ];
}