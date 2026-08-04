import { useCallback, useEffect, useState } from 'react';
import MainLayout from './components/templates/MainLayout/MainLayout';
import CalendarPage from './components/pages/CalendarPage/CalendarPage';
import DashboardPage from './components/pages/DashboardPage/DashboardPage';
import HistoryPage from './components/pages/HistoryPage/HistoryPage';
import TasksPage from './components/pages/TasksPage/TasksPage';
import TimerPage from './components/pages/TimerPage/TimerPage';
import './App.css';

export default function App() {
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

  const handleTaskChange = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab);
    if (nextTab !== 'history') {
      setHistorySubTab(null);
    }
  }, []);

  const navigateToHistoryWithTab = useCallback((subTab) => {
    setHistorySubTab(subTab);
    setActiveTab('history');
  }, []);

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'timer' ? (
        <TimerPage
          selectedTask={selectedTask}
          onSelectTask={setSelectedTask}
          refreshTrigger={refreshTrigger}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : null}

      {activeTab === 'tasks' ? (
        <TasksPage onTaskChange={handleTaskChange} onNavigateToHistory={navigateToHistoryWithTab} />
      ) : null}

      {activeTab === 'dashboard' ? <DashboardPage refreshTrigger={refreshTrigger} /> : null}
      {activeTab === 'calendar' ? <CalendarPage /> : null}
      {activeTab === 'history' ? (
        <HistoryPage refreshTrigger={refreshTrigger} onRefresh={handleRefresh} initialTab={historySubTab} />
      ) : null}
    </MainLayout>
  );
}
