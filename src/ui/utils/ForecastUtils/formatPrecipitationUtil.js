//src/ui/utils/ForecastUtils/formatPrecipitationUtil.js
export const formatPrecipitation = (data) => {
    
	if (!data) { 
		return "–";
	}

    const { amount, min, max } = data;

    if (min !== undefined && max !== undefined && min !== max) {
        return `${min} – ${max} mm`;
    }
	
    return `${amount} mm`;
};
