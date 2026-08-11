import { useCallback, useEffect, useState } from 'react';
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

function AppInner() {
  const [activeTab, setActiveTab] = useState('timer');
  const [historySubTab, setHistorySubTab] = useState(null);
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

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab);
    if (nextTab !== 'history') setHistorySubTab(null);
  }, []);

  const navigateToHistoryWithTab = useCallback((subTab) => {
    setHistorySubTab(subTab);
    setActiveTab('history');
  }, []);

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'timer' && (
        <TimerPage
          selectedTask={selectedTask}
          onSelectTask={setSelectedTask}
          refreshTrigger={refreshTrigger}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
      {activeTab === 'tasks' && (
        <TasksPage onTaskChange={handleTaskChange} onNavigateToHistory={navigateToHistoryWithTab} />
      )}
      {activeTab === 'dashboard' && <DashboardPage refreshTrigger={refreshTrigger} />}
      {activeTab === 'calendar' && <CalendarPage />}
      {activeTab === 'history' && (
        <HistoryPage refreshTrigger={refreshTrigger} onRefresh={handleRefresh} initialTab={historySubTab} />
      )}
      {activeTab === 'profile' && <ProfilePage />}
    </MainLayout>
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleResetClose() {
    // Fecha o modal e volta para a tela normal
    window.location.href = '/';
  }

  return (
    <AuthProvider>
      {isActivatePage ? (
        <ActivatePage token={activationToken} />
      ) : activeResetToken ? (
        <>
          <AppInner />
          <ResetPasswordModal
            token={activeResetToken}
            onClose={handleResetClose}
            onSwitchToLogin={handleResetClose}
          />
        </>
      ) : (
        <AppInner />
      )}
    </AuthProvider>
  );
}
