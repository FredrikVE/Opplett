//src/ui/view/components/Layout/Header.jsx
export default function Header({ locationName }) {
    return (
        <header className="main-header">
            <div className="header-content">
                <div className="logo">
                    <span className="logo-icon">☀️</span>
                    <span className="logo-text">VærVarselet</span>
                </div>
                <nav className="header-nav">
                    <h1>{locationName || "Søker posisjon..."}</h1>
                </nav>
            </div>
        </header>
    );
}