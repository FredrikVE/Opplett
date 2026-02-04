//src/ui/view/components/LoadingSpinner.jsx
export default function LoadingSpinner({ text = "Laster…" }) {
	return (
		<div className="loading-container">
			<div className="spinner" />
			<p>{text}</p>
		</div>
	);
}
