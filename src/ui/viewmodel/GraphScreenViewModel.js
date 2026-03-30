// src/ui/viewmodel/GraphScreenViewModel.js
export default function useGraphScreenViewModel(forecastViewModel) {

    const getHourlyForecastList = (forecastByDate) => {
        const hourlyForecastList = [];
        const allDays = Object.values(forecastByDate || {});

        for (const dayData of allDays) {
            if (dayData && Array.isArray(dayData.hours)) {
                for (const hour of dayData.hours) {
                    hourlyForecastList.push(hour);
                }
            }
        }

        return hourlyForecastList;
    };

    return {
        // Grafdata
        hourlyData: getHourlyForecastList(forecastViewModel.forecast),
        sunTimesByDate: forecastViewModel.sunTimesByDate,

        // Status
        loading: forecastViewModel.loading,
        error: forecastViewModel.error,

        // Lokasjon
        location: forecastViewModel.location,

        // Tidsformatering
        getLocalHour: forecastViewModel.getLocalHour,
        formatLocalDate: forecastViewModel.formatLocalDate,
        formatLocalDateTime: forecastViewModel.formatLocalDateTime,
    };
}