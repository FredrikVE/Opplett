//src/model/datasource/DataSource.js
export default class DataSource {
  constructor() {
    this.apiCallCount = 0;      //teller for å logge antall API-kall (Per side-refresh)
    this.hostURL = "https://api.met.no/";
  }

  async get(path) {
    this.apiCallCount += 1;

    const who = this.constructor.name; // <- hvilken datasource som arver fra DataSource
    const url = this.hostURL + path;
    const startedAt = performance.now();

    console.log(`[MET][${who}] API-kall #${this.apiCallCount} -> ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Test app for learning MVVM in react",
        Accept: "application/json",
      },
    });

    const ms = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      console.warn(`[MET][${who}] API-kall #${this.apiCallCount} FEIL (${response.status}) etter ${ms}ms -> ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }

    console.log(`[MET][${who}] API-kall #${this.apiCallCount} OK (${response.status}) etter ${ms}ms`);

    return response.json();
  }
}
