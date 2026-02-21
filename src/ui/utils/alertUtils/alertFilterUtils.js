//src/ui/utils/alertUtils/alertFilterUtils.js
import { getRiskLevelText } from "../getRiskLevelText.js";

export function buildLocationOptions(viewModel, counties, marineAreas) {
    const format = (loc) => {
        const id = loc.id;
        const name = loc.name || loc.id;
        const count = viewModel.getCountForLocation(id);
        return { id, name, displayName: `${name} (${count})`, count };
    };

    const options = counties.map(format);
    
    if (viewModel.activeDomain === "marine") {
        const marine = marineAreas.map(format).filter(m => m.count > 0);
        options.push(...marine);
    }

    return options.sort((a, b) => 
        (b.count - a.count) || a.name.localeCompare(b.name, 'no')
    );
}

export function buildTypeOptions(allAlerts) {
    const typesMap = new Map();

    for (const alert of allAlerts) {
        if (alert.event && !typesMap.has(alert.event)) {
            typesMap.set(alert.event, alert.eventAwarenessName || alert.event);
        }
    }

    const options = [];
    typesMap.forEach((label, value) => {
        options.push({ value, label });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label, 'no'));
}

export function getLevelOptions() {
    return ["Yellow", "Orange", "Red"].map(color => ({
        value: color,
        label: getRiskLevelText(color)
    }));
}