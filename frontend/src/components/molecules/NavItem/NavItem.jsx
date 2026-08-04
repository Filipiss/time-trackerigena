import Button from '../../atoms/Button/Button';
import './NavItem.css';

export default function NavItem({ icon, label, isActive, onClick }) {
  return (
    <Button className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick} aria-pressed={isActive}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </Button>
  );
}
