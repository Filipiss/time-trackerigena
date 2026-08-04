import ColorDot from '../../atoms/ColorDot/ColorDot';
import './StatusLegend.css';

export default function StatusLegend({ items }) {
  return (
    <div className="calendar-legend">
      {items.map((item) => (
        <span key={item.key} className="legend-item">
          <ColorDot className="legend-dot" color={item.color} size="10px" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
