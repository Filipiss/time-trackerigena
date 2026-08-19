import { useEffect, useState, useCallback } from 'react';
import TaskSelectorPanel from '../../organisms/TaskSelectorPanel/TaskSelectorPanel';
import TimerWidget from '../../organisms/TimerWidget/TimerWidget';
import HistoryTable from '../../organisms/HistoryTable/HistoryTable';
import { fetchTimeEntries, deleteTimeEntry } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import './TimerPage.css';

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDurationShort(totalSeconds) {
  if (!totalSeconds) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);
  return parts.join(' ');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export default function TimerPage({ selectedTask, onSelectTask, refreshTrigger, onSaveSuccess }) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  const loadTodayEntries = useCallback(async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toLocaleDateString('en-CA');
      const data = await fetchTimeEntries({
        start_date: todayStr,
        end_date: todayStr,
      });
      setEntries(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTodayEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTodayEntries, refreshTrigger, localRefresh]);

  const handleSaveSuccessLocal = () => {
    setLocalRefresh((prev) => prev + 1);
    if (onSaveSuccess) onSaveSuccess();
  };

  const handleDeleteEntry = async (ids) => {
    try {
      for (const id of ids) {
        await deleteTimeEntry(id);
      }
      setEntries((prev) => prev.filter((entry) => !ids.includes(entry.id)));
      setDeletingId(null);
      setLocalRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      window.alert(`Erro: ${error.message}`);
    }
  };

  const todayTotal = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);

  const todayGroupedList = [
    {
      dateStr: new Date().toLocaleDateString('en-CA'),
      weekdayLabel: t("Registros de Hoje"),
      totalDuration: todayTotal,
      entries: entries
    }
  ];

  return (
    <div className="l-timer-page u-fade-in">
      <div className="l-timer-page__content">
        <div className="l-timer-page__section">
          <TimerWidget selectedTask={selectedTask} onSaveSuccess={handleSaveSuccessLocal} />
        </div>

        <div className="l-timer-page__columns">
          <div className="l-timer-page__logs-col">
            {loading ? (
              <div className="c-history-panel o-card--static" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {t("Carregando registros de hoje...")}
              </div>
            ) : entries.length === 0 ? (
              <div className="c-history-panel o-card--static" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t("Nenhum registro cronometrado hoje. Escolha uma tarefa ao lado e inicie o cronômetro!")}
              </div>
            ) : (
              <HistoryTable
                groupedByDayList={todayGroupedList}
                categoryFilter="all"
                formatDate={formatDate}
                formatDuration={formatDuration}
                formatDurationShort={formatDurationShort}
                deletingId={deletingId}
                setDeletingId={setDeletingId}
                onDeleteGroup={handleDeleteEntry}
                onEdit={null}
              />
            )}
          </div>

          <div className="l-timer-page__selector-col">
            <TaskSelectorPanel selectedTask={selectedTask} onSelectTask={onSelectTask} refreshTrigger={refreshTrigger + localRefresh} />
          </div>
        </div>
      </div>
    </div>
  );
}
