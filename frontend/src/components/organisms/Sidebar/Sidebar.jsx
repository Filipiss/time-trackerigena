import NavItem from '../../molecules/NavItem/NavItem';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'timer', icon: '⏱️', label: 'Timer' },
  { id: 'tasks', icon: '📋', label: 'Tasks' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'calendar', icon: '📅', label: 'Calendário' },
  { id: 'history', icon: '📜', label: 'Histórico' },
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="app-sidebar glass-card-static">
      <div className="sidebar-brand">
        <span className="brand-logo">👽</span>
        <h1 className="brand-title gradient-text">Time Trackerígena</h1>
      </div>

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
