import { useState } from 'react';
import { Trash2, Check, X, Clock, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './HistoryTable.css';

export default function HistoryTable({
  groupedByDayList,
  categoryFilter,
  formatDate,
  formatDuration,
  formatDurationShort,
  deletingId,
  setDeletingId,
  onDeleteGroup,
  onEdit,
}) {
  const { t } = useLanguage();
  const [collapsedDays, setCollapsedDays] = useState(new Set());

  const toggleDay = (dateStr) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const renderGroupedRows = () => {
    const rows = [];

    groupedByDayList.forEach((group) => {
      // 1. Push the day header row as a subheader separating the entries
      rows.push(
        <tr key={`header-${group.dateStr}`} className="c-history-table__day-header-row">
          <td colSpan={6}>
            <div className="c-history-table__day-header">
              <div
                className="c-history-table__day-title-area"
                onClick={() => toggleDay(group.dateStr)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                title={!collapsedDays.has(group.dateStr) ? t("Recolher registros") : t("Expandir registros")}
              >
                <span className="btn-icon-collapse" style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.7 }}>
                  {!collapsedDays.has(group.dateStr) ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
                </span>
                <span className="c-history-table__day-title">{t(group.weekdayLabel)}</span>
                <span className="c-history-table__day-date">{formatDate(group.dateStr)}</span>
              </div>
              <span className="c-history-table__day-total font-mono">
                <Clock size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} strokeWidth={1.5} />
                {t("Total")}: {formatDurationShort(group.totalDuration)}
              </span>
            </div>
          </td>
        </tr>
      );

      // 2. Push entries rows for this day if expanded
      if (!collapsedDays.has(group.dateStr)) {
        const entries = group.entries;

        if (categoryFilter === 'all') {
          entries.forEach((entry) => {
            rows.push(
              <tr key={entry.id} className="c-history-table__row">
                <td>
                  <span className="project-badge-text">{t(entry.project_name || 'Sem Projeto')}</span>
                </td>
                <td>
                  <div className="task-cell">
                    <span className="o-color-dot" style={{ backgroundColor: entry.task_color || 'var(--color-info)' }} />
                    <span className="task-name-text" title={entry.task_name}>{entry.task_name || t('Tarefa Excluída')}</span>
                  </div>
                </td>
                <td className="duration-cell font-mono">{formatDuration(entry.duration_seconds)}</td>
                <td className="date-cell">{formatDate(entry.start_time)}</td>
                <td className="notes-cell" title={entry.notes}>{entry.notes || <span className="no-notes">-</span>}</td>
                <td className="c-history-table__actions-cell">
                  {deletingId === entry.id ? (
                    <div className="c-history-table__delete-confirm">
                      <button className="c-history-table__confirm-btn" onClick={() => onDeleteGroup([entry.id])}><Check size={16} strokeWidth={1.5} /></button>
                      <button className="c-history-table__cancel-btn" onClick={() => setDeletingId(null)}><X size={16} strokeWidth={1.5} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="c-history-table__edit-btn" onClick={() => onEdit && onEdit(entry)} title={t("Editar")}><Pencil size={15} strokeWidth={1.5} /></button>
                      <button className="c-history-table__delete-btn" onClick={() => setDeletingId(entry.id)} style={{ color: 'var(--color-danger)' }} title={t("Excluir")}><Trash2 size={15} strokeWidth={1.5} /></button>
                    </div>
                  )}
                </td>
              </tr>
            );
          });
        } else {
          // Grouped by task/project if filtered by category (original logic)
          const taskGroups = {};
          entries.forEach((entry) => {
            const groupKey = entry.task_id ?? `deleted-${entry.id}`;
            if (!taskGroups[groupKey]) {
              taskGroups[groupKey] = {
                task_id: entry.task_id,
                task_name: entry.task_name,
                project_name: entry.project_name,
                task_color: entry.task_color,
                task_category: entry.task_category,
                start_time: entry.start_time,
                duration_seconds: 0,
                notes: [],
                ids: [],
              };
            }
            taskGroups[groupKey].duration_seconds += entry.duration_seconds;
            taskGroups[groupKey].ids.push(entry.id);
            if (entry.notes?.trim()) {
              taskGroups[groupKey].notes.push(entry.notes.trim());
            }
          });

          Object.values(taskGroups).forEach((tGroup) => {
            const deleteKey = tGroup.task_id ?? tGroup.ids[0];
            rows.push(
              <tr key={`taskGroup-${deleteKey}`} className="c-history-table__row">
                <td>
                  <span className="project-badge-text">{t(tGroup.project_name || 'Sem Projeto')}</span>
                </td>
                <td>
                  <div className="task-cell">
                    <span className="o-color-dot" style={{ backgroundColor: tGroup.task_color || 'var(--color-info)' }} />
                    <span className="task-name-text" title={tGroup.task_name}>{tGroup.task_name || t('Tarefa Excluída')}</span>
                    {tGroup.ids.length > 1 ? <span className="group-count-badge">{tGroup.ids.length}x</span> : null}
                  </div>
                </td>
                <td className="duration-cell font-mono">{formatDuration(tGroup.duration_seconds)}</td>
                <td className="date-cell">{formatDate(tGroup.start_time)}</td>
                <td className="notes-cell" title={tGroup.notes.join(' | ')}>{tGroup.notes.join(' | ') || <span className="no-notes">-</span>}</td>
                <td className="c-history-table__actions-cell">
                  {deletingId === deleteKey ? (
                    <div className="c-history-table__delete-confirm">
                      <button className="c-history-table__confirm-btn" onClick={() => onDeleteGroup(tGroup.ids)}><Check size={16} strokeWidth={1.5} /></button>
                      <button className="c-history-table__cancel-btn" onClick={() => setDeletingId(null)}><X size={16} strokeWidth={1.5} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="c-history-table__edit-btn" onClick={() => onEdit && onEdit(tGroup)} title={t("Editar Grupo/Tarefa")}><Pencil size={15} strokeWidth={1.5} /></button>
                      <button className="c-history-table__delete-btn" onClick={() => setDeletingId(deleteKey)} style={{ color: 'var(--color-danger)' }} title={t("Excluir")}><Trash2 size={15} strokeWidth={1.5} /></button>
                    </div>
                  )}
                </td>
              </tr>
            );
          });
        }
      }
    });

    return rows;
  };

  return (
    <div className="c-history-panel o-card--static u-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="c-history-table__wrapper">
        <table className="c-history-table">
          <thead>
            <tr>
              <th>{t("Projeto")}</th>
              <th>{t("Tarefa")}</th>
              <th>{t("Duração")}</th>
              <th>{t("Data")}</th>
              <th>{t("Notas")}</th>
              <th className="c-history-table__actions-col">{t("Ações")}</th>
            </tr>
          </thead>
          <tbody>{renderGroupedRows()}</tbody>
        </table>
      </div>
    </div>
  );
}
