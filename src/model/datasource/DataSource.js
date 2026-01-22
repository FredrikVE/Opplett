//src/model/datasource/DataSource.js
export default class DataSource {
    constructor() {
        this.hostURL = 'https://api.met.no/';
    }

    async get(path) {
        const response = await fetch(this.hostURL + path, {
            headers: {
                "User-Agent": "Test app for learning MVVM in react",
                "Accept": "application/json",
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
    }
}
