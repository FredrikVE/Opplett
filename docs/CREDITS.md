# Kreditering, datakilder og biblioteker – VærVarselet

Dette dokumentet samler oversikt over eksterne datakilder, biblioteker, karttjenester, visualiseringsteknologi og ikonressurser som brukes i VærVarselet.

Målet er å gjøre det tydelig hvilke tredjepartstjenester prosjektet bygger på, hva de brukes til, og hvordan de krediteres i applikasjonen og dokumentasjonen.

---

## Innholdsfortegnelse

<table>
    <tr>
        <td>1</td>
        <td><a href="#1-oversikt">Oversikt</a></td>
    </tr>
    <tr>
        <td>2</td>
        <td><a href="#2-datakilder-og-tjenester">Datakilder og tjenester</a></td>
    </tr>
    <tr>
        <td>3</td>
        <td><a href="#3-biblioteker-og-rammeverk">Biblioteker og rammeverk</a></td>
    </tr>
    <tr>
        <td>4</td>
        <td><a href="#4-ikoner-og-visuelle-ressurser">Ikoner og visuelle ressurser</a></td>
    </tr>
    <tr>
        <td>5</td>
        <td><a href="#5-kreditering-i-applikasjonen">Kreditering i applikasjonen</a></td>
    </tr>
    <tr>
        <td>6</td>
        <td><a href="#6-varslingområder-for-hav-og-kyst">Varslingsområder for hav og kyst</a></td>
    </tr>
    <tr>
        <td>7</td>
        <td><a href="#7-kildehenvisninger">Kildehenvisninger</a></td>
    </tr>
    <tr>
        <td>8</td>
        <td><a href="#8-oppsummering">Oppsummering</a></td>
    </tr>
</table>

---

# 1. Oversikt

VærVarselet er bygget som et personlig læringsprosjekt, men er samtidig avhengig av en rekke eksterne tjenester og biblioteker for å fungere.

Disse dekker blant annet:

- værdata
- kartvisning
- vær-layers på kart
- grafvisualisering
- tidssonehåndtering
- værikoner og fareikoner

Dette dokumentet samler disse ressursene på ett sted for å gjøre det lettere å se hvilke eksterne bidrag prosjektet bygger på.

---

# 2. Datakilder og tjenester

Under er en oversikt over sentrale dataleverandører og eksterne tjenester som brukes i prosjektet.

<table border="1">
    <tr>
        <th>Navn</th>
        <th>Type</th>
        <th>Bruk i prosjektet</th>
        <th>Lenke</th>
    </tr>
    <tr>
        <td>Meteorologisk institutt (MET)</td>
        <td>Dataleverandør</td>
        <td>Leverer værdata og varseldata som brukes i applikasjonen.</td>
        <td><a href="https://www.met.no/">met.no</a></td>
    </tr>
    <tr>
        <td>Yr.no</td>
        <td>Inspirasjon / datanær kontekst</td>
        <td>Applikasjonen er inspirert av Yr.no sin presentasjon av værdata og værrelatert informasjon.</td>
        <td><a href="https://www.yr.no/">yr.no</a></td>
    </tr>
    <tr>
        <td>MapTiler</td>
        <td>Kartplattform</td>
        <td>Brukes til kartvisning, stedsdata og kartrelaterte tjenester.</td>
        <td><a href="https://www.maptiler.com/">maptiler.com</a></td>
    </tr>
    <tr>
        <td>MapTiler Weather</td>
        <td>Værvisualisering på kart</td>
        <td>Brukes til animerte vær-layers og geografiske værvisualiseringer i kartet.</td>
        <td><a href="https://www.maptiler.com/weather/">maptiler.com/weather</a></td>
    </tr>
</table>

---

# 3. Biblioteker og rammeverk

Prosjektet bruker flere tredjepartsbiblioteker for sentral funksjonalitet.

<table border="1">
    <tr>
        <th>Navn</th>
        <th>Type</th>
        <th>Bruk i prosjektet</th>
        <th>Lenke</th>
    </tr>
    <tr>
        <td>@maptiler/sdk</td>
        <td>JavaScript-bibliotek</td>
        <td>SDK for kartfunksjonalitet fra MapTiler i React-applikasjonen.</td>
        <td><a href="https://www.maptiler.com/">MapTiler SDK</a></td>
    </tr>
    <tr>
        <td>@maptiler/weather</td>
        <td>JavaScript-bibliotek</td>
        <td>Brukes for vær-layers og animasjoner på kartet.</td>
        <td><a href="https://www.maptiler.com/weather/">MapTiler Weather</a></td>
    </tr>
    <tr>
        <td>@maptiler/marker-layout</td>
        <td>JavaScript-bibliotek</td>
        <td>Brukes til håndtering av kartmarkører og marker-relatert layout.</td>
        <td><a href="https://www.maptiler.com/">MapTiler Marker Layout</a></td>
    </tr>
    <tr>
        <td>Highcharts</td>
        <td>Visualiseringsbibliotek</td>
        <td>Brukes til å vise interaktive grafer for værdata.</td>
        <td><a href="https://www.highcharts.com/">highcharts.com</a></td>
    </tr>
    <tr>
        <td>highcharts-react-official</td>
        <td>React-wrapper</td>
        <td>Brukes som React-integrasjon for Highcharts.</td>
        <td><a href="https://www.highcharts.com/">Highcharts React</a></td>
    </tr>
    <tr>
        <td>Luxon</td>
        <td>Tidsbibliotek</td>
        <td>Brukes til robust håndtering av dato, tid, UTC og tidssoner.</td>
        <td><a href="https://moment.github.io/luxon/">Luxon</a></td>
    </tr>
    <tr>
        <td>tz-lookup</td>
        <td>Hjelpebibliotek</td>
        <td>Brukes som fallback for å finne tidssone basert på koordinater.</td>
        <td><a href="https://www.npmjs.com/package/tz-lookup">tz-lookup</a></td>
    </tr>
</table>

---

# 4. Ikoner og visuelle ressurser

Applikasjonen bruker eksterne ikonressurser for vær og farevarsler.

<table border="1">
    <tr>
        <th>Ressurs</th>
        <th>Type</th>
        <th>Bruk i prosjektet</th>
        <th>Lenke</th>
    </tr>
    <tr>
        <td>Yr Weather Symbols</td>
        <td>Ikonsett</td>
        <td>Brukes til værikoner i applikasjonen.</td>
        <td><a href="https://nrkno.github.io/yr-weather-symbols/">Yr Weather Symbols</a></td>
    </tr>
    <tr>
        <td>Yr Warning Icons</td>
        <td>Ikonsett</td>
        <td>Brukes til fareikoner og varslingsikoner i applikasjonen.</td>
        <td><a href="https://nrkno.github.io/yr-warning-icons/">Yr Warning Icons</a></td>
    </tr>
</table>

---

# 5. Kreditering i applikasjonen

Applikasjonens footer oppsummerer prosjektets eksterne grunnlag og kreditering.

Footer-innholdet uttrykker blant annet at:

- dette er et personlig prosjekt for å lære MVVM-arkitektur i React
- all data er hentet fra Meteorologisk institutt (MET)
- løsningen er inspirert av Yr.no
- værikoner er hentet fra **Yr Weather Symbols**
- fareikoner er hentet fra **Yr Warning Icons**
- kart og kartrelatert visualisering leveres med støtte fra **MapTiler**
- grafvisning er bygget med **Highcharts**

Dette gjør at krediteringen ikke bare finnes i dokumentasjonen, men også er synlig direkte i applikasjonen.

---

# 6. Varslingsområder for hav og kyst

Prosjektet forholder seg også til informasjon om geografiske varslingsområder for hav og kyst.

Dette er relevant fordi appen arbeider med geografiske områder, farevarsler og polygonbasert presentasjon i kartet.

Mer informasjon finnes her:

- <a href="https://www.met.no/vaer-og-klima/ekstremvaervarsler-og-andre-farevarsler/varslingsomrader-kyst-og-hav">Varslingsområder for kyst og hav</a>

---

# 7. Kildehenvisninger

## 7.1 Værikoner

**NRK. (u.å.)** *Yr weather symbols.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-weather-symbols/">https://nrkno.github.io/yr-weather-symbols/</a>

## 7.2 Fareikoner

**NRK. (u.å.)** *Yr Warning Icons.*  
Hentet fra:  
<a href="https://nrkno.github.io/yr-warning-icons/">https://nrkno.github.io/yr-warning-icons/</a>

## 7.3 Kart og værvisualisering

**MapTiler.**  
Kartplattform og kartrelatert infrastruktur:  
<a href="https://www.maptiler.com/">https://www.maptiler.com/</a>

**MapTiler Weather.**  
Vær-layers og kartbasert værvisualisering:  
<a href="https://www.maptiler.com/weather/">https://www.maptiler.com/weather/</a>

## 7.4 Datakilder

**Meteorologisk institutt (MET).**  
Åpne værdata og relaterte tjenester:  
<a href="https://www.met.no/">https://www.met.no/</a>

**Yr.no.**  
Inspirasjon og værrelatert presentasjonskontekst:  
<a href="https://www.yr.no/">https://www.yr.no/</a>

## 7.5 Visualisering og tid

**Highcharts.**  
Grafbibliotek brukt for værvisualisering:  
<a href="https://www.highcharts.com/">https://www.highcharts.com/</a>

**Luxon.**  
Tidssone- og dato/tid-bibliotek:  
<a href="https://moment.github.io/luxon/">https://moment.github.io/luxon/</a>

**tz-lookup.**  
Koordinatbasert oppslag av tidssoner:  
<a href="https://www.npmjs.com/package/tz-lookup">https://www.npmjs.com/package/tz-lookup</a>

---

# 8. Oppsummering

VærVarselet bygger på en kombinasjon av:

- åpne værdata fra **Meteorologisk institutt**
- inspirasjon og ikonressurser knyttet til **Yr**
- kart og vær-layers fra **MapTiler**
- grafvisualisering via **Highcharts**
- tidssonehåndtering med **Luxon** og **tz-lookup**

Disse ressursene gjør det mulig å bygge en app som kombinerer forecast, kart, varsler, grafer og lokasjonsbasert presentasjon av værdata i ett samlet prosjekt.
