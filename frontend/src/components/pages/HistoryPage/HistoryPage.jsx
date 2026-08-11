import { useEffect, useMemo, useState } from 'react';
import Input from '../../atoms/Input/Input';
import Spinner from '../../atoms/Spinner/Spinner';
import BillingTable from '../../organisms/BillingTable/BillingTable';
import HistoryTable from '../../organisms/HistoryTable/HistoryTable';
import TabButton from '../../molecules/TabButton/TabButton';
import EditModal from '../../organisms/EditModal/EditModal';
import { deleteTimeEntry, fetchCategories, fetchTimeEntries, updateTimeEntry, updateTask } from '../../../api';
import { convertCurrency, fetchExchangeRates } from '../../../utils/currency';
import { Building2, Palmtree, Home, ScrollText, Clock, BarChart3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './HistoryPage.css';

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDurationShort(totalSeconds) {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
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

const WEEKDAY_CONFIG = {
  1: { name: 'Segunda', icon: <Building2 size={16} strokeWidth={1.5} /> },
  2: { name: 'Terça', icon: <Building2 size={16} strokeWidth={1.5} /> },
  3: { name: 'Quarta', icon: <Building2 size={16} strokeWidth={1.5} /> },
  4: { name: 'Quinta', icon: <Building2 size={16} strokeWidth={1.5} /> },
  5: { name: 'Sexta', icon: <Building2 size={16} strokeWidth={1.5} /> },
  6: { name: 'Sábado', icon: <Palmtree size={16} strokeWidth={1.5} /> },
  0: { name: 'Domingo', icon: <Home size={16} strokeWidth={1.5} /> },
};

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function HistoryPage({ refreshTrigger, onRefresh }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab');

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));
  const [deletingId, setDeletingId] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({ EURBRL: 6.25, USDBRL: 5.4 });
  const [exchangeRateLoading, setExchangeRateLoading] = useState(true);
  const [targetCurrency, setTargetCurrency] = useState('BRL');
  const [activeTab, setActiveTab] = useState(initialTab || null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ task_name: '', start_date: '', duration: '', hourly_rate: 0, notes: '' });

  useEffect(() => {
    setActiveTab(initialTab || null);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        if (active) {
          setCategories(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setExchangeRateLoading(true);
        const rates = await fetchExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      } finally {
        setExchangeRateLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    let active = true;

    const loadEntries = async () => {
      try {
        if (active) {
          setLoading(true);
        }
        const filters = {};
        if (categoryFilter !== 'all') {
          filters.category = categoryFilter;
        }
        if (monthFilter) {
          const [year, month] = monthFilter.split('-');
          filters.start_date = new Date(year, month - 1, 1).toISOString().split('T')[0];
          filters.end_date = new Date(year, month, 0).toISOString().split('T')[0];
        }
        const data = await fetchTimeEntries(filters);
        if (active) {
          setEntries(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar time entries:', error);
        if (active) {
          setEntries([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEntries();

    return () => {
      active = false;
    };
  }, [categoryFilter, monthFilter, refreshTrigger]);

  const handleDeleteGroup = async (ids) => {
    try {
      for (const id of ids) {
        await deleteTimeEntry(id);
      }
      setEntries((previous) => previous.filter((entry) => !ids.includes(entry.id)));
      setDeletingId(null);
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao deletar entradas:', error);
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    const isFaturamento = activeTab === 'faturamento';
    setEditForm({
      task_name: item.task_name || item.name || '',
      start_date: item.start_time ? item.start_time.slice(0, 10) : (item.start_date ? item.start_date.slice(0, 10) : ''),
      duration: isFaturamento ? ((item.duration_seconds || item.totalSeconds || 0) / 3600).toFixed(2) : formatDuration(item.duration_seconds || item.totalSeconds || 0),
      hourly_rate: item.task_hourly_rate || item.hourlyRate || 0,
      notes: item.notes ? (Array.isArray(item.notes) ? item.notes.join(' | ') : item.notes) : '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingItem) return;
      const isGroup = Array.isArray(editingItem.ids);
      const isFaturamento = activeTab === 'faturamento';

      let newDurationSec;
      if (isFaturamento) {
        newDurationSec = Math.round(parseFloat(editForm.duration) * 3600);
      } else {
        const parts = editForm.duration.split(':');
        newDurationSec = (parseInt(parts[0] || '0', 10) * 3600) + (parseInt(parts[1] || '0', 10) * 60) + parseInt(parts[2] || '0', 10);
      }

      if (editingItem.task_id) {
        await updateTask(editingItem.task_id, {
          name: editForm.task_name,
          hourly_rate: parseFloat(editForm.hourly_rate),
        });
      }

      if (isGroup) {
        // Just update one entry's duration to make up difference, or first entry
        const entryId = editingItem.ids[0];
        const diff = newDurationSec - editingItem.duration_seconds;
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
          await updateTimeEntry(entryId, {
            duration_seconds: Math.max(0, entry.duration_seconds + diff),
            start_time: editForm.start_date ? new Date(editForm.start_date + 'T12:00:00Z').toISOString() : entry.start_time,
          });
        }
      } else {
        await updateTimeEntry(editingItem.id, {
          duration_seconds: newDurationSec,
          notes: editForm.notes,
          start_time: editForm.start_date ? new Date(editForm.start_date + 'T12:00:00Z').toISOString() : editingItem.start_time,
        });
      }

      setEditingItem(null);
      onRefresh?.();
    } catch (error) {
      window.alert(`Erro ao salvar: ${error.message}`);
    }
  };

  const groupedByWeekday = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    entries.forEach((entry) => {
      const dayNum = new Date(entry.start_time).getDay();
      if (groups[dayNum]) {
        groups[dayNum].push(entry);
      }
    });
    return groups;
  }, [entries]);

  const weekdayTotals = useMemo(() => {
    const totals = {};
    DISPLAY_ORDER.forEach((dayNum) => {
      totals[dayNum] = groupedByWeekday[dayNum].reduce((sum, entry) => sum + entry.duration_seconds, 0);
    });
    return totals;
  }, [groupedByWeekday]);

  const taskTotalsList = useMemo(() => {
    const taskTotals = {};
    entries.forEach((entry) => {
      if (!entry.task_id) return;
      if (!taskTotals[entry.task_id]) {
        taskTotals[entry.task_id] = {
          task_id: entry.task_id,
          name: entry.task_name || 'Tarefa Excluída',
          projectName: entry.project_name || '',
          color: entry.task_color || 'var(--color-info)',
          category: (entry.task_category || 'sem-categoria').toLowerCase(),
          hourlyRate: entry.task_hourly_rate || 0,
          currency: entry.task_currency || 'EUR',
          budgetedHours: entry.task_budgeted_hours,
          totalSeconds: 0,
          ids: [],
        };
      }
      taskTotals[entry.task_id].totalSeconds += entry.duration_seconds;
      taskTotals[entry.task_id].ids.push(entry.id);
    });
    return Object.values(taskTotals);
  }, [entries]);

  const totalInTargetCurrency = useMemo(
    () => taskTotalsList.reduce((sum, item) => {
      const hours = item.totalSeconds / 3600;
      const earned = hours * item.hourlyRate;
      return sum + convertCurrency(earned, item.currency, targetCurrency, exchangeRates);
    }, 0),
    [exchangeRates, targetCurrency, taskTotalsList],
  );

  const handleTabClick = (tab) => {
    setActiveTab((current) => (current === tab ? null : tab));
  };

  return (
    <div className="time-history">
      <div className="time-history-header">
        <h2 className="time-history-title gradient-text"><ScrollText size={20} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Histórico de Sessões</h2>
        <div className="history-filters">
          <Input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="filter-month-input" />
          <TabButton className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`} isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>Todos</TabButton>
          {categories.map((category) => {
            const key = category.name.toLowerCase();
            return (
              <TabButton
                key={category.id}
                className={`filter-btn ${categoryFilter === key ? 'active' : ''}`}
                isActive={categoryFilter === key}
                dotColor={`var(--color-${key})`}
                onClick={() => setCategoryFilter(key)}
                style={categoryFilter === key ? { borderColor: `var(--color-${key})`, color: `var(--color-${key})` } : undefined}
              >
                {category.name}
              </TabButton>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><Spinner /></div>
      ) : entries.length === 0 ? (
        <div className="glass-card-static empty-card">
          <div className="empty-state">
            <span className="empty-state-icon"><Clock size={40} strokeWidth={1.5} /></span>
            <div className="empty-state-title">Nenhum registro encontrado</div>
            <div className="empty-state-text">
              {categoryFilter === 'all'
                ? 'Você ainda não cronometrou nenhuma atividade. Vá para a aba Timer!'
                : `Nenhum registro na categoria ${categories.find((category) => category.name.toLowerCase() === categoryFilter)?.name || categoryFilter} ainda.`}
            </div>
          </div>
        </div>
      ) : (
        <div className="history-content-layout fade-in">
          <div className="horizontal-tabs-scroll">
            <div className="horizontal-tabs-container">
              {DISPLAY_ORDER.map((dayNum) => {
                const dayEntries = groupedByWeekday[dayNum];
                if (dayEntries.length === 0) return null;
                return (
                  <TabButton
                    key={dayNum}
                    className={`horizontal-tab-btn ${activeTab === dayNum ? 'active' : ''}`}
                    isActive={activeTab === dayNum}
                    icon={WEEKDAY_CONFIG[dayNum].icon}
                    badge={dayEntries.length}
                    onClick={() => handleTabClick(dayNum)}
                  >
                    {WEEKDAY_CONFIG[dayNum].name}
                  </TabButton>
                );
              })}
              <TabButton className={`horizontal-tab-btn faturamento-tab ${activeTab === 'faturamento' ? 'active' : ''}`} isActive={activeTab === 'faturamento'} icon={<BarChart3 size={16} strokeWidth={1.5} />} onClick={() => handleTabClick('faturamento')}>Faturamento</TabButton>
            </div>
          </div>

          <div className="active-tab-content">
            {DISPLAY_ORDER.includes(activeTab) ? (
              <HistoryTable
                weekdayLabel={WEEKDAY_CONFIG[activeTab].name}
                weekdayDateLabel={groupedByWeekday[activeTab][0] ? formatDate(groupedByWeekday[activeTab][0].created_at) : ''}
                weekdayEntries={groupedByWeekday[activeTab]}
                categoryFilter={categoryFilter}
                weekdayTotal={weekdayTotals[activeTab]}
                formatDate={formatDate}
                formatDuration={formatDuration}
                formatDurationShort={formatDurationShort}
                deletingId={deletingId}
                setDeletingId={setDeletingId}
                onDeleteGroup={handleDeleteGroup}
                onEdit={handleEditClick}
              />
            ) : null}

            {activeTab === 'faturamento' ? (
              <BillingTable
                taskTotalsList={taskTotalsList}
                targetCurrency={targetCurrency}
                setTargetCurrency={setTargetCurrency}
                exchangeRates={exchangeRates}
                exchangeRateLoading={exchangeRateLoading}
                totalInTargetCurrency={totalInTargetCurrency}
                formatDurationShort={formatDurationShort}
                convertCurrency={convertCurrency}
                onEdit={handleEditClick}
              />
            ) : null}

            {activeTab === null ? (
              <div className="no-tab-selected-message">
                <p>Selecione um dia da semana ou a aba de faturamento acima para visualizar os dados.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <EditModal
        isOpen={!!editingItem}
        title="Editar Registro"
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      >
        {editingItem?.task_id && (
          <>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Nome da Tarefa</label>
              <Input value={editForm.task_name} onChange={e => setEditForm({ ...editForm, task_name: e.target.value })} />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Valor / Hora</label>
              <Input type="number" step="0.01" value={editForm.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
            </div>
          </>
        )}
        {activeTab !== 'faturamento' && (
          <div className="edit-modal-field">
            <label className="edit-modal-label">Data (Resumo)</label>
            <Input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
          </div>
        )}
        <div className="edit-modal-field">
          <label className="edit-modal-label">{activeTab === 'faturamento' ? 'Horas Trabalhadas (Decimal)' : 'Duração (HH:MM:SS)'}</label>
          <Input
            value={editForm.duration}
            onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
            type={activeTab === 'faturamento' ? 'number' : 'text'}
            step={activeTab === 'faturamento' ? '0.01' : undefined}
          />
        </div>
        {!Array.isArray(editingItem?.ids) && (
          <div className="edit-modal-field">
            <label className="edit-modal-label">Notas</label>
            <Input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
        )}
      </EditModal>
    </div>
  );
}
