// src/ui/view/components/HomePage/Graph/graphConfig/chartConfig.js
import { CHART_LAYOUT } from './constants';

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