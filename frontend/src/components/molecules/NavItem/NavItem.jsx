import { NavLink } from 'react-router-dom';
import Button from '../../atoms/Button/Button';
import './NavItem.css';

export default function NavItem({ icon, label, isActive, onClick, to, end = false, badge }) {
  const content = (
    <>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </>
  );

  if (to != null) {
    return (
      <NavLink to={to} end={end} className={({ isActive: navActive }) => `nav-item ${navActive ? 'active' : ''}`}>
        {content}
      </NavLink>
    );
  }

  return (
    <Button className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick} aria-pressed={isActive}>
      {content}
    </Button>
  );
}
