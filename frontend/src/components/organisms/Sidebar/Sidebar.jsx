import NavItem from '../../molecules/NavItem/NavItem';
import UserWidget from '../../molecules/UserWidget/UserWidget';
import { useAuth } from '../../../contexts/AuthContext';
import { Clock, CheckSquare, LayoutDashboard, Calendar, ScrollText } from 'lucide-react';
import './Sidebar.css';

import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: '/', icon: <Clock size={20} strokeWidth={1.5} />, label: 'Timer', exact: true },
  { id: '/tasks', icon: <CheckSquare size={20} strokeWidth={1.5} />, label: 'Tasks', exact: false },
  { id: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard', exact: false },
  { id: '/calendar', icon: <Calendar size={20} strokeWidth={1.5} />, label: 'Calendário', exact: false },
  { id: '/history', icon: <ScrollText size={20} strokeWidth={1.5} />, label: 'Histórico', exact: false },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar glass-card-static">
      <div className="sidebar-brand">
        <span className="brand-logo">👽</span>
        <h1 className="brand-title gradient-text">Time Trackerígena</h1>
      </div>

      {/* Widget do usuário — visível só quando logado */}
      {user && (
        <UserWidget onNavigateToProfile={() => navigate('/profile')} />
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            to={item.id}
            end={item.exact}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span className="sidebar-status-dot running" />
          <span className="status-text">Online</span>
        </div>
        <div className="footer-version">BETA v1.0.0</div>
      </div>
    </aside>
  );
}
