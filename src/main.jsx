import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/*
//strict mode gir dobbelt så mange API-kall fordi
//StrictMode i dev kjører useEffect to ganger for å avsløre sideeffekter.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
*/

//Fjerner strictmode midlertidig for å sjekke at antall API-kall ikke er for mange
createRoot(document.getElementById('root')).render(
  <App />
);
