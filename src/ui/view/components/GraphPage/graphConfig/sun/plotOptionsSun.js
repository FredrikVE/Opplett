//src/ui/view/components/GraphPage/graphConfig/sun/plotOptionsSun.js
export function buildSunPlotOptions(axisMin) {
    return {
        column: {
            grouping: false,
            borderWidth: 0,
            pointPadding: 0.1,
            threshold: axisMin,
            states: {
                inactive: { opacity: 1 }
            }
        }
    };
}