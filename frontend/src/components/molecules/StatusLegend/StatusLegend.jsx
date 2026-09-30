import ColorDot from '../../atoms/ColorDot/ColorDot';
import './StatusLegend.css';

export default function StatusLegend({ items }) {
  return (
    <div className="c-status-legend">
      {items.map((item) => (
        <span key={item.key} className="c-status-legend__item">
          <ColorDot className="c-status-legend__dot" color={item.color} size="10px" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
