import { NavLink } from 'react-router-dom';
import Button from '../../atoms/Button/Button';
import './NavItem.css';

export default function NavItem({ icon, label, isActive, onClick, to, end = false, badge }) {
  const content = (
    <>
      <span className="c-nav-item__icon">{icon}</span>
      <span className="c-nav-item__label">{label}</span>
      {badge && <span className="c-nav-item__badge">{badge}</span>}
    </>
  );

  if (to != null) {
    return (
      <NavLink to={to} end={end} className={({ isActive: navActive }) => `c-nav-item ${navActive ? 'is-active' : ''}`}>
        {content}
      </NavLink>
    );
  }

  return (
    <Button className={`c-nav-item ${isActive ? 'is-active' : ''}`} onClick={onClick} aria-pressed={isActive}>
      {content}
    </Button>
  );
}
