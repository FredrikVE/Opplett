//src/ui/viewmodel/GraphScreenViewModel.js

export default function useGraphScreenViewModel(homeViewModel) {

	//Henter ut en samlet liste med alle timeprognoser fra forecast gruppert per dato
	const getHourlyForecastList = (forecastByDate) => {
		const safeForecast = forecastByDate || {};
		const entries = Object.entries(safeForecast);
		const hourlyForecastList = [];

		entries.forEach(function (entry) {

			const dayData = entry[1];

			if (dayData && Array.isArray(dayData.hours)) {
				dayData.hours.forEach(function (hour) {
					hourlyForecastList.push(hour);
				});
			}

		});
		return hourlyForecastList;
	};

	return {
		hourlyData: getHourlyForecastList(homeViewModel.forecast),
		sunTimesByDate: homeViewModel.sunTimesByDate,
		loading: homeViewModel.loading,
		error: homeViewModel.error,
		getLocalHour: homeViewModel.getLocalHour,
		formatLocalDate: homeViewModel.formatLocalDate
	};
}
