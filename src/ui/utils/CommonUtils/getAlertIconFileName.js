//src/ui/utils/CommonUtils/getAlertIconFileName.js


/******************** Kildehenvisning ****************************

## Bruk av ikoner.

NRK tillater fri bruk av disse ikonene mot kreditering.
Farevarselikonene brukt i dette programmet er hentet fra NRK og yr.no.

# Kilder:
NRK. (u å). Yr warning icons.
https://nrkno.github.io/yr-warning-icons/

ChatGPT. (2026, Januar). ChatGPT.
https://chatgpt.com/

 **********************************************************************/

export function getAlertIconFileName(alert) {
    if (!alert) {
        return "icon-warning-generic-yellow.png";
    }

    const event = alert.event;
    const color = alert.riskMatrixColor?.toLowerCase() ?? "yellow";

    const EVENT_ICON_MAP = {
        avalanches: "icon-warning-avalanches",
        blowingSnow: "icon-warning-snow",
        snow: "icon-warning-snow",

        rain: "icon-warning-rain",
        rainFlood: "icon-warning-rainflood",
        flood: "icon-warning-flood",

        wind: "icon-warning-wind",
        gale: "icon-warning-wind",

        stormSurge: "icon-warning-stormsurge",

        forestFire: "icon-warning-forestfire",

        lightning: "icon-warning-lightning",

        ice: "icon-warning-ice",
        icing: "icon-warning-ice",

        polarLow: "icon-warning-polarlow"
    };

    const base = EVENT_ICON_MAP[event] ?? "icon-warning-generic";

    return `${base}-${color}.png`;
}
