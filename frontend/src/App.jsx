import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/templates/MainLayout/MainLayout';
import CalendarPage from './components/pages/CalendarPage/CalendarPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import HistoryPage from './components/pages/HistoryPage/HistoryPage';
import TasksPage from './components/pages/TasksPage/TasksPage';
import TimerPage from './components/pages/TimerPage/TimerPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import ActivatePage from './components/pages/ActivatePage/ActivatePage';
import ResetPasswordModal from './components/organisms/ResetPasswordModal/ResetPasswordModal';
import './App.css';

function AppRoutes() {
  const [selectedTask, setSelectedTask] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_selectedTask');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/timer" element={<TimerPage selectedTask={selectedTask} onSelectTask={setSelectedTask} refreshTrigger={refreshTrigger} onSaveSuccess={handleSaveSuccess} />} />
        <Route path="/tasks" element={<TasksPage onTaskChange={handleTaskChange} />} />
        <Route path="/dashboard" element={<DashboardPage refreshTrigger={refreshTrigger} />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/history" element={<HistoryPage refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />} />
        <Route path="/profile" element={<ProfilePage />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
