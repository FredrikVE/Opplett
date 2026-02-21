// src/ui/view/components/GraphPage/graphUtils/tooltipFormatter.js

export function createTooltipFormatter(context, formatLocalDateTime) {
    // Highcharts mapper 'this' til context når vi kaller den manuelt
    const { x, points } = context;

    if (typeof formatLocalDateTime !== 'function') {
        return "";
    }

    //Lag overskriften (Tidspunktet)
    let tooltipHtml = `<b>${formatLocalDateTime(x)}</b>`;

    if (!points || points.length === 0) {
        return tooltipHtml;
    }

    //Bygg innholdet for hvert punkt
    points.forEach((point) => {
        // Hopp over tomme verdier (viktig for vindpiler/windbarbs)
        if (point.y === null || point.y === undefined) return;

        const seriesName = point.series.name;
        
        //Henter suffix fra serie-innstillingene, fallback til tom streng eller m/s basert på behov
        //Du kan også sjekke point.series.userOptions.tooltip?.valueSuffix
        const suffix = point.series.tooltipOptions?.valueSuffix || "";
        
        tooltipHtml += `<br/>${seriesName}: <b>${point.y}${suffix}</b>`;
    });

    return tooltipHtml;
}