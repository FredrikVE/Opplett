//src/ui/view/components/SolarInformation.jsx
export default function SolarInformation({ sunTimes }) {
    if (!sunTimes) {
        return null;
    }

    return (
        <div className="sun-times">
            <span>Soloppgang: {sunTimes.sunrise}</span>
            <span>Solnedgang: {sunTimes.sunset}</span>
        </div>
    );
}
