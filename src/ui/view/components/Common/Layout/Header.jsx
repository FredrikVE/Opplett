// src/ui/view/components/Layout/Header.jsx
import { useState } from "react";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="main-header">
            <div className="header-content">
                
                {/* Hamburger-knapp */}
                <button 
                    className="hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Åpne meny"
                >
                    ☰
                </button>
            </div>

            {/* Dropdown-meny */}
            {menuOpen && (
                <div className="mobile-menu">
                    <button onClick={() => setMenuOpen(false)}>Innstillinger</button>
                    <button onClick={() => setMenuOpen(false)}>Favoritter</button>
                    <button onClick={() => setMenuOpen(false)}>Om appen</button>
                </div>
            )}
        </header>
    );
}
