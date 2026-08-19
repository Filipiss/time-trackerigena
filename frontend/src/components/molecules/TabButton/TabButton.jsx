import Button from '../../atoms/Button/Button';
import ColorDot from '../../atoms/ColorDot/ColorDot';
import './TabButton.css';

export default function TabButton({
  className = '',
  isActive = false,
  icon,
  dotColor,
  badge,
  children,
  ...props
}) {
  return (
    <Button className={`tab-button ${isActive ? 'is-active' : ''} ${className}`.trim()} {...props}>
      {icon ? <span className="tab-button-icon">{icon}</span> : null}
      {dotColor ? <ColorDot className="tab-button-dot" color={dotColor} /> : null}
      <span className="tab-button-label">{children}</span>
      {badge !== undefined && badge !== null ? <span className="tab-button-badge">{badge}</span> : null}
    </Button>
  );
}
