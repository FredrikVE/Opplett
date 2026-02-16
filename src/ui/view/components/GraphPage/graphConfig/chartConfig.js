//src/ui/view/components/GraphPage/graphConfig/chartConfig.js
export const CHART_LAYOUT = {
    HEIGHT: 500,
    MARGIN_LEFT: 50,
    MARGIN_RIGHT: 50,
    SPACING_TOP: 10,
    SPACING_BOTTOM: 20
};

export function buildCommonChartConfig() {
    return {
        height: CHART_LAYOUT.HEIGHT,
        backgroundColor: 'transparent',
        spacingTop: CHART_LAYOUT.SPACING_TOP,
        spacingBottom: CHART_LAYOUT.SPACING_BOTTOM,
        spacingLeft: 0,
        spacingRight: 0,
        
        //Gjør at grafene flukter perfekt:
        marginLeft: CHART_LAYOUT.MARGIN_LEFT,
        marginRight: CHART_LAYOUT.MARGIN_RIGHT,
        style: { 
            fontFamily: 'inherit' 
        },
    };
}