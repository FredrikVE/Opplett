// src/ui/view/components/Layout/Footer.jsx
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>Om tjenesten</h4>
                    <p>
                        Denne siden er et personlig prosjekt for å lære meg
                        MVVM-arkitektur i React. All data er hentet fra
                        Meteorologisk institutt (MET), og er inspirert av Yr.no.
                    </p>
                    <p className="footer-meta">
                        Værikoner er hentet fra{" "}
                        <a href="https://nrkno.github.io/yr-weather-symbols/" target="_blank" rel="noreferrer">
                            Yr Weather Symbols
                        </a>
                        , og fareikoner fra{" "}
                        <a href="https://nrkno.github.io/yr-warning-icons/" target="_blank" rel="noreferrer">
                            Yr Warning Icons
                        </a>.
                    </p>
                </div>

                <div className="footer-section">
                    <div className="footer-subsection">
                        <h4>Datatjenester levert av</h4>
                        <div className="attribution-container">
                            <a href="https://www.met.no/" target="_blank" rel="noreferrer" title="Meteorologisk institutt">
                                <img
                                    src="/credit_icons/met/Met_RGB_Horisontal.jpg"
                                    alt="Meteorologisk institutt"
                                    className="credit-logo"
                                    width="88"
                                    height="40"
                                    loading="lazy"
                                />
                            </a>

                            <a href="https://www.yr.no/" target="_blank" rel="noreferrer" title="Yr.no">
                                <img
                                    src="/credit_icons/yr/YR_blaa_rgb.png"
                                    alt="Yr"
                                    className="credit-logo"
                                    width="40"
                                    height="40"
                                    loading="lazy"
                                />
                            </a>

                            <a href="https://www.maptiler.com/" target="_blank" rel="noreferrer" title="MapTiler">
                                <img
                                    src="/credit_icons/maptiler/maptiler_logo.png"
                                    alt="MapTiler"
                                    className="credit-logo"
                                    width="120"
                                    height="24"
                                    loading="lazy"
                                />
                            </a>
                        </div>
                    </div>

                    <div className="footer-subsection" style={{ marginTop: '24px' }}>
                        <h4>Visualiseringsteknologi</h4>
                        <div className="attribution-container">
                            <a href="https://www.highcharts.com/" target="_blank" rel="noreferrer" title="Highcharts">
                                <img
                                    src="/credit_icons/highcharts/highcharts-logo.png"
                                    alt="Highcharts"
                                    className="credit-logo"
                                    width="133"
                                    height="28"
                                    loading="lazy"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>
                    &copy; {currentYear} VærVarselet. Utviklet med data fra åpne kilder.
                </p>
            </div>
        </footer>
    );
}