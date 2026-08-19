import './StatCard.css';

export default function StatCard({ label, value, icon, className = '', valueStyle, children }) {
  return (
    <div className={`o-card c-stat-card ${className}`.trim()}>
      {icon ? <div className="c-stat-card__icon">{icon}</div> : null}
      <div className="c-stat-card__info">
        <div className="c-stat-card__label">{label}</div>
        <div className="c-stat-card__value" style={valueStyle}>{value}</div>
        {children}
      </div>
    </div>
  );
}
