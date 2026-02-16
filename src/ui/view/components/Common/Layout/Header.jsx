// src/ui/view/components/Layout/Header.jsx
import { useEffect, useRef, useState } from "react";

export default function Header() {
	const [open, setOpen] = useState(false);
	const buttonRef = useRef(null);
	const wasOpenRef = useRef(false);

	const close = () => setOpen(false);

	useEffect(() => {
		if (wasOpenRef.current && !open) {
			buttonRef.current?.focus();
		}
		wasOpenRef.current = open;
	}, [open]);

	return (
		<header className="main-header">
			<div className="header-content">
				<button
					ref={buttonRef}
					className="hamburger"
					type="button"
					onClick={() => setOpen(true)}
					aria-label="Åpne meny"
					aria-expanded={open}
					aria-controls="app-drawer"
				>
					<svg
						className="hamburger-icon"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						focusable="false"
					>
						<path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
				</button>
			</div>

			{open && (
				<div
					className="drawer-layer"
					role="presentation"
					onKeyDown={(e) => {
						if (e.key === "Escape") close();
					}}
				>
					<button
						className="drawer-backdrop"
						type="button"
						onClick={close}
						aria-label="Lukk meny"
						tabIndex={-1}
						aria-hidden="true"
					/>

					<aside
						id="app-drawer"
						className="drawer"
						role="dialog"
						aria-modal="true"
						aria-label="Meny"
					>
						<div className="drawer-header">
							<div className="drawer-title">Meny</div>
							<button
								className="drawer-close"
								type="button"
								onClick={close}
								aria-label="Lukk"
								autoFocus
							>
								✕
							</button>
						</div>

						<nav className="drawer-content">
							<button type="button" onClick={close}>Innstillinger</button>
							<button type="button" onClick={close}>Favoritter</button>
							<button type="button" onClick={close}>Om appen</button>
						</nav>
					</aside>
				</div>
			)}
		</header>
	);
}
