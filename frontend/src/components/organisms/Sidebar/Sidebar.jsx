import { useState, useEffect } from 'react';
import NavItem from '../../molecules/NavItem/NavItem';
import UserWidget from '../../molecules/UserWidget/UserWidget';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Clock, CheckSquare, LayoutDashboard, Calendar, ScrollText, LifeBuoy } from 'lucide-react';
import './Sidebar.css';

import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: '/timer', icon: <Clock size={20} strokeWidth={1.5} />, label: 'Timer', exact: false },
  { id: '/tasks', icon: <CheckSquare size={20} strokeWidth={1.5} />, label: 'Tarefas', exact: false },
  { id: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard', exact: false },
  { id: '/calendar', icon: <Calendar size={20} strokeWidth={1.5} />, label: 'Calendário', exact: false },
  { id: '/history', icon: <ScrollText size={20} strokeWidth={1.5} />, label: 'Histórico', exact: false },
  { id: '/support', icon: <LifeBuoy size={20} strokeWidth={1.5} />, label: 'Suporte', exact: false },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTimeStr, setActiveTimeStr] = useState(null);

  useEffect(() => {
    function updateSidebarTimer() {
      const state = localStorage.getItem('tracker_timerState');
      const accumulated = parseInt(localStorage.getItem('tracker_accumulated') || '0', 10);
      const startTime = localStorage.getItem('tracker_startTime') ? parseInt(localStorage.getItem('tracker_startTime'), 10) : null;

      if (state === 'running' && startTime) {
        const elapsed = accumulated + (Date.now() - startTime);
        const totalSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        setActiveTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setActiveTimeStr(null);
      }
    }

    updateSidebarTimer();
    const interval = setInterval(updateSidebarTimer, 200);

    window.addEventListener('timer-state-change', updateSidebarTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('timer-state-change', updateSidebarTimer);
    };
  }, []);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="brand-logo" style={{ fontSize: '24px', marginRight: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>👽</span>
        <h1 className="brand-title">Time Trackerígena</h1>
      </div>

      {/* Widget do usuário — visível só quando logado */}
      {user && (
        <UserWidget onNavigateToProfile={() => navigate('/profile')} />
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          // Bloqueia o menu 'Suporte' de aparecer para Visitantes (not user) ou Administradores 
          if (item.id === '/support' && (!user || user.is_admin)) {
            return null;
          }

          // Display timer badge only next to '/timer' (Timer)
          const badge = (item.id === '/timer' && activeTimeStr) ? activeTimeStr : null;

          return (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={t(item.label)}
              to={item.id}
              end={item.exact}
              badge={badge}
            />
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span className="sidebar-status-dot running" />
          <span className="status-text">{t("Online")}</span>
        </div>
        <div className="footer-version">BETA v1.0.0</div>
      </div>
    </aside>
  );
}
