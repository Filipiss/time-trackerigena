import './Spinner.css';

export default function Spinner({ className = '', label }) {
  return (
    <div className={`spinner-atom ${className}`.trim()}>
      <div className="loading-spinner" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
