import { useState, useCallback, useEffect } from 'react';
import Timer from './components/Timer';
import TaskSelector from './components/TaskSelector';
import TaskManager from './components/TaskManager';
import Dashboard from './components/Dashboard';
import TimeHistory from './components/TimeHistory';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer', 'tasks', 'dashboard', 'history'
  const [historySubTab, setHistorySubTab] = useState(null);
  
  const [selectedTask, setSelectedTask] = useState(() => {
    try {
      const saved = localStorage.getItem('tracker_selectedTask');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (selectedTask) {
      localStorage.setItem('tracker_selectedTask', JSON.stringify(selectedTask));
    } else {
      localStorage.removeItem('tracker_selectedTask');
    }
  }, [selectedTask]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleTaskChange = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const navigateToHistoryWithTab = useCallback((subTab) => {
    setHistorySubTab(subTab);
    setActiveTab('history');
  }, []);

  useEffect(() => {
    if (activeTab !== 'history') {
      setHistorySubTab(null);
    }
  }, [activeTab]);

  return (
    <div className="app-layout">
      {/* Sidebar para Desktop / Navbar Inferior para Mobile */}
      <aside className="app-sidebar glass-card-static">
        <div className="sidebar-brand">
          <span className="brand-logo">👽</span>
          <h1 className="brand-title gradient-text">Time Trackerígena</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            <span className="nav-icon">⏱️</span>
            <span className="nav-label">Timer</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Tasks</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="nav-icon">📜</span>
            <span className="nav-label">Histórico</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-status">
            <span className="status-dot running" />
            <span className="status-text">Online</span>
          </div>
          <div className="footer-version">v1.0.0</div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="app-main">
        <div className="content-container">
          {activeTab === 'timer' && (
            <div className="timer-tab-content fade-in">
              <div className="timer-section">
                <Timer
                  selectedTask={selectedTask}
                  onSaveSuccess={handleSaveSuccess}
                />
              </div>
              <div className="selector-section">
                <TaskSelector
                  selectedTask={selectedTask}
                  onSelectTask={setSelectedTask}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="fade-in">
              <TaskManager 
                onTaskChange={handleTaskChange} 
                onNavigateToHistory={navigateToHistoryWithTab} 
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="fade-in">
              <Dashboard refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="fade-in">
              <TimeHistory
                refreshTrigger={refreshTrigger}
                onRefresh={handleRefresh}
                initialTab={historySubTab}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
