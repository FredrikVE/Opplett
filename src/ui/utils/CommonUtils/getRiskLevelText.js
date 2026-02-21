    //src/ui/utils/CommonUtils/getRiskLevelText.js
    export function getRiskLevelText(riskMatrixColor) {
        
        switch (riskMatrixColor) {
            case "Yellow":
                return "Gult nivå";
            case "Orange":
                return "Oransje nivå";
            case "Red":
                return "Rødt nivå";
            
            default:
                return "";  //hvis udefinert farenivå
        }
    };