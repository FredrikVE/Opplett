//src/ui/view/components/GraphPage/graphConfig/sun/sunSeries.js
export function buildSunSeries(data) {
    return [
        {
            name: "Total lengde",
            data: data.map(d => ({ 
                x: d.x, 
                y: d.y, 
                diffText: d.diffText, 
                fullDisplay: d.fullDisplay 
            })),
            color: "#ef6c00", // Mørk orange (toppen)
            zIndex: 1,
            enableMouseTracking: false,
            dataLabels: {
                enabled: true,
                useHTML: true,
                y: -18,
                formatter() {
                    return `<div style="color: #ef6c00; font-size: 10px; font-weight: bold; text-align: center;">
                                ${this.point.diffText}
                            </div>`;
                }
            }
        },
        {
            name: "Gårsdagens lengde",
            data: data.map(d => ({ x: d.x, y: d.prevY })),
            color: "#fbc02d", // Lys gul (basen)
            zIndex: 2,
            showInLegend: false,
            borderRadius: 0,
            states: {
                hover: {
                    enabled: true,
                    brightness: 0.1
                }
            }
        }
    ];
}