import './StatCard.css';

export default function StatCard({ label, value, icon, className = '', valueStyle, children }) {
  return (
    <div className={`glass-card summary-card ${className}`.trim()}>
      {icon ? <div className="card-icon">{icon}</div> : null}
      <div className="card-info">
        <div className="card-label">{label}</div>
        <div className="card-value" style={valueStyle}>{value}</div>
        {children}
      </div>
    </div>
  );
}
