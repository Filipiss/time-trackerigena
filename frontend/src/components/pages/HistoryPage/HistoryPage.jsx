import { useEffect, useMemo, useState } from 'react';
import Input from '../../atoms/Input/Input';
import Spinner from '../../atoms/Spinner/Spinner';
import BillingTable from '../../organisms/BillingTable/BillingTable';
import HistoryTable from '../../organisms/HistoryTable/HistoryTable';
import TabButton from '../../molecules/TabButton/TabButton';
import { deleteTimeEntry, fetchTimeEntries } from '../../../api';
import { convertCurrency, fetchExchangeRates } from '../../../utils/currency';
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
  1: { name: 'Segunda', icon: '🏢' },
  2: { name: 'Terça', icon: '🏢' },
  3: { name: 'Quarta', icon: '🏢' },
  4: { name: 'Quinta', icon: '🏢' },
  5: { name: 'Sexta', icon: '🏢' },
  6: { name: 'Sábado', icon: '🏖️' },
  0: { name: 'Domingo', icon: '⛪' },
};

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function HistoryPage({ refreshTrigger, onRefresh, initialTab }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));
  const [deletingId, setDeletingId] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({ EURBRL: 6.25, USDBRL: 5.4 });
  const [exchangeRateLoading, setExchangeRateLoading] = useState(true);
  const [targetCurrency, setTargetCurrency] = useState('BRL');
  const [activeTab, setActiveTab] = useState(initialTab || null);

  const initialTabKey = initialTab ?? null;

  useEffect(() => {
    if (initialTab !== undefined) {
      setTimeout(() => {
        setActiveTab(initialTabKey);
      }, 0);
    }
  }, [initialTab, initialTabKey]);

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
          name: entry.task_name || 'Tarefa Excluída',
          color: entry.task_color || '#6366f1',
          category: entry.task_category || 'loco',
          hourlyRate: entry.task_hourly_rate || 0,
          currency: entry.task_currency || 'EUR',
          budgetedHours: entry.task_budgeted_hours,
          totalSeconds: 0,
        };
      }
      taskTotals[entry.task_id].totalSeconds += entry.duration_seconds;
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
        <h2 className="time-history-title gradient-text">📜 Histórico de Sessões</h2>
        <div className="history-filters">
          <Input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="filter-month-input" />
          <TabButton className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`} isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>Todos</TabButton>
          <TabButton className={`filter-btn filter-btn-loco ${categoryFilter === 'loco' ? 'active-loco' : ''}`} isActive={categoryFilter === 'loco'} onClick={() => setCategoryFilter('loco')}>🏢 Loco</TabButton>
          <TabButton className={`filter-btn filter-btn-freelas ${categoryFilter === 'freelas' ? 'active-freelas' : ''}`} isActive={categoryFilter === 'freelas'} onClick={() => setCategoryFilter('freelas')}>💼 Freelas</TabButton>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><Spinner /></div>
      ) : entries.length === 0 ? (
        <div className="glass-card-static empty-card">
          <div className="empty-state">
            <span className="empty-state-icon">⏱️</span>
            <div className="empty-state-title">Nenhum registro encontrado</div>
            <div className="empty-state-text">
              {categoryFilter === 'all'
                ? 'Você ainda não cronometrou nenhuma atividade. Vá para a aba Timer!'
                : `Nenhum registro na categoria ${categoryFilter === 'loco' ? 'Loco' : 'Freelas'} ainda.`}
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
              <TabButton className={`horizontal-tab-btn faturamento-tab ${activeTab === 'faturamento' ? 'active' : ''}`} isActive={activeTab === 'faturamento'} icon="📊" onClick={() => handleTabClick('faturamento')}>Faturamento</TabButton>
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
    </div>
  );
}
