import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { fetchSettings } from './api';
import ReactGA from 'react-ga4';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/templates/MainLayout/MainLayout';
import CalendarPage from './components/pages/CalendarPage/CalendarPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import HistoryPage from './components/pages/HistoryPage/HistoryPage';
import TasksPage from './components/pages/TasksPage/TasksPage';
import TimerPage from './components/pages/TimerPage/TimerPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import ActivatePage from './components/pages/ActivatePage/ActivatePage';
import ResetPasswordModal from './components/organisms/ResetPasswordModal/ResetPasswordModal';
import AdminLayout from './components/templates/AdminLayout/AdminLayout';
import AdminDashboardPage from './components/pages/AdminPages/AdminDashboardPage';
import UsersManagementPage from './components/pages/AdminPages/UsersManagementPage';
import AdminSettingsPage from './components/pages/AdminPages/AdminSettingsPage';
import SupportPage from './components/pages/SupportPage/SupportPage';
import AdminSupportPage from './components/pages/AdminPages/AdminSupportPage';
import FloatingWidget from './components/organisms/FloatingWidget/FloatingWidget';
import './App.css';

ReactGA.initialize('G-GYLWC1S1J3');

function AppRoutes() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);

  const [selectedTask, setSelectedTask] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_selectedTask');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
    const interval = setInterval(() => {
      fetchSettings().then(setSettings).catch(console.error);
    }, 10000); // Poll a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  useEffect(() => {
    if (selectedTask) {
      localStorage.setItem('tracker_selectedTask', JSON.stringify(selectedTask));
    } else {
      localStorage.removeItem('tracker_selectedTask');
    }
  }, [selectedTask]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((previous) => previous + 1);
  }, []);

  const handleTaskChange = useCallback(() => { handleRefresh(); }, [handleRefresh]);
  const handleSaveSuccess = useCallback(() => { handleRefresh(); }, [handleRefresh]);

  if (settings?.maintenance_mode && !user?.is_admin && !location.pathname.startsWith('/admin')) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Voltamos logo!</h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '500px' }}>O Time Trackerígena está passando por uma manutenção essencial para melhorar sua experiência. Retorne em breve.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '2rem', padding: '0.8rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
      </Route>
      <Route element={<MainLayout settings={settings} />}>
        <Route path="/timer" element={<TimerPage selectedTask={selectedTask} onSelectTask={setSelectedTask} refreshTrigger={refreshTrigger} onSaveSuccess={handleSaveSuccess} />} />
        <Route path="/tasks" element={<TasksPage onTaskChange={handleTaskChange} />} />
        <Route path="/dashboard" element={<DashboardPage refreshTrigger={refreshTrigger} />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/history" element={<HistoryPage key={location.search} refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/" element={<Navigate to="/timer" replace />} />
        <Route path="*" element={<Navigate to="/timer" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const activationToken = params.get('token');
  const resetToken = params.get('reset_token');
  const isActivatePage = window.location.pathname === '/activate' && activationToken;

  // Limpa o token da URL após detectá-lo (sem recarregar)
  const [activeResetToken] = useState(resetToken);
  useEffect(() => {
    if (resetToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_token');
      window.history.replaceState({}, '', url.toString());
    }
  }, [resetToken]);

  function handleResetClose() {
    window.location.href = '/';
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        {isActivatePage ? (
          <ActivatePage token={activationToken} />
        ) : activeResetToken ? (
          <>
            <AppRoutes />
            <ResetPasswordModal
              token={activeResetToken}
              onClose={handleResetClose}
              onSwitchToLogin={handleResetClose}
            />
          </>
        ) : (
          <AppRoutes />
        )}
        <FloatingWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}
