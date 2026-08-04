import Badge from '../../atoms/Badge/Badge';
import Button from '../../atoms/Button/Button';
import ColorDot from '../../atoms/ColorDot/ColorDot';
import './TaskCard.css';

export default function TaskCard({
  variant = 'selector',
  task,
  selected = false,
  onClick,
  currencySymbol,
  onToggleBilled,
  onDelete,
}) {
  if (variant === 'manager') {
    return (
      <div className={`task-card glass-card ${task.is_billed ? 'task-card-billed' : ''}`}>
        <span className="task-card-color" style={{ backgroundColor: task.color || '#06b6d4' }} />
        <div className="task-card-info">
          <div className="task-card-name truncate">{task.name}</div>
          <div className="task-card-meta">
            <span className="task-hourly-rate-badge font-mono">
              {currencySymbol} {(task.hourly_rate || 0).toFixed(2)}/h
            </span>
            {task.budgeted_hours != null ? (
              <Badge className="badge task-budget-badge">🎯 {task.budgeted_hours}h orçadas</Badge>
            ) : null}
            {task.is_billed ? <Badge className="badge badge-success billed-badge">Cobrado ✓</Badge> : null}
          </div>
        </div>
        <div className="task-card-actions">
          <button
            className={`btn-billed-toggle ${task.is_billed ? 'active' : ''}`}
            onClick={() => onToggleBilled?.(task)}
            title={task.is_billed ? 'Desmarcar como Cobrado' : 'Marcar como Cobrado'}
          >
            {task.is_billed ? '💶' : '💵'}
          </button>
          <button className="btn-icon" onClick={() => onDelete?.(task.id)} style={{ color: 'var(--color-danger)' }} title="Excluir Task">
            🗑️
          </button>
        </div>
      </div>
    );
  }

  // Shared molecule with variants because both surfaces present the same task identity block,
  // but only the management view needs billing/destructive controls.
  return (
    <Button className={`task-selector-item ${selected ? 'selected' : ''}`} onClick={() => onClick?.(task)}>
      <ColorDot className="task-dot" color={task.color || 'var(--color-info)'} size="10px" />
      <span className="task-item-name">{task.name}</span>
    </Button>
  );
}
