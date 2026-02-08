// src/ui/view/components/HomePage/Graph/graphConfig/windSeries.js
export function buildWindSeries(data) {
    return [
        {
            name: 'Vind',
            type: 'spline',
            data: data.wind,
            color: '#6a0dad',
            zIndex: 2
        },
        {
            name: 'Vindkast',
            type: 'spline',
            data: data.gust,
            color: '#9c27b0',
            dashStyle: 'ShortDot',
            zIndex: 3
        }
    ];
}
