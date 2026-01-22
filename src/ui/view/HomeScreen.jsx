// src/ui/view/HomeScreen.jsx
export default function HomeScreen({ viewModel }) {

    //statevariabel for loading og error
    const { forecast, loading, error } = viewModel;

    if (loading) {
        return <p>Laster værmelding...</p>;
    }

    if (error) {
        return <p>Feil: {error}</p>;
    }

    return (
        <div>
            <h1>Time-for-time værmelding</h1>

            <ul>
                {forecast.map((item, index) => (
                    <li key={index}>
                        <strong>{item.localTime}</strong> –{" "}
                        {item.details.air_temperature}°C
                    </li>
                ))}
            </ul>
        </div>
    );
}

