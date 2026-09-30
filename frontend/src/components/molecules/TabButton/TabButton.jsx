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
    <Button className={`c-tab-btn ${isActive ? 'is-active' : ''} ${className}`.trim()} {...props}>
      {icon ? <span className="c-tab-btn__icon">{icon}</span> : null}
      {dotColor ? <ColorDot className="c-tab-btn__dot" color={dotColor} /> : null}
      <span className="c-tab-btn__label">{children}</span>
      {badge !== undefined && badge !== null ? <span className="c-tab-btn__badge">{badge}</span> : null}
    </Button>
  );
}
