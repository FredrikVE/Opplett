//src/ui/view/components/AlertPage/CheckBoxItem.jsx
export default function CheckBoxItem({ label, isChecked, onClick, hasAlerts }) {
    return (
        <div className="custom-option" onClick={onClick}>
            <input type="checkbox" checked={isChecked} readOnly />
            <span className={hasAlerts ? "has-alerts" : ""}>{label}</span>
        </div>
    );
}
