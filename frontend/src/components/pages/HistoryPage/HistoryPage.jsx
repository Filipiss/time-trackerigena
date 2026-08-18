import { useEffect, useMemo, useState } from 'react';
import Input from '../../atoms/Input/Input';
import Spinner from '../../atoms/Spinner/Spinner';
import BillingTable from '../../organisms/BillingTable/BillingTable';
import HistoryTable from '../../organisms/HistoryTable/HistoryTable';
import TabButton from '../../molecules/TabButton/TabButton';
import EditModal from '../../organisms/EditModal/EditModal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { deleteTimeEntry, fetchCategories, fetchTimeEntries, updateTimeEntry, updateTask } from '../../../api';
import { convertCurrency, fetchExchangeRates } from '../../../utils/currency';
import { Clock, BarChart3, List, ScrollText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './HistoryPage.css';

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

function formatDate(dateStr, lang = 'pt') {
  if (!dateStr) return '';
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    return lang === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  }
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR');
  } catch {
    return dateStr;
  }
}

function getWeeksOfMonth(year, month, lang = 'pt') {
  const weeks = [];
  let current = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  const day = current.getUTCDay();
  const diff = current.getUTCDate() - day + (day === 0 ? -6 : 1);
  current = new Date(Date.UTC(year, month, diff));

  while (current <= end) {
    const monday = new Date(current);
    const sunday = new Date(current);
    sunday.setUTCDate(sunday.getUTCDate() + 6);

    weeks.push({
      start: monday,
      end: sunday,
      label: `${formatDayMonth(monday, lang)} - ${formatDayMonth(sunday, lang)}`,
      key: monday.toISOString().split('T')[0]
    });

    current.setUTCDate(current.getUTCDate() + 7);
  }
  return weeks;
}

function formatDayMonth(date, lang = 'pt') {
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  return lang === 'en'
    ? `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`
    : `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export default function HistoryPage({ refreshTrigger, onRefresh }) {
  const { t, language } = useLanguage();

  const months = useMemo(() => [
    { value: '01', label: t('Janeiro') },
    { value: '02', label: t('Fevereiro') },
    { value: '03', label: t('Março') },
    { value: '04', label: t('Abril') },
    { value: '05', label: t('Maio') },
    { value: '06', label: t('Junho') },
    { value: '07', label: t('Julho') },
    { value: '08', label: t('Agosto') },
    { value: '09', label: t('Setembro') },
    { value: '10', label: t('Outubro') },
    { value: '11', label: t('Novembro') },
    { value: '12', label: t('Dezembro') }
  ], [t]);

  const years = useMemo(() => {
    const arr = [];
    const currentYear = new Date().getFullYear();
    for (let y = 2024; y <= currentYear + 1; y++) {
      arr.push(String(y));
    }
    return arr;
  }, []);

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

  const [viewMode, setViewMode] = useState(() => initialTab === 'faturamento' ? 'faturamento' : 'registros');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ task_name: '', start_date: '', duration: '', hourly_rate: 0, notes: '' });

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
      window.alert(`${t("Erro")}: ${error.message}`);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    const isFaturamento = viewMode === 'faturamento';
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
      const isFaturamento = viewMode === 'faturamento';

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
      window.alert(`${t("Erro ao salvar")}: ${error.message}`);
    }
  };

  // 1. Calcular a lista de semanas para o mês selecionado
  const weeksList = useMemo(() => {
    if (!monthFilter) return [];
    const [year, month] = monthFilter.split('-').map(Number);
    return getWeeksOfMonth(year, month - 1, language);
  }, [monthFilter, language]);

  // 2. Dias úteis da semana atual selecionada (Segunda a Domingo)
  const weekDaysList = useMemo(() => {
    if (selectedWeek === 'all') return [];
    const days = [];
    const monday = new Date(selectedWeek + 'T12:00:00Z');
    const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const WEEKDAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);

      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      days.push({
        dateStr,
        weekdayShort: t(WEEKDAYS_SHORT[current.getDay()]),
        weekdayFull: t(WEEKDAYS_FULL[current.getDay()]),
        label: language === 'en' ? `${m}/${d}` : `${d}/${m}`
      });
    }
    return days;
  }, [selectedWeek, t, language]);

  // Validadores para prevenir efeitos colaterais caso a semana/dia selecionado fiquem órfãos quando mudar o mês
  const safeSelectedWeek = useMemo(() => {
    if (selectedWeek === 'all') return 'all';
    const isValid = weeksList.some(w => w.key === selectedWeek);
    return isValid ? selectedWeek : 'all';
  }, [selectedWeek, weeksList]);

  const safeSelectedDay = useMemo(() => {
    if (selectedDay === 'all') return 'all';
    if (safeSelectedWeek === 'all') return 'all';
    const isValid = weekDaysList.some(d => d.dateStr === selectedDay);
    return isValid ? selectedDay : 'all';
  }, [selectedDay, safeSelectedWeek, weekDaysList]);

  // 3. Filtrar entries baseando-se na semana e no dia específico
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Filtro de Semana
    if (safeSelectedWeek !== 'all') {
      const start = new Date(safeSelectedWeek + 'T00:00:00');
      const end = new Date(safeSelectedWeek + 'T23:59:59');
      end.setDate(end.getDate() + 6);

      result = result.filter((entry) => {
        const d = new Date(entry.start_time);
        return d >= start && d <= end;
      });
    }

    // Filtro de Dia Específico
    if (safeSelectedDay !== 'all') {
      result = result.filter((entry) => {
        const local = new Date(entry.start_time);
        const y = local.getFullYear();
        const m = String(local.getMonth() + 1).padStart(2, '0');
        const d = String(local.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        return dateStr === safeSelectedDay;
      });
    }

    return result;
  }, [entries, safeSelectedWeek, safeSelectedDay]);

  // 4. Agrupar filteredEntries por dia para exibição estilo Clockify
  const groupedByDayList = useMemo(() => {
    const groups = {};
    filteredEntries.forEach((entry) => {
      const local = new Date(entry.start_time);
      const y = local.getFullYear();
      const m = String(local.getMonth() + 1).padStart(2, '0');
      const d = String(local.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (!groups[dateStr]) {
        const WEEKDAYS_FULL = [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ];
        groups[dateStr] = {
          dateStr,
          weekdayLabel: WEEKDAYS_FULL[local.getDay()],
          entries: [],
          totalDuration: 0,
        };
      }
      groups[dateStr].entries.push(entry);
      groups[dateStr].totalDuration += entry.duration_seconds;
    });

    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredEntries]);

  // 5. Totalizar tarefas para a BillingTable com base nas entries filtradas!
  const taskTotalsList = useMemo(() => {
    const taskTotals = {};
    filteredEntries.forEach((entry) => {
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
  }, [filteredEntries]);

  const totalInTargetCurrency = useMemo(
    () => taskTotalsList.reduce((sum, item) => {
      const hours = item.totalSeconds / 3600;
      const earned = hours * item.hourlyRate;
      return sum + convertCurrency(earned, item.currency, targetCurrency, exchangeRates);
    }, 0),
    [exchangeRates, targetCurrency, taskTotalsList],
  );

  return (
    <div className="time-history">
      <div className="time-history-header">
        <h2 className="time-history-title gradient-text">
          <ScrollText size={20} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          {t("Histórico de Sessões")}
        </h2>
        <div className="history-filters">
          <TabButton className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`} isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>{t("Todos")}</TabButton>
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

      <div className="view-mode-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
        <TabButton isActive={viewMode === 'registros'} onClick={() => setViewMode('registros')} icon={<List size={16} strokeWidth={1.5} />}>
          {t("Registros")}
        </TabButton>
        <TabButton isActive={viewMode === 'faturamento'} onClick={() => setViewMode('faturamento')} icon={<BarChart3 size={16} strokeWidth={1.5} />}>
          {t("Faturamento")}
        </TabButton>
      </div>

      {loading ? (
        <div className="loading-container"><Spinner /></div>
      ) : (
        <div className="history-content-layout fade-in">
          <div className="period-dropdowns-container">
            <div className="filter-group">
              <label className="filter-label">{t("Mês")}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={monthFilter.split('-')[1]}
                  onChange={(e) => {
                    const newMonth = e.target.value;
                    const year = monthFilter.split('-')[0];
                    setMonthFilter(`${year}-${newMonth}`);
                    setSelectedWeek('all');
                    setSelectedDay('all');
                  }}
                  className="filter-select"
                  style={{ minWidth: '130px', fontWeight: '600' }}
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={monthFilter.split('-')[0]}
                  onChange={(e) => {
                    const newYear = e.target.value;
                    const month = monthFilter.split('-')[1];
                    setMonthFilter(`${newYear}-${month}`);
                    setSelectedWeek('all');
                    setSelectedDay('all');
                  }}
                  className="filter-select"
                  style={{ minWidth: '90px', fontWeight: '600' }}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t("Semana")}</label>
              <select
                value={safeSelectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  setSelectedDay('all');
                }}
                className="filter-select"
              >
                <option value="all">{t("Todas as Semanas")}</option>
                {weeksList.map((week) => (
                  <option key={week.key} value={week.key}>
                    {t("Semana")} {week.label}
                  </option>
                ))}
              </select>
            </div>

            {safeSelectedWeek !== 'all' && viewMode === 'registros' && (
              <div className="filter-group">
                <label className="filter-label">{t("Dia da Semana")}</label>
                <select
                  value={safeSelectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t("Todos da Semana")}</option>
                  {weekDaysList.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      {d.weekdayFull} ({d.label})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="glass-card-static empty-card">
              <div className="empty-state">
                <span className="empty-state-icon"><Clock size={40} strokeWidth={1.5} /></span>
                <div className="empty-state-title">{t("Nenhum registro encontrado")}</div>
                <div className="empty-state-text">
                  {categoryFilter === 'all'
                    ? t('Você ainda não cronometrou nenhuma atividade. Vá para a aba Timer!')
                    : t("Nenhum registro na categoria {category} ainda.").replace("{category}", categories.find((category) => category.name.toLowerCase() === categoryFilter)?.name || categoryFilter)}
                </div>
              </div>
            </div>
          ) : (
            <div className="active-tab-content">
              {viewMode === 'registros' ? (
                groupedByDayList.length === 0 ? (
                  <div className="glass-card-static empty-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    {t("Nenhum registro no período ou dia selecionado.")}
                  </div>
                ) : (
                  <HistoryTable
                    groupedByDayList={groupedByDayList}
                    categoryFilter={categoryFilter}
                    formatDate={(d) => formatDate(d, language)}
                    formatDuration={formatDuration}
                    formatDurationShort={formatDurationShort}
                    deletingId={deletingId}
                    setDeletingId={setDeletingId}
                    onDeleteGroup={handleDeleteGroup}
                    onEdit={handleEditClick}
                  />
                )
              ) : (
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição */}
      <EditModal
        isOpen={!!editingItem}
        title={t("Editar Registro")}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      >
        {editingItem?.task_id && (
          <>
            <div className="edit-modal-field">
              <label className="edit-modal-label">{t("Nome da Tarefa")}</label>
              <Input value={editForm.task_name} onChange={e => setEditForm({ ...editForm, task_name: e.target.value })} />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">{t("Valor/Hora")}</label>
              <Input type="number" step="0.01" value={editForm.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
            </div>
          </>
        )}
        {viewMode !== 'faturamento' && (
          <div className="edit-modal-field">
            <label className="edit-modal-label">{t("Data (Resumo)")}</label>
            <Input
              type="date"
              value={editForm.start_date}
              lang={language === 'en' ? 'en' : 'pt-BR'}
              onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
            />
          </div>
        )}
        <div className="edit-modal-field">
          <label className="edit-modal-label">{viewMode === 'faturamento' ? t('Horas Trabalhadas (Decimal)') : t('Duração (HH:MM:SS)')}</label>
          <Input
            value={editForm.duration}
            onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
            type={viewMode === 'faturamento' ? 'number' : 'text'}
            step={viewMode === 'faturamento' ? '0.01' : undefined}
          />
        </div>
        {!Array.isArray(editingItem?.ids) && (
          <div className="edit-modal-field">
            <label className="edit-modal-label">{t("Notas")}</label>
            <Input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
        )}
      </EditModal>
    </div>
  );
}
