# Oppsett og installasjon – VærVarselet

Dette dokumentet beskriver hvordan VærVarselet settes opp og kjøres lokalt i utviklingsmiljø.

Målet med denne guiden er å gjøre det enkelt å:

- laste ned prosjektet
- installere nødvendige avhengigheter
- konfigurere miljøvariabler
- starte utviklingsserveren
- forstå hvilke pakker som brukes for sentral funksjonalitet

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-forutsetninger">Forutsetninger</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-laste-ned-prosjektet">Laste ned prosjektet</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-installere-avhengigheter">Installere avhengigheter</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-starte-prosjektet-lokalt">Starte prosjektet lokalt</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-miljøvariabler-og-konfigurasjon">Miljøvariabler og konfigurasjon</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-sentrale-pakker-i-prosjektet">Sentrale pakker i prosjektet</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-feilsøking">Feilsøking</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Forutsetninger

For å kjøre prosjektet lokalt trenger du et vanlig JavaScript/React-utviklingsmiljø.

Det innebærer i praksis:

- **Node.js**
- **npm**
- en kodeeditor, for eksempel **VS Code**
- en moderne nettleser

Siden prosjektet kjøres med Vite, er det også en fordel å bruke en relativt oppdatert versjon av Node.js.

---

# 2. Laste ned prosjektet

Hvis prosjektet ligger i et Git-repository, kan det lastes ned med:

```bash
git clone <repo-url>
````

Gå deretter inn i prosjektmappen:

```bash id="vk7g39"
cd <prosjektnavn>
```

Hvis du allerede har prosjektet lokalt, kan du hoppe videre til installasjon av avhengigheter.

---

# 3. Installere avhengigheter

Vanligvis holder det å installere alle dependencies fra `package.json`:

```bash id="hzyjja"
npm install
```

Denne kommandoen laster ned alle pakkene prosjektet trenger for å kjøre.

---

# 4. Starte prosjektet lokalt

Når avhengighetene er installert, kan utviklingsserveren startes med:

```bash id="4uxo9e"
npm run dev
```

Dette starter prosjektet lokalt via Vite.

Når serveren er startet, vil terminalen vanligvis vise en lokal URL, ofte noe slikt som:

```text id="g87to3"
http://localhost:5173/
```

Åpne denne i nettleseren for å bruke appen.

---

# 5. Miljøvariabler og konfigurasjon

Prosjektet bruker eksterne tjenester for blant annet kart og lokasjonsdata. Slike nøkler og miljøspesifikk konfigurasjon bør legges i en `.env`-fil og ikke hardkodes direkte i kildekoden.

## 5.1 Eksempel på `.env`

Et typisk oppsett kan for eksempel se slik ut:

```env id="b6h5it"
VITE_MAPTILER_API_KEY=din_maptiler_nøkkel
```

Dersom prosjektet bruker flere eksterne tjenester med egne nøkler eller base-URL-er, bør også disse defineres her.

## 5.2 Hvorfor miljøvariabler brukes

Dette er nyttig fordi:

* API-nøkler holdes utenfor selve kodebasen
* det blir enklere å bytte mellom utvikling og produksjon
* man reduserer risikoen for å publisere sensitiv konfigurasjon ved en feil

## 5.3 Viktig om Vite

I Vite må miljøvariabler som skal være tilgjengelige i frontend vanligvis starte med `VITE_`.

Eksempel:

```env id="lnw6yz"
VITE_MAPTILER_API_KEY=din_maptiler_nøkkel
```

> NB: Variabelnavnene må samsvare med det prosjektet faktisk forventer i koden.

---

# 6. Sentrale pakker i prosjektet

Prosjektet bruker flere eksterne pakker for kart, visualisering og håndtering av tidssoner.

## 6.1 Kart og kartvær

Disse pakkene brukes til kartfunksjonalitet og vær-layers:

```bash id="lm3sqh"
npm install @maptiler/sdk
npm install @maptiler/weather
npm install @maptiler/marker-layout
```

### Hva de brukes til

* `@maptiler/sdk` – kartvisning og kartrelaterte tjenester
* `@maptiler/weather` – vær-layers og væranimasjoner i kartet
* `@maptiler/marker-layout` – håndtering av markører og marker-relatert layout

---

## 6.2 Grafvisning

Disse pakkene brukes for grafvisualisering av værdata:

```bash id="ua788b"
npm install highcharts highcharts-react-official
```

### Hva de brukes til

* temperaturgrafer
* vindgrafer
* UV-indeks
* andre tidsseriebaserte værvisualiseringer

---

## 6.3 Tidssoner og lokasjon

Disse pakkene brukes til dato-, klokkeslett- og tidssonehåndtering:

```bash id="i7m5p0"
npm install luxon tz-lookup
```

### Hva de brukes til

* robust håndtering av UTC og lokal tid
* konvertering mellom tidssoner
* fallback for å finne tidssone basert på koordinater

---

## 6.4 Vanlig praksis i prosjektet

Dersom du kjører `npm install` i et allerede ferdig oppsatt prosjekt, trenger du normalt ikke installere pakkene manuelt én og én. Listen over er mest ment som dokumentasjon av hvilke biblioteker som er sentrale i løsningen.

---

# 7. Feilsøking

Under er noen vanlige ting å sjekke dersom prosjektet ikke starter som forventet.

## 7.1 `npm install` feiler

Sjekk at:

* Node.js er installert
* npm er tilgjengelig i terminalen
* du står i riktig prosjektmappe

Du kan kontrollere dette med:

```bash id="fsy6wf"
node -v
npm -v
```

---

## 7.2 Kart eller kartlag vises ikke

Dersom kartet ikke lastes korrekt, er en vanlig årsak at API-nøkkel for karttjenesten mangler eller er feil konfigurert.

Sjekk at:

* `.env`-filen finnes
* riktig variabelnavn brukes
* appen faktisk leser miljøvariabelen
* utviklingsserveren er restartet etter endring i `.env`

---

## 7.3 Endringer i `.env` ser ikke ut til å virke

Ved endringer i miljøvariabler må utviklingsserveren vanligvis startes på nytt.

Stopp serveren og start den igjen:

```bash id="ryhc1f"
npm run dev
```

---

## 7.4 Feil relatert til imports eller manglende pakker

Dersom du får feil om at moduler ikke finnes, prøv:

```bash id="ozhvnf"
npm install
```

Hvis problemet vedvarer, kan det hjelpe å slette `node_modules` og installere på nytt.

---

# 8. Oppsummering

For å komme i gang med VærVarselet lokalt holder det normalt å gjøre følgende:

1. klone prosjektet
2. gå inn i prosjektmappen
3. installere avhengigheter med `npm install`
4. legge inn nødvendige miljøvariabler
5. starte prosjektet med `npm run dev`

Prosjektet er satt opp som en vanlig React/Vite-applikasjon, med tilleggspakker for:

* kart
* værvisualisering
* grafvisning
* tidssoner
* lokasjonslogikk

Dette gjør det enkelt å komme i gang, samtidig som prosjektet støtter mer avansert funksjonalitet som kart, tidssonebevisst værvisning og grafbasert presentasjon av værdata.