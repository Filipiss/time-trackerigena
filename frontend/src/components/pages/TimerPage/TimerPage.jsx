import TaskSelectorPanel from '../../organisms/TaskSelectorPanel/TaskSelectorPanel';
import TimerWidget from '../../organisms/TimerWidget/TimerWidget';
import './TimerPage.css';

export default function TimerPage({ selectedTask, onSelectTask, refreshTrigger, onSaveSuccess }) {
  return (
    <div className="timer-page fade-in">
      <div className="timer-tab-content">
        <div className="timer-section">
          <TimerWidget selectedTask={selectedTask} onSaveSuccess={onSaveSuccess} />
        </div>
        <div className="selector-section">
          <TaskSelectorPanel selectedTask={selectedTask} onSelectTask={onSelectTask} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
