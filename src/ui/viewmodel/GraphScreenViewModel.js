//src/ui/viewmodel/GraphScreenViewModel.js
export default function useGraphScreenViewModel(homeViewModel) {

    const getHourlyForecastList = (forecastByDate) => {
        const hourlyForecastList = [];
        
        //Bruker Object.values() for å slippe entry[1]-styret
        //Da får vi listen over dager direkte
        const allDays = Object.values(forecastByDate || {});

        for (const dayData of allDays) {
            //Sjekker at vi faktisk har data og at "hours" finnes
            if (dayData && Array.isArray(dayData.hours)) {
                
                //En enkel for-of løkke er ofte lettere å lese enn forEach
                for (const hour of dayData.hours) {
                    hourlyForecastList.push(hour);
                }
            }
        }

        return hourlyForecastList;
    };

    return {
        
        //Grafdata
		hourlyData: getHourlyForecastList(homeViewModel.forecast),
		sunTimesByDate: homeViewModel.sunTimesByDate,

		//Status
		loading: homeViewModel.loading,
		error: homeViewModel.error,

		//Lokasjon
		location: homeViewModel.location,

		//Tid
		getLocalHour: homeViewModel.getLocalHour,
		formatLocalDate: homeViewModel.formatLocalDate,
        formatLocalDateTime: homeViewModel.formatLocalDateTime,

		//Søk
		query: homeViewModel.query,
		suggestions: homeViewModel.suggestions,
		onSearchChange: homeViewModel.onSearchChange,
		onSuggestionSelected: homeViewModel.onSuggestionSelected,
		onResetToDeviceLocation: homeViewModel.onResetToDeviceLocation
    };
}