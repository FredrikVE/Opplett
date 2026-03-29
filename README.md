# VærVarselet

VærVarselet er et personlig prosjekt laget for å lære og utforske **MVVM-arkitektur i React**.  
Applikasjonen henter værdata fra **Meteorologisk institutt (MET)**, er inspirert av **Yr.no**, og kombinerer dette med kart, værvisualisering, grafvisning og stedssøk.

Prosjektet er bygget som en MVVM-inspirert frontend-applikasjon der ansvaret er delt mellom:

- **Model** – datasource, repositories og use cases
- **ViewModel** – hooks som holder UI-tilstand og presentasjonslogikk
- **View** – React-komponenter og pages

I tillegg bruker appen **MapTiler** for kart og stedsdata, **MapTiler Weather** for væranimasjoner på kartet og **Highcharts** for grafvisualisering.

---

## Dokumentasjon

<table>
    <tr>
        <th>Seksjon</th>
        <th>Beskrivelse</th>
    </tr>
    <tr>
        <td>Oppsett</td>
        <td><a href="./docs/SETUP.md">Installasjon, oppstart, miljøvariabler og lokal konfigurasjon.</a></td>
    </tr>
    <tr>
        <td>Arkitektur</td>
        <td><a href="./docs/ARCHITECTURE.md">Beskrivelse av MVVM-strukturen, lagdeling og designvalg.</a></td>
    </tr>
    <tr>
        <td>Pages</td>
        <td><a href="./docs/PAGES.md">Oversikt over sidene i appen og hva de har ansvar for.</a></td>
    </tr>
    <tr>
        <td>MapPage</td>
        <td><a href="./docs/MAP_PAGE.md">Detaljert dokumentasjon av MapPage, kartlag, markører, highlight og kartlogikk.</a></td>
    </tr>
    <tr>
        <td>Tidssoner</td>
        <td><a href="./docs/TIMEZONES.md">Hvordan appen håndterer UTC, lokal tid, tidssoner og lokasjonsdata.</a></td>
    </tr>
    <tr>
        <td>Testing</td>
        <td><a href="./docs/TESTING.md">Teststruktur, testformål og hvordan testene kjøres.</a></td>
    </tr>
</table>

---

## Hurtigstart

**Installer avhengigheter:**

```bash
npm install
```

**Installer sentrale pakker i prosjektet:**

```bash
npm install @maptiler/sdk
npm install @maptiler/weather
npm install @maptiler/marker-layout
npm install highcharts highcharts-react-official
npm install luxon tz-lookup
```

**Opprett bruker hos MapTiler, API-nøkke og `.env` fil for miljøvariabler**

Legg inn nødvendige miljøvariabler for karttjenesten, må du opprette en MapTiler-bruker og API-nøkkel. 
Dette er gratis og gjøres på følgende måte:

<table>
    <tr>
        <th>Steg</th>
        <th>Beskrivelse</th>
    </tr>
    <tr>
        <td>1</td>
        <td>Gå til <a href="https://www.maptiler.com/">MapTiler</a>.</td>
    </tr>
    <tr>
        <td>2</td>
        <td>Opprett en bruker og logg inn i kontoen din.</td>
    </tr>
    <tr>
        <td>3</td>
        <td>Opprett eller hent en API-nøkkel.</td>
    </tr>
    <tr>
        <td>4</td>
        <td>Opprett en <code>.env</code>-fil i prosjektroten, altså på øverste nivå i prosjektmappen.</td>
    </tr>
</table>

**Legg deretter inn nøkkelen slik:**

```env
VITE_MAPTILER_API_KEY=din_maptiler_nøkkel
```

**Når dette er gjort vil `MapTilerDataSource.js` laste inn nøkkelen**

I modellen og datalaget ligger filen `MapTilerDataSource.js`. 
Denne vil da laste inn API-nøkkelen og gjøre stedsøk og bruk av kartløsning mulig.

Dette ser du øverst i denne kodeblokken:

```javascript
//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
	#apiKey = API_KEY;
	#baseUrl = "https://api.maptiler.com/geocoding";

...

}
```

Når API-nøkkel er lagt inn i `.env`-filen så kan du

**Starte utviklingsserveren og kjøre prosjektet lokalt på maskinen din**

```bash
npm run dev
```

Se <a href="./docs/SETUP.md">SETUP.md</a> for mer informasjon om installasjon, miljøvariabler og lokal konfigurasjon.

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

### Kildehenvisning for ikoner og eksterne biblioteker

**NRK. (u.å.)** *Yr weather symbols.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-weather-symbols/">https://nrkno.github.io/yr-weather-symbols/</a>

**NRK. (u.å.)** *Yr Warning Icons.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-warning-icons/">https://nrkno.github.io/yr-warning-icons/</a>

**MapTiler. (u.å.)** *MapTiler.*  
Hentet fra:  
<a href="https://www.maptiler.com/">https://www.maptiler.com/</a>

**MapTiler. (u.å.)** *MapTiler Weather.*  
Hentet fra:  
<a href="https://www.maptiler.com/weather/">https://www.maptiler.com/weather/</a>

**Highcharts. (u.å.)** *Highcharts.*  
Hentet fra:  
<a href="https://www.highcharts.com/">https://www.highcharts.com/</a>

**Luxon. (u.å.)** *Luxon.*  
Hentet fra:  
<a href="https://moment.github.io/luxon/">https://moment.github.io/luxon/</a>