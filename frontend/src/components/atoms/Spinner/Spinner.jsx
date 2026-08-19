import './Spinner.css';

export default function Spinner({ className = '', label }) {
  return (
    <div className={`spinner-atom ${className}`.trim()}>
      <div className="c-loading__spinner" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
