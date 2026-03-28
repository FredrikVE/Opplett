//test/model/data/weather.mock.js
export const mockWeatherResponse = {
    type: "Feature",
    geometry: { 
        type: "Point", 
        coordinates: [6.44, 60.66, 132] 
    },
    properties: {
        meta: {
            updated_at: "2026-03-03T10:00:00Z", 
            units: { 
                air_temperature: "celsius", 
                precipitation_amount: "mm" 
            } 
        },
        timeseries: [
            // --- MANDAG 2. MARS / TIRSDAG 3. MARS GRENSE ---
            {
                // UTC 22:00 (2. mars) 
                // Oslo: 23:00 (Mandag) | Pago Pago: 11:00 (Mandag) | Nepal: 03:45 (Tirsdag)
                "time": "2026-03-02T22:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 2.5, "wind_speed": 2.0 } },
                    "next_1_hours": { "summary": { "symbol_code": "partlycloudy_night" }, "details": { "precipitation_amount": 0.0 } }
                }
            },
            {
                // UTC 23:00 (2. mars) -> DENNE TRENGER DU FOR MIDNATT-TESTEN I OSLO
                // Oslo: 00:00 (Tirsdag) | Pago Pago: 12:00 (Mandag) | Nepal: 04:45 (Tirsdag)
                "time": "2026-03-02T23:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 2.0, "wind_speed": 1.5 } },
                    "next_1_hours": { "summary": { "symbol_code": "clearsky_night" }, "details": { "precipitation_amount": 0.0 } }
                }
            },

            // --- TIRSDAG 3. MARS ---
            {
                // UTC 09:00 -> Oslo 10:00 | Nepal 14:45 | Pago Pago 22:00 (Mandag)
                "time": "2026-03-03T09:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 4.4, "wind_speed": 3.5, "ultraviolet_index_clear_sky": 0.9 } },
                    "next_1_hours": { "summary": { "symbol_code": "rain" }, "details": { "precipitation_amount": 0.5 } },
                    "next_6_hours": { "summary": { "symbol_code": "heavyrain" }, "details": { "precipitation_amount": 5.0, "precipitation_amount_min": 2.4, "precipitation_amount_max": 8.5 } }
                }
            },
            {
                // UTC 10:00 -> Oslo 11:00 | Nepal 15:45 | Pago Pago 23:00 (Mandag)
                "time": "2026-03-03T10:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 4.1, "wind_speed": 2.5 } },
                    "next_1_hours": { "summary": { "symbol_code": "rain" }, "details": { "precipitation_amount": 0.8 } }
                }
            },
            {
                // UTC 11:00 -> Oslo 12:00 | Nepal 16:45 | Pago Pago 00:00 (Tirsdag)
                // Her bikker Pago Pago over til Tirsdag!
                "time": "2026-03-03T11:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 5.2, "wind_speed": 4.0 } },
                    "next_1_hours": { "summary": { "symbol_code": "cloudy" }, "details": { "precipitation_amount": 0.0 } }
                }
            },
            {
                // UTC 15:00 -> Oslo 16:00 | Nepal 20:45
                "time": "2026-03-03T15:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 10.5, "wind_speed": 2.1 } },
                    "next_6_hours": { "summary": { "symbol_code": "clearsky_day" }, "details": { "precipitation_amount": 0.0, "precipitation_amount_min": 0.0, "precipitation_amount_max": 0.0 } }
                }
            },
            {
                // UTC 21:00 -> Oslo 22:00 | Nepal 02:45 (Onsdag)
                "time": "2026-03-03T21:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 2.1, "wind_speed": 1.5 } },
                    "next_6_hours": { "summary": { "symbol_code": "partlycloudy_night" }, "details": { "precipitation_amount": 1.2, "precipitation_amount_min": 0.5, "precipitation_amount_max": 2.0 } }
                }
            },

            // --- ONSDAG 4. MARS ---
            {
                // UTC 03:00 -> Oslo 04:00
                "time": "2026-03-04T03:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": -1.5, "wind_speed": 5.0 } },
                    "next_6_hours": { "summary": { "symbol_code": "snow" }, "details": { "precipitation_amount": 3.0, "precipitation_amount_min": 1.0, "precipitation_amount_max": 5.0 } }
                }
            },
            {
                // UTC 09:00 -> Oslo 10:00
                "time": "2026-03-04T09:00:00Z",
                "data": {
                    "instant": { "details": { "air_temperature": 3.5, "wind_speed": 2.0 } },
                    "next_1_hours": { "summary": { "symbol_code": "fair_day" }, "details": { "precipitation_amount": 0.0 } }
                }
            }
        ]
    }
};