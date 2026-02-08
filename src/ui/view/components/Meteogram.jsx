import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

//Konstant for farger
const COLORS = {
    tempPositive: '#dd4141',
    tempNegative: '#0078ff',
    rainExpected: '#5DADE2',
    rainPossible: '#AED6F1',
    gridLine: '#ccd6eb'
};


//Formaterer X-aksen slik du ville ha den
const formatXAxisLabels = (hourlyData) => hourlyData.map(h => {
    const isMidnight = h.localTime === 0;
    if (isMidnight) {
        const date = new Date(h.timeISO);
        const dayName = date.toLocaleDateString('nb-NO', { weekday: 'short' });
        return `<b>${dayName}</b>`;
    }
    return `${h.localTime}`;
});


//Genererer gradienter for soner
const getZones = () => [
    {
        value: 0,
        color: COLORS.tempNegative,
        fillColor: {
            linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
            stops: [
                [0, 'rgba(0, 120, 255, 0)'],
                [1, 'rgba(0, 120, 255, 0.35)']
            ]
        }
    },
    {
        color: COLORS.tempPositive,
        fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
                [0, 'rgba(242, 100, 25, 0.35)'],
                [1, 'rgba(242, 100, 25, 0)']
            ]
        }
    }
];

//Komponent med graf
export default function Meteogram({ hourlyData }) {
    
    // 1. Data Processing (Inspirert av din RainChart-logikk)
    const processedData = {
        categories: formatXAxisLabels(hourlyData),
        temp: hourlyData.map(h => h.temp),
        rainExpected: hourlyData.map(h => h.precipitation.amount),
        rainExtra: hourlyData.map(h => {
            const max = h.precipitation.maxAmount || h.precipitation.amount;
            return Math.max(max - h.precipitation.amount, 0);
        })
    };

    // 2. Chart Options
    const options = {
        chart: { 
            type: 'areaspline', 
            height: 350, 
            backgroundColor: 'transparent',
            spacingBottom: 30 
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            categories: processedData.categories,
            tickInterval: 3,
            gridLineWidth: 1,
            gridLineDashStyle: 'ShortDash',
        },
        yAxis: [
            { // Temperatur
                title: { text: null },
                labels: { format: '{value}°' },
                plotLines: [{ value: 0, color: COLORS.gridLine, width: 2, zIndex: 2 }]
            },
            { // Nedbør
                title: { text: null },
                labels: { format: '{value} mm' },
                opposite: true,
                min: 0,
                gridLineWidth: 0
            }
        ],
        plotOptions: {
            areaspline: {
                marker: { enabled: false },
                lineWidth: 2,
                threshold: null,
                zones: getZones()
            },
            column: {
                stacking: 'normal',
                borderWidth: 0,
                pointPadding: 0.1
            }
        },
        series: [
            {
                name: 'Temperatur',
                data: processedData.temp,
                yAxis: 0,
                zIndex: 2,
                tooltip: { valueSuffix: '°C' }
            },
            {
                name: 'Forventet nedbør',
                type: 'column',
                data: processedData.rainExpected,
                yAxis: 1,
                color: COLORS.rainExpected,
                zIndex: 1,
                tooltip: { valueSuffix: ' mm' }
            },
            {
                name: 'Mulig ekstra',
                type: 'column',
                data: processedData.rainExtra,
                yAxis: 1,
                color: COLORS.rainPossible,
                zIndex: 1,
                tooltip: { valueSuffix: ' mm' }
            }
        ],
        tooltip: { 
            shared: true, 
            useHTML: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#eee'
        }
    };

    return (
        <div className="meteogram-container">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}