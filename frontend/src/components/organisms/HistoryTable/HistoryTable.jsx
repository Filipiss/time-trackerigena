import './HistoryTable.css';

export default function HistoryTable({
  weekdayLabel,
  weekdayDateLabel,
  weekdayEntries,
  categoryFilter,
  weekdayTotal,
  formatDate,
  formatDuration,
  formatDurationShort,
  deletingId,
  setDeletingId,
  onDeleteGroup,
}) {
  const renderRows = () => {
    if (categoryFilter === 'all') {
      return weekdayEntries.map((entry) => (
        <tr key={entry.id} className="history-row">
          <td>
            <div className="task-cell">
              <span className="task-color-dot" style={{ backgroundColor: entry.task_color || 'var(--color-info)' }} />
              <span className="task-name-text" title={entry.task_name}>{entry.task_name || 'Tarefa Excluída'}</span>
            </div>
          </td>
          <td><span className={`badge badge-${entry.task_category || 'loco'}`}>{entry.task_category || 'Loco'}</span></td>
          <td className="duration-cell font-mono">{formatDuration(entry.duration_seconds)}</td>
          <td>{formatDate(entry.created_at)}</td>
          <td className="notes-cell" title={entry.notes}>{entry.notes || <span className="no-notes">-</span>}</td>
          <td className="actions-cell">
            {deletingId === entry.id ? (
              <div className="delete-confirm">
                <button className="btn-icon confirm-delete-btn" onClick={() => onDeleteGroup([entry.id])}>✓</button>
                <button className="btn-icon cancel-delete-btn" onClick={() => setDeletingId(null)}>✕</button>
              </div>
            ) : (
              <button className="btn-icon delete-btn" onClick={() => setDeletingId(entry.id)}>🗑️</button>
            )}
          </td>
        </tr>
      ));
    }

    const groups = {};
    weekdayEntries.forEach((entry) => {
      const groupKey = entry.task_id ?? `deleted-${entry.id}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          task_id: entry.task_id,
          task_name: entry.task_name,
          task_color: entry.task_color,
          task_category: entry.task_category,
          created_at: entry.created_at,
          duration_seconds: 0,
          notes: [],
          ids: [],
        };
      }
      groups[groupKey].duration_seconds += entry.duration_seconds;
      groups[groupKey].ids.push(entry.id);
      if (entry.notes?.trim()) {
        groups[groupKey].notes.push(entry.notes.trim());
      }
    });

    return Object.values(groups).map((group) => {
      const deleteKey = group.task_id ?? group.ids[0];
      return (
        <tr key={deleteKey} className="history-row">
          <td>
            <div className="task-cell">
              <span className="task-color-dot" style={{ backgroundColor: group.task_color || 'var(--color-info)' }} />
              <span className="task-name-text" title={group.task_name}>{group.task_name || 'Tarefa Excluída'}</span>
              {group.ids.length > 1 ? <span className="group-count-badge">{group.ids.length}x</span> : null}
            </div>
          </td>
          <td><span className={`badge badge-${group.task_category || 'loco'}`}>{group.task_category || 'Loco'}</span></td>
          <td className="duration-cell font-mono">{formatDuration(group.duration_seconds)}</td>
          <td>{formatDate(group.created_at)}</td>
          <td className="notes-cell" title={group.notes.join(' | ')}>{group.notes.join(' | ') || <span className="no-notes">-</span>}</td>
          <td className="actions-cell">
            {deletingId === deleteKey ? (
              <div className="delete-confirm">
                <button className="btn-icon confirm-delete-btn" onClick={() => onDeleteGroup(group.ids)}>✓</button>
                <button className="btn-icon cancel-delete-btn" onClick={() => setDeletingId(null)}>✕</button>
              </div>
            ) : (
              <button className="btn-icon delete-btn" onClick={() => setDeletingId(deleteKey)}>🗑️</button>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="weekday-tab-content glass-card-static fade-in">
      <div className="weekday-tab-header">
        <div className="weekday-title-area">
          <h3>{weekdayLabel}</h3>
          {weekdayDateLabel ? <div className="weekday-date">📅 {weekdayDateLabel}</div> : null}
        </div>
        <span className="weekday-total-duration font-mono">⏱️ Total: {formatDurationShort(weekdayTotal)}</span>
      </div>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Categoria</th>
              <th>Duração</th>
              <th>Data</th>
              <th>Notas</th>
              <th className="actions-column">Ações</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>
    </div>
  );
}
