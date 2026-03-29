# Tidssoner og lokasjon – VærVarselet

Dette dokumentet beskriver hvordan VærVarselet håndterer tidssoner, UTC, lokal tid og lokasjonsdata.

Tid og lokasjon er tett koblet sammen i appen. Siden værdata kommer fra eksterne kilder og ofte leveres i UTC, må prosjektet ha en tydelig strategi for hvordan tid representeres internt og hvordan den konverteres til lokal tid for brukeren. Målet har vært å gjøre dette på en robust og forutsigbar måte, uten å bygge logikken på manuelle offset-regler.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-hvorfor-tidssoner-er-viktig-i-prosjektet">Hvorfor tidssoner er viktig i prosjektet</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-utc-som-primærkilde">UTC som primærkilde</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-lokal-tid-som-utledet-verdi">Lokal tid som utledet verdi</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-lokasjon-som-grunnlag-for-tidssone">Lokasjon som grunnlag for tidssone</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-single-source-of-truth-for-lokasjon">Single source of truth for lokasjon</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-hvordan-tidssone-fastsettes">Hvordan tidssone fastsettes</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-hvorfor-luxon-og-tz-lookup-brukes">Hvorfor Luxon og tz-lookup brukes</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-hva-dette-løser-i-praksis">Hva dette løser i praksis</a></td>
    </tr>
    <tr>
        <td>9</td>
        <td><a href="#9-designprinsipper">Designprinsipper</a></td>
    </tr>
    <tr>
        <td>10</td>
        <td><a href="#10-begrensninger-og-pragmatiske-valg">Begrensninger og pragmatiske valg</a></td>
    </tr>
    <tr>
        <td>11</td>
        <td><a href="#11-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Hvorfor tidssoner er viktig i prosjektet

I en værapp er det ikke nok å vite *hvilke* data som gjelder. Det er også avgjørende å vite *når* de gjelder, og hvilket lokalt klokkeslett de skal tolkes som.

Dette blir spesielt viktig fordi appen:

- viser vær for ulike steder
- lar brukeren bytte mellom lokasjoner
- kombinerer forecast, kart og grafer
- kan vise steder i andre tidssoner enn brukerens egen
- må håndtere dato- og klokkeslettvisning konsistent

Dersom tidssonelogikken ikke er tydelig, kan appen fort vise:

- feil dag
- feil klokkeslett
- feil gruppering i forecast
- misvisende grafer
- ulik tolkning mellom ulike sider

---

# 2. UTC som primærkilde

En sentral beslutning i prosjektet er at værdata fra eksterne tjenester behandles med **UTC som primærkilde**.

Når data kommer inn med tidsstempler som dette:

```js id="p8z6rj"
{
  time: "2026-03-02T17:00:00Z",
  data: { ... }
}
````

skal verdien med `Z` beholdes som den autoritative representasjonen av tidspunktet.

## 2.1 Hvorfor dette er viktig

Ved å beholde UTC som rå og uendret primærverdi unngår man at appen bygger videre på allerede “tolkede” klokkeslett. Det gjør systemet mer robust fordi:

* samme tidspunkt kan konverteres til ulike tidssoner uten tap av informasjon
* man unngår feil ved senere beregninger
* man kan utlede lokal tid når det faktisk trengs, i stedet for å bake den inn for tidlig

## 2.2 UTC som intern referanse

UTC fungerer derfor som et felles referansepunkt i datastrømmen. Lokal tid er noe som utledes fra UTC og en kjent tidssone, ikke noe som erstatter rådataene.

---

# 3. Lokal tid som utledet verdi

I prosjektet behandles lokal tid som en **utledet verdi**, ikke som rådata.

Det betyr at appen ikke skal tenke slik:

* “dette klokkeslettet er alltid 18:00 lokalt”

men heller slik:

* “dette er et UTC-tidspunkt som må tolkes i konteksten til en spesifikk tidssone”

## 3.1 Hva dette innebærer

Når forecast-data eller grafdata behandles, kan det bygges opp objekter som inneholder både UTC-kilden og lokal tidsinformasjon som derivater.

For eksempel:

```js id="ec3jq0"
{
  timeISO: "2026-03-03T12:00:00Z",
  dateISO: "2026-03-03",
  localTime: 13,
  utcHour: 12
}
```

Her er:

* `timeISO` den primære, uendrede UTC-kilden
* `dateISO` en lokal dato utledet fra tidssone
* `localTime` en lokal time utledet fra tidssone
* `utcHour` en eksplisitt UTC-basert verdi

## 3.2 Hvorfor dette er nyttig

Dette gjør det mulig å:

* gruppere forecast korrekt på lokal dato
* vise klokkeslett riktig for valgt sted
* holde grafer og kortvisninger konsistente
* unngå at lokal tid blir “frosset” eller feil når lokasjonen byttes

---

# 4. Lokasjon som grunnlag for tidssone

Tidssone gir ikke mening uten kontekst. Derfor er lokasjon grunnlaget for hvordan tid skal tolkes i appen.

Et aktivt lokasjonsobjekt kan typisk inneholde:

* navn
* koordinater
* type
* bounds
* countryCode
* timezone
* id

Tidssonen knyttes altså til lokasjonen, ikke til brukeren generelt og ikke til nettleseren alene.

## 4.1 Hvorfor dette er viktig

Brukeren kan være fysisk i én tidssone, men se værdata for et sted i en annen.

Eksempel:

* bruker sitter i Norge
* valgt lokasjon er et sted i en annen tidssone
* forecast og grafer må da vises i valgt lokasjons lokale tid, ikke i brukerens egen lokale tid

Dette er en viktig del av appens geografiske tankegang.

---

# 5. Single source of truth for lokasjon

Prosjektet forsøker å bruke aktiv lokasjon som en **single source of truth** for sted, koordinater og tidssone.

Dette betyr at når aktiv lokasjon er valgt eller oppdatert, skal flere deler av appen kunne bruke det samme grunnlaget:

* `ForecastPage`
* `GraphPage`
* `MapPage`
* `AlertPage`

## 5.1 Hva dette løser

Ved å samle denne informasjonen i ett aktivt lokasjonsobjekt unngår man at ulike deler av appen lager sine egne versjoner av:

* koordinater
* stedsnavn
* tidssone
* bounds
* lokasjonstype

Det gir mer konsistent oppførsel på tvers av hele UI-et.

---

# 6. Hvordan tidssone fastsettes

Tidssonen for en lokasjon kan komme fra flere kilder.

## 6.1 Eksplisitt tidssone fra datakilde

Dersom en ekstern tjeneste returnerer tidssonen direkte som en del av stedsinformasjonen, er dette ofte det beste utgangspunktet.

Eksempel:

```js id="c0u7kb"
timezone: item.timezone
```

## 6.2 Fallback basert på koordinater

Dersom tidssone ikke leveres eksplisitt, kan appen bruke koordinatbasert oppslag med `tz-lookup`.

Eksempel:

```js id="vlgjv9"
timezone: item.timezone ?? tzLookup(lat, lon)
```

Dette gjør at appen fortsatt kan finne en IANA-tidssone selv om den eksterne kilden ikke returnerer den ferdig.

## 6.3 Hvorfor rekkefølgen betyr noe

Det er bevisst at eksplisitt tidssone foretrekkes før fallback brukes:

* eksplisitt metadata er ofte mer presis i kontekst
* fallback er nyttig, men fortsatt en avledning basert på geografi
* appen bør bruke den mest konkrete kilden først

---

# 7. Hvorfor Luxon og tz-lookup brukes

Prosjektet bruker både **Luxon** og **tz-lookup**, men til ulike formål.

## 7.1 Luxon

Luxon brukes til:

* parsing av ISO-tidspunkter
* konvertering mellom UTC og lokal tid
* formatering av dato og klokkeslett
* håndtering av sommertid og andre tidssoneeffekter

Luxon er nyttig fordi den bygger på IANA-tidssoner og gir en mer robust modell enn manuelle offset-beregninger.

## 7.2 tz-lookup

`tz-lookup` brukes som et fallback-verktøy for å finne tidssone basert på koordinater.

Dette er nyttig når:

* en lokasjon har koordinater
* men ingen eksplisitt tidssone er tilgjengelig
* og appen likevel trenger en IANA-sone for videre formatering

## 7.3 Hvorfor begge trengs

De to bibliotekene løser forskjellige problemer:

* `tz-lookup` svarer på: **hvilken tidssone tilhører dette stedet?**
* `Luxon` svarer på: **hvordan skal dette tidspunktet tolkes og vises i den tidssonen?**

---

# 8. Hva dette løser i praksis

Denne modellen gjør appen mer robust i flere realistiske situasjoner.

## 8.1 Sommertid (DST)

Når lokal tid utledes fra UTC og IANA-tidssone, håndteres sommertid automatisk. Appen slipper dermed å hardkode egne regler for når klokken skal stilles.

## 8.2 Steder med uvanlige offset

Noen tidssoner bruker ikke hele timer som offset. Ved å bruke IANA-baserte verktøy kan appen håndtere slike steder riktig uten spesialtilfeller i UI-laget.

## 8.3 Riktig gruppering på lokal dato

Når forecast-data grupperes på lokal dato i stedet for bare UTC-dato, blir værvarslingen presentert mer intuitivt for brukeren.

## 8.4 Konsistens på tvers av sider

Når forecast, kart og grafer bygger på samme lokasjon og samme tidssone, blir oppførselen mer forutsigbar og mindre forvirrende.

---

# 9. Designprinsipper

Prosjektet forsøker å følge noen tydelige prinsipper for tid og lokasjon.

## 9.1 Ikke muter rådata

Rå UTC-data fra eksterne kilder skal ikke muteres unødvendig. Lokal tid bør heller utledes når det trengs.

## 9.2 Tidssone skal være eksplisitt

Tidssone bør være en eksplisitt del av lokasjonskonteksten, ikke en skjult antakelse.

## 9.3 Unngå manuell offset-logikk

Prosjektet forsøker å unngå løsninger som:

* `+1`
* `-5`
* “hvis sommer, så legg til én time”

Slike regler blir fort skjøre og vanskelige å vedlikeholde.

## 9.4 Samme lokasjon skal gi samme tidstolkning

Når en lokasjon er valgt, bør hele appen tolke tid i samme kontekst.

---

# 10. Begrensninger og pragmatiske valg

Selv om denne modellen er robust, finnes det fortsatt noen praktiske begrensninger.

## 10.1 Kvaliteten på metadata fra eksterne kilder

Dersom en ekstern tjeneste returnerer mangelfull eller feil metadata, må appen ofte falle tilbake på koordinatbasert logikk.

## 10.2 Tidssone er avhengig av lokasjonens kvalitet

Hvis lokasjonsdataene er ufullstendige eller unøyaktige, kan også tidssonetolkningen bli dårligere.

## 10.3 Pragmatisk fremfor perfekt

Prosjektet er et læringsprosjekt, og løsningen er derfor bevisst pragmatisk. Målet er ikke å bygge verdens mest avanserte tidsmotor, men å ha en modell som er robust nok til å håndtere vanlige og viktige tilfeller riktig.

---

# 11. Oppsummering

VærVarselet håndterer tidssoner ved å bruke:

* **UTC som primærkilde**
* **lokal tid som utledet verdi**
* **aktiv lokasjon som kilde til tidssonekontekst**
* **IANA-tidssoner via Luxon**
* **fallback-oppslag via tz-lookup**

Dette gjør at appen kan:

* vise værdata i riktig lokal tid for valgt sted
* gruppere forecast riktig på lokal dato
* holde forecast, kart og grafer konsistente
* unngå skjør logikk basert på manuelle offsets

Resultatet er en mer robust og geografisk korrekt modell for håndtering av tid i applikasjonen.