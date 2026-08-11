import Badge from '../../atoms/Badge/Badge';
import Button from '../../atoms/Button/Button';
import ColorDot from '../../atoms/ColorDot/ColorDot';
import { Target, CheckCircle2, CircleDashed, Trash2, Banknote, Pencil } from 'lucide-react';
import './TaskCard.css';

export default function TaskCard({
  variant = 'selector',
  task,
  selected = false,
  onClick,
  currencySymbol,
  onToggleBilled,
  onDelete,
  onEdit,
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
            <Badge className="badge task-budget-badge">
              {task.budgeted_hours != null ? (
                <><Target size={12} style={{ marginRight: '4px' }} /> {task.budgeted_hours}h orçadas</>
              ) : (
                <><CircleDashed size={12} style={{ marginRight: '4px' }} /> não orçadas</>
              )}
            </Badge>
            {task.is_billed ? <Badge className="badge badge-success billed-badge"><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Cobrado</Badge> : null}
          </div>
        </div>
        <div className="task-card-actions">
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit?.(task); }} title="Editar Task">
            <Pencil size={16} strokeWidth={1.5} />
          </button>
          <button
            className={`btn-icon ${task.is_billed ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleBilled?.(task); }}
            title={task.is_billed ? 'Desmarcar como Cobrado' : 'Marcar como Cobrado'}
          >
            <Banknote size={16} strokeWidth={1.5} color="var(--color-success)" />
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDelete?.(task.id); }} style={{ color: 'var(--color-danger)' }} title="Excluir Task">
            <Trash2 size={16} strokeWidth={1.5} />
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
