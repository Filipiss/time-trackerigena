import NavItem from '../../molecules/NavItem/NavItem';
import UserWidget from '../../molecules/UserWidget/UserWidget';
import { useAuth } from '../../../contexts/AuthContext';
import { Clock, CheckSquare, LayoutDashboard, Calendar, ScrollText } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'timer', icon: <Clock size={20} strokeWidth={1.5} />, label: 'Timer' },
  { id: 'tasks', icon: <CheckSquare size={20} strokeWidth={1.5} />, label: 'Tasks' },
  { id: 'dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard' },
  { id: 'calendar', icon: <Calendar size={20} strokeWidth={1.5} />, label: 'Calendário' },
  { id: 'history', icon: <ScrollText size={20} strokeWidth={1.5} />, label: 'Histórico' },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { user } = useAuth();

  return (
    <aside className="app-sidebar glass-card-static">
      <div className="sidebar-brand">
        <span className="brand-logo">👽</span>
        <h1 className="brand-title gradient-text">Time Trackerígena</h1>
      </div>

      {/* Widget do usuário — visível só quando logado */}
      {user && (
        <UserWidget onNavigateToProfile={() => onTabChange('profile')} />
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span className="sidebar-status-dot running" />
          <span className="status-text">Online</span>
        </div>
        <div className="footer-version">v1.0.0</div>
      </div>
    </aside>
  );
}
