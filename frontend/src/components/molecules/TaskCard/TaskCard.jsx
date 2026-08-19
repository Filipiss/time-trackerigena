import Badge from '../../atoms/Badge/Badge';
import Button from '../../atoms/Button/Button';
import ColorDot from '../../atoms/ColorDot/ColorDot';
import { Target, CheckCircle2, CircleDashed, Trash2, Banknote, Pencil } from 'lucide-react';
import './TaskCard.css';

export default function TaskCard({
  variant = 'selector',
  task,
  isSelected = false,
  onClick,
  currencySymbol,
  onToggleBilled,
  onDelete,
  onEdit,
}) {
  if (variant === 'manager') {
    return (
      <div className={`o-card c-task-card ${task.is_billed ? 'c-task-card--billed' : ''}`}>
        <span className="c-task-card__color" style={{ backgroundColor: task.color || '#06b6d4' }} />
        <div className="c-task-card__info">
          <div className="c-task-card__name u-truncate">{task.name}</div>
          <div className="c-task-card__meta">
            <span className="c-task-card__rate-badge font-mono">
              {currencySymbol} {(task.hourly_rate || 0).toFixed(2)}/h
            </span>
            <Badge className="o-badge c-task-card__budget-badge">
              {task.budgeted_hours != null ? (
                <><Target size={12} style={{ marginRight: '4px' }} /> {task.budgeted_hours}h orçadas</>
              ) : (
                <><CircleDashed size={12} style={{ marginRight: '4px' }} /> não orçadas</>
              )}
            </Badge>
            {task.is_billed ? <Badge className="o-badge o-badge--success c-task-card__billed-badge"><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Cobrado</Badge> : null}
          </div>
        </div>
        <div className="c-task-card__actions">
          <button className="c-btn--icon" onClick={(e) => { e.stopPropagation(); onEdit?.(task); }} title="Editar Task">
            <Pencil size={16} strokeWidth={1.5} />
          </button>
          <button
            className={`c-btn--icon c-task-card__billed-btn ${task.is_billed ? 'is-active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleBilled?.(task); }}
            title={task.is_billed ? 'Desmarcar como Cobrado' : 'Marcar como Cobrado'}
          >
            <Banknote size={16} strokeWidth={1.5} color="var(--color-success)" />
          </button>
          <button className="c-btn--icon" onClick={(e) => { e.stopPropagation(); onDelete?.(task.id); }} style={{ color: 'var(--color-danger)' }} title="Excluir Task">
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  }

  // Shared molecule with variants because both surfaces present the same task identity block,
  // but only the management view needs billing/destructive controls.
  return (
    <Button className={`c-selector__item ${isSelected ? 'is-selected' : ''}`} onClick={() => onClick?.(task)}>
      <ColorDot className="o-task-dot" color={task.color || 'var(--color-info)'} size="10px" />
      <span className="c-selector__item-name">{task.name}</span>
    </Button>
  );
}
