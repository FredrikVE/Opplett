# Pages og hovedfunksjonalitet – VærVarselet

Dette dokumentet gir en oversikt over de sentrale sidene i VærVarselet og hva de har ansvar for.

Målet er å gjøre det tydelig hvordan appens pages er delt opp, og hvordan hver side representerer et eget ansvarsområde i UI-laget. I prosjektet er pages og ViewModels tett koblet sammen gjennom en MVVM-inspirert struktur, der hver side har sin egen presentasjonslogikk og sitt eget fokus.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-oversikt">Oversikt</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-forecastpage">ForecastPage</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-graphpage">GraphPage</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-alertpage">AlertPage</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-mappage">MapPage</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-felles-lokasjonsgrunnlag">Felles lokasjonsgrunnlag</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-samspill-mellom-pages-og-viewmodels">Samspill mellom pages og ViewModels</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Oversikt

VærVarselet er organisert i flere pages, der hver page representerer et tydelig ansvarsområde i brukergrensesnittet.

Dette gir noen viktige fordeler:

- hver side får et tydelig fokus
- presentasjonslogikken kan kapsles i en egen ViewModel
- UI-komponentene blir lettere å lese
- appen blir enklere å videreutvikle

Page-strukturen i appen er ment å støtte en naturlig oppdeling mellom ulike typer værrelatert funksjonalitet:

- værvarsel
- grafvisning
- farevarsler
- kart og lokasjon

Selv om sidene har ulike ansvar, bygger de ofte på samme underliggende lokasjonsgrunnlag.

---

# 2. ForecastPage

`ForecastPage` fokuserer på selve værvarslingen for valgt lokasjon.

Dette er siden som i størst grad presenterer det brukeren typisk forbinder med et tradisjonelt værvarsel: temperatur, symboler, nedbør og andre værdata knyttet til et sted og et tidspunkt.

## 2.1 Typiske ansvarsområder

`ForecastPage` har typisk ansvar for:

- visning av værvarsel for valgt lokasjon
- presentasjon av times- og dagsbaserte data
- kobling mellom aktiv lokasjon og forecast-data
- visuell presentasjon av værikoner og tilhørende metadata

## 2.2 Rolle i appen

Denne siden fungerer som en sentral del av appens kjernefunksjonalitet. Den representerer den mest direkte måten å se værdata på, uten at brukeren må tolke grafer eller kart.

## 2.3 Samspill med ViewModel

`ForecastPageViewModel` har ansvar for:

- innhenting eller orkestrering av forecast-relaterte data via use cases
- håndtering av UI-state
- eventuell transformasjon av forecast-data til presentasjonsvennlige strukturer

Selve `ForecastPage` skal i størst mulig grad fokusere på rendering av denne tilstanden.

---

# 3. GraphPage

`GraphPage` viser værdata som grafer og gjør det lettere å se utvikling over tid.

Denne siden er nyttig når brukeren ønsker en mer analytisk eller detaljert presentasjon av værdata enn det et vanlig tekst- eller kortbasert værvarsel gir.

## 3.1 Typiske ansvarsområder

`GraphPage` har typisk ansvar for:

- temperaturgrafer
- vindgrafer
- UV-indeks
- andre tidsseriebaserte visualiseringer

## 3.2 Rolle i appen

Mens `ForecastPage` er god for rask oversikt, er `GraphPage` bedre egnet når man vil se:

- utvikling over tid
- sammenhenger mellom verdier
- endringer i været på en mer detaljert måte

## 3.3 Samspill med ViewModel

`GraphPageViewModel` har typisk ansvar for:

- henting eller forberedelse av grafdata
- strukturering av serier og akser
- samspill mellom valgt lokasjon, tidssone og grafvisning
- transformasjon av rådata til konfigurasjon som kan brukes av Highcharts

`GraphPage` rendrer deretter grafene basert på denne tilstanden.

---

# 4. AlertPage

`AlertPage` fokuserer på farevarsler og varslingsinformasjon knyttet til områder eller lokasjoner.

Denne siden presenterer informasjon som ofte skiller seg fra vanlig værvarsel ved at den handler om risiko, alvorlighetsgrad og geografisk utstrekning.

## 4.1 Typiske ansvarsområder

`AlertPage` har typisk ansvar for:

- innhenting og presentasjon av farevarsler
- visning av relevante varsler for valgt lokasjon eller område
- bruk av fareikoner og metadata
- kobling mellom varselinnhold og geografisk område

## 4.2 Rolle i appen

`AlertPage` gjør appen mer komplett ved å gi tilgang til kritisk eller viktig varslingsinformasjon, ikke bare vanlig forecast.

Denne siden er spesielt nyttig fordi den kobler sammen:

- sted
- geografisk område
- varseldata
- visuelle faresymboler

## 4.3 Samspill med ViewModel

`AlertPageViewModel` har typisk ansvar for:

- orkestrering av use cases for varsler
- filtrering eller tilpassing av varseldata til valgt kontekst
- håndtering av loading og eventuelle feiltilstander
- forberedelse av data til visning i UI

---

# 5. MapPage

`MapPage` samler all kartrelatert funksjonalitet i én side.

Kartsiden er ofte den mest komplekse delen av en værapp, fordi den kombinerer mange typer interaksjon og datavisning samtidig.

## 5.1 Typiske ansvarsområder

`MapPage` har typisk ansvar for:

- kartvisning
- kartlag
- markører
- vær-layers
- highlight av områder
- navigasjon til aktiv lokasjon
- håndtering av synlige kartpunkter

## 5.2 Rolle i appen

Denne siden gjør det mulig å se værdata i geografisk kontekst. I stedet for å bare lese data som tekst eller grafer, kan brukeren se:

- hvor noe skjer
- hvilke områder varsler gjelder for
- hvordan lokasjon, geometri og værpunkter henger sammen

## 5.3 Samspill med ViewModel

`MapPageViewModel` har typisk ansvar for:

- styring av kartets UI-state
- valgt kartlag
- zoomnivå
- viewport-bounds
- synlige værpunkter
- highlight-geometri
- reset til device location
- håndtering av map target og kartkamera

Dette gjør at selve `MapPage` kan fokusere på å rendre kartet og sende brukerhandlinger tilbake til ViewModelen.

## 5.4 Eget dokument for MapPage

Siden `MapPage` ofte har mer kompleks logikk enn de andre sidene, er det naturlig å dokumentere den mer detaljert i et eget dokument:

- [MAP_PAGE.md](./MAP_PAGE.md)

---

# 6. Felles lokasjonsgrunnlag

Selv om sidene har forskjellige ansvarsområder, er de koblet sammen gjennom et felles lokasjonsgrunnlag.

Dette innebærer at flere pages ofte bruker samme:

- aktive lokasjon
- koordinater
- tidssone
- eventuelle metadata om sted eller område

Ved å bruke et felles lokasjonsobjekt reduseres risikoen for at forskjellige sider viser ulike “sannheter” samtidig.

## 6.1 Hvorfor dette er viktig

Dette gjør det mulig at:

- `ForecastPage` viser vær for samme sted som `MapPage`
- `GraphPage` bruker riktig tidssone for samme lokasjon
- `AlertPage` knytter varsler til samme geografiske kontekst

Dette er en viktig del av prosjektets dataflyt og gjør appen mer konsistent.

---

# 7. Samspill mellom pages og ViewModels

Hver page i appen er nært koblet til sin egen ViewModel.

Den grunnleggende tanken er:

- **Page** = rendering og komposisjon av UI
- **ViewModel** = tilstand, presentasjonslogikk og handlers

Dette gir en struktur der page-komponentene kan være relativt tynne, mens ViewModel-laget samler logikken.

En forenklet modell kan beskrives slik:

```text id="ffzd7a"
Page
↓
ViewModel
↓
UseCases / Model
↓
Data
````

## 7.1 Fordeler med denne strukturen

Dette gjør det enklere å:

* lese page-komponentene
* forstå hva som er UI og hva som er logikk
* gjenbruke mønstre på tvers av sider
* teste logikk mer isolert

## 7.2 Begrensninger

Noen pages, særlig `MapPage`, vil naturlig ha mer kompleksitet enn andre. Det betyr at ViewModelen for slike sider også kan bli større og mer sammensatt enn ViewModels for enklere pages.

Det er ikke nødvendigvis et tegn på dårlig struktur, men heller et resultat av at siden faktisk har mer ansvar.

---

# 8. Oppsummering

Page-strukturen i VærVarselet er bygget for å dele opp appens funksjonalitet i tydelige ansvarsområder.

De sentrale sidene er:

* `ForecastPage`
* `GraphPage`
* `AlertPage`
* `MapPage`

Hver side har:

* sitt eget fokus
* sin egen presentasjonslogikk
* sin egen ViewModel

Samtidig er sidene koblet sammen gjennom delt lokasjonsstate og en felles MVVM-inspirert struktur.

Dette gjør appen lettere å forstå, vedlikeholde og videreutvikle enn om all logikk skulle vært samlet direkte i komponentene.