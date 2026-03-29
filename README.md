# VærVarselet

VærVarselet er et personlig prosjekt laget for å lære og utforske **MVVM-arkitektur i React**.  
Applikasjonen henter værdata fra **Meteorologisk institutt (MET)**, er inspirert av **Yr.no**, og kombinerer dette med kart, værvisualisering, grafvisning og stedssøk.

Prosjektet er bygget som en MVVM-inspirert frontend-applikasjon der ansvaret er delt mellom:

- **Model** – datasource, repositories og use cases
- **ViewModel** – hooks som holder UI-tilstand og presentasjonslogikk
- **View** – React-komponenter og pages

I tillegg bruker appen **MapTiler** for kart og stedsdata, **MapTiler Weather** for væranimasjoner på kartet og **Highcharts** for grafvisualisering.

---

## Hurtigstart

Installer avhengigheter:

```bash
npm install
````

Start utviklingsserver:

```bash
npm run dev
```

---

## Dokumentasjon

<table>
    <tr>
        <th>Dokument</th>
        <th>Beskrivelse</th>
        <th>Lenke</th>
    </tr>
    <tr>
        <td>README.md</td>
        <td>Forside og oversikt over prosjektet.</td>
        <td><a href="./README.md">Åpne</a></td>
    </tr>
    <tr>
        <td>SETUP.md</td>
        <td>Installasjon, oppstart, miljøvariabler og lokal konfigurasjon.</td>
        <td><a href="./docs/SETUP.md">Åpne</a></td>
    </tr>
    <tr>
        <td>ARCHITECTURE.md</td>
        <td>Beskrivelse av MVVM-strukturen, lagdeling og designvalg.</td>
        <td><a href="./docs/ARCHITECTURE.md">Åpne</a></td>
    </tr>
    <tr>
        <td>PAGES.md</td>
        <td>Oversikt over sidene i appen og hva de har ansvar for.</td>
        <td><a href="./docs/PAGES.md">Åpne</a></td>
    </tr>
    <tr>
        <td>MAP_PAGE.md</td>
        <td>Detaljert dokumentasjon av MapPage, kartlag, markører, highlight og kartlogikk.</td>
        <td><a href="./docs/MAP_PAGE.md">Åpne</a></td>
    </tr>
    <tr>
        <td>TIMEZONES.md</td>
        <td>Hvordan appen håndterer UTC, lokal tid, tidssoner og lokasjonsdata.</td>
        <td><a href="./docs/TIMEZONES.md">Åpne</a></td>
    </tr>
    <tr>
        <td>TESTING.md</td>
        <td>Teststruktur, testformål og hvordan testene kjøres.</td>
        <td><a href="./docs/TESTING.md">Åpne</a></td>
    </tr>
    <tr>
        <td>CREDITS.md</td>
        <td>Biblioteker, datakilder, ikoner og ekstern kreditering.</td>
        <td><a href="./docs/CREDITS.md">Åpne</a></td>
    </tr>
</table>

---

## Sentrale funksjoner

* værvarsel for valgt lokasjon
* grafvisning av værdata
* farevarsler
* kartvisning med markører og geometri
* vær-layers via MapTiler Weather
* søk og håndtering av aktiv lokasjon
* tidssonebevisst presentasjon av data

---

## Forenklet mappestruktur

```bash
.
├── README.md
├── docs
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── PAGES.md
│   ├── MAP_PAGE.md
│   ├── TIMEZONES.md
│   ├── TESTING.md
│   └── CREDITS.md
├── images
├── public
├── src
└── test
```

---

## Arkitekturdiagram

![Arkitekturdiagram](./images/Arkitektur.png)

---

## Teknologioversikt

* React
* Vite
* MapTiler
* MapTiler Weather
* Highcharts
* Luxon
* tz-lookup

---

## Om prosjektet

Dette prosjektet er først og fremst et læringsprosjekt for å utforske hvordan en React-applikasjon kan struktureres med en MVVM-inspirert arkitektur.

Målet har vært å:

* redusere kompleksitet i UI-laget
* få tydeligere ansvarsdeling
* gjøre logikken lettere å teste og videreutvikle
* samle presentasjonslogikk i ViewModels og applikasjonslogikk i Model-laget



---

## Kreditering og datakilder

VærVarselet bygger på flere eksterne datakilder, biblioteker og visuelle ressurser.

<table border="1">
    <tr>
        <th>Ressurs</th>
        <th>Bruk i prosjektet</th>
        <th>Lenke</th>
    </tr>
    <tr>
        <td>Meteorologisk institutt (MET)</td>
        <td>Værdata og varseldata</td>
        <td><a href="https://www.met.no/">met.no</a></td>
    </tr>
    <tr>
        <td>Yr.no</td>
        <td>Inspirasjon for presentasjon og værkontekst</td>
        <td><a href="https://www.yr.no/">yr.no</a></td>
    </tr>
    <tr>
        <td>MapTiler</td>
        <td>Kartvisning og kartrelaterte tjenester</td>
        <td><a href="https://www.maptiler.com/">maptiler.com</a></td>
    </tr>
    <tr>
        <td>MapTiler Weather</td>
        <td>Vær-layers og væranimasjoner i kartet</td>
        <td><a href="https://www.maptiler.com/weather/">maptiler.com/weather</a></td>
    </tr>
    <tr>
        <td>Highcharts</td>
        <td>Grafvisualisering av værdata</td>
        <td><a href="https://www.highcharts.com/">highcharts.com</a></td>
    </tr>
    <tr>
        <td>Luxon</td>
        <td>Dato-, tid- og tidssonehåndtering</td>
        <td><a href="https://moment.github.io/luxon/">Luxon</a></td>
    </tr>
    <tr>
        <td>tz-lookup</td>
        <td>Fallback for tidssone basert på koordinater</td>
        <td><a href="https://www.npmjs.com/package/tz-lookup">tz-lookup</a></td>
    </tr>
    <tr>
        <td>Yr Weather Symbols</td>
        <td>Værikoner</td>
        <td><a href="https://nrkno.github.io/yr-weather-symbols/">Yr Weather Symbols</a></td>
    </tr>
    <tr>
        <td>Yr Warning Icons</td>
        <td>Fareikoner</td>
        <td><a href="https://nrkno.github.io/yr-warning-icons/">Yr Warning Icons</a></td>
    </tr>
</table>

### Kreditering i applikasjonen

Applikasjonens footer oppsummerer prosjektet slik:

- Dette er et personlig prosjekt for å lære MVVM-arkitektur i React
- All data er hentet fra Meteorologisk institutt (MET)
- Løsningen er inspirert av Yr.no
- Værikoner er hentet fra **Yr Weather Symbols**
- Fareikoner er hentet fra **Yr Warning Icons**
- Kart og kartrelatert visualisering leveres med støtte fra **MapTiler**
- Grafvisning er bygget med **Highcharts**

### Kildehenvisning for ikoner

**NRK. (u.å.)** *Yr weather symbols.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-weather-symbols/">https://nrkno.github.io/yr-weather-symbols/</a>

**NRK. (u.å.)** *Yr Warning Icons.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-warning-icons/">https://nrkno.github.io/yr-warning-icons/</a>