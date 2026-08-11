import TaskManagerBoard from '../../organisms/TaskManagerBoard/TaskManagerBoard';
import './TasksPage.css';

export default function TasksPage({ onTaskChange }) {
  return (
    <div className="tasks-page fade-in">
      <TaskManagerBoard onTaskChange={onTaskChange} />
    </div>
  );
}
