import { useState, useEffect, useCallback } from 'react';
import { fetchTimeEntries, deleteTimeEntry } from '../api';
import './TimeHistory.css';

// Formata duração em segundos para HH:MM:SS
function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Formata duração legível para cabeçalho do dia (ex: 2h 45m)
function formatDurationShort(totalSeconds) {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

// Formata data ISO para PT-BR
function formatDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
}

export default function TimeHistory({ refreshTrigger, onRefresh, initialTab }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));
  const [deletingId, setDeletingId] = useState(null);

  // Taxa de câmbio
  const [exchangeRate, setExchangeRate] = useState(6.25);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(true);

  // Aba ativa: null (nenhuma), 0-6 (dias da semana), 'faturamento'
  const [activeTab, setActiveTab] = useState(initialTab || null);

  useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab || null);
    }
  }, [initialTab]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setExchangeRateLoading(true);
        const res = await fetch('https://economia.awesomeapi.com.br/last/EUR-BRL');
        const data = await res.json();
        if (data && data.EURBRL && data.EURBRL.ask) {
          setExchangeRate(parseFloat(data.EURBRL.ask));
        }
      } catch (err) {
        console.error('Error fetching exchange rate:', err);
      } finally {
        setExchangeRateLoading(false);
      }
    };
    fetchRate();
  }, []);

  // Carrega as entradas
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        filters.start_date = startDate;
        filters.end_date = endDate;
      }
      const data = await fetchTimeEntries(filters);
      setEntries(data || []);
    } catch (error) {
      console.error('Erro ao carregar time entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, monthFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

  // Excluir múltiplas entradas (para itens agrupados)
  const handleDeleteGroup = async (ids) => {
    try {
      for (const id of ids) {
        await deleteTimeEntry(id);
      }
      setEntries((prev) => prev.filter((entry) => !ids.includes(entry.id)));
      setDeletingId(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao deletar entradas:', error);
      alert('Erro: ' + error.message);
    }
  };

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null); // Fecha se clicar no ativo
    } else {
      setActiveTab(tab);
    }
  };

  const weekdayConfig = {
    1: { name: 'Segunda', icon: '🏢' },
    2: { name: 'Terça', icon: '🏢' },
    3: { name: 'Quarta', icon: '🏢' },
    4: { name: 'Quinta', icon: '🏢' },
    5: { name: 'Sexta', icon: '🏢' },
    6: { name: 'Sábado', icon: '🏖️' },
    0: { name: 'Domingo', icon: '⛪' },
  };

  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  const groupedByWeekday = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };

  entries.forEach((entry) => {
    const date = new Date(entry.start_time);
    const dayNum = date.getDay();
    if (groupedByWeekday[dayNum] !== undefined) {
      groupedByWeekday[dayNum].push(entry);
    }
  });

  const weekdayTotals = {};
  displayOrder.forEach((dayNum) => {
    weekdayTotals[dayNum] = groupedByWeekday[dayNum].reduce((sum, entry) => sum + entry.duration_seconds, 0);
  });

  const taskTotals = {};
  entries.forEach((entry) => {
    const taskId = entry.task_id;
    if (taskId) {
      if (!taskTotals[taskId]) {
        taskTotals[taskId] = {
          name: entry.task_name || 'Tarefa Excluída',
          color: entry.task_color || '#6366f1',
          category: entry.task_category || 'loco',
          hourlyRate: entry.task_hourly_rate || 0.0,
          totalSeconds: 0,
        };
      }
      taskTotals[taskId].totalSeconds += entry.duration_seconds;
    }
  });

  const taskTotalsList = Object.values(taskTotals);
  const totalEUR = taskTotalsList.reduce((sum, item) => {
    const hours = item.totalSeconds / 3600;
    return sum + hours * item.hourlyRate;
  }, 0);
  const totalBRL = totalEUR * (parseFloat(exchangeRate) || 0.0);

  return (
    <div className="time-history">
      <div className="time-history-header">
        <h2 className="time-history-title gradient-text">📜 Histórico de Sessões</h2>

        <div className="history-filters">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="filter-btn filter-month-input"
            style={{ marginRight: '8px' }}
          />
          <button className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>Todos</button>
          <button className={`filter-btn filter-btn-loco ${categoryFilter === 'loco' ? 'active-loco' : ''}`} onClick={() => setCategoryFilter('loco')}>🏢 Loco</button>
          <button className={`filter-btn filter-btn-freelas ${categoryFilter === 'freelas' ? 'active-freelas' : ''}`} onClick={() => setCategoryFilter('freelas')}>💼 Freelas</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
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
          {/* Horizontal Tabs for Days and Faturamento */}
          <div className="horizontal-tabs-container">
            {displayOrder.map(dayNum => {
              const dayEntries = groupedByWeekday[dayNum];
              if (dayEntries.length === 0) return null;

              return (
                <button
                  key={dayNum}
                  className={`horizontal-tab-btn ${activeTab === dayNum ? 'active' : ''}`}
                  onClick={() => handleTabClick(dayNum)}
                >
                  <span className="tab-icon">{weekdayConfig[dayNum].icon}</span>
                  {weekdayConfig[dayNum].name}
                  <div className="tab-badge">{dayEntries.length}</div>
                </button>
              );
            })}

            <button
              className={`horizontal-tab-btn faturamento-tab ${activeTab === 'faturamento' ? 'active' : ''}`}
              onClick={() => handleTabClick('faturamento')}
            >
              <span className="tab-icon">📊</span> Faturamento
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="active-tab-content">
            {displayOrder.includes(activeTab) && (
              <div className="weekday-tab-content glass-card-static fade-in">
                <div className="weekday-tab-header">
                  <div className="weekday-title-area">
                    <h3>{weekdayConfig[activeTab].name}</h3>
                    {groupedByWeekday[activeTab].length > 0 && (
                      <div className="weekday-date" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                        📅 {formatDate(groupedByWeekday[activeTab][0].created_at)}
                      </div>
                    )}
                  </div>
                  <span className="weekday-total-duration font-mono">⏱️ Total: {formatDurationShort(weekdayTotals[activeTab])}</span>
                </div>
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
                  <tbody>
                    {categoryFilter === 'all' ? (
                      groupedByWeekday[activeTab].map((entry) => (
                        <tr key={entry.id} className="history-row">
                          <td>
                            <div className="task-cell">
                              <span className="task-color-dot" style={{ backgroundColor: entry.task_color || 'var(--color-info)' }} />
                              <span className="task-name-text" title={entry.task_name}>{entry.task_name || 'Tarefa Excluída'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${entry.task_category || 'loco'}`}>{entry.task_category || 'Loco'}</span>
                          </td>
                          <td className="duration-cell font-mono">{formatDuration(entry.duration_seconds)}</td>
                          <td>{formatDate(entry.created_at)}</td>
                          <td className="notes-cell" title={entry.notes}>{entry.notes || <span className="no-notes">-</span>}</td>
                          <td className="actions-cell">
                            {deletingId === entry.id ? (
                              <div className="delete-confirm">
                                <button className="btn-icon confirm-delete-btn" onClick={() => handleDeleteGroup([entry.id])}>✓</button>
                                <button className="btn-icon cancel-delete-btn" onClick={() => setDeletingId(null)}>✕</button>
                              </div>
                            ) : (
                              <button className="btn-icon delete-btn" onClick={() => setDeletingId(entry.id)}>🗑️</button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      (() => {
                        const groups = {};
                        groupedByWeekday[activeTab].forEach(entry => {
                          if (!groups[entry.task_id]) {
                            groups[entry.task_id] = {
                              task_id: entry.task_id,
                              task_name: entry.task_name,
                              task_color: entry.task_color,
                              task_category: entry.task_category,
                              created_at: entry.created_at,
                              duration_seconds: 0,
                              notes: [],
                              ids: []
                            };
                          }
                          groups[entry.task_id].duration_seconds += entry.duration_seconds;
                          groups[entry.task_id].ids.push(entry.id);
                          if (entry.notes && entry.notes.trim()) {
                            groups[entry.task_id].notes.push(entry.notes.trim());
                          }
                        });

                        return Object.values(groups).map((group) => (
                          <tr key={group.task_id || group.ids[0]} className="history-row">
                            <td>
                              <div className="task-cell">
                                <span className="task-color-dot" style={{ backgroundColor: group.task_color || 'var(--color-info)' }} />
                                <span className="task-name-text" title={group.task_name}>{group.task_name || 'Tarefa Excluída'}</span>
                                {group.ids.length > 1 && <span className="group-count-badge" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', marginLeft: '8px' }}>{group.ids.length}x</span>}
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-${group.task_category || 'loco'}`}>{group.task_category || 'Loco'}</span>
                            </td>
                            <td className="duration-cell font-mono">{formatDuration(group.duration_seconds)}</td>
                            <td>{formatDate(group.created_at)}</td>
                            <td className="notes-cell" title={group.notes.join(' | ')}>{group.notes.join(' | ') || <span className="no-notes">-</span>}</td>
                            <td className="actions-cell">
                              {deletingId === group.task_id ? (
                                <div className="delete-confirm">
                                  <button className="btn-icon confirm-delete-btn" onClick={() => handleDeleteGroup(group.ids)}>✓</button>
                                  <button className="btn-icon cancel-delete-btn" onClick={() => setDeletingId(null)}>✕</button>
                                </div>
                              ) : (
                                <button className="btn-icon delete-btn" onClick={() => setDeletingId(group.task_id)}>🗑️</button>
                              )}
                            </td>
                          </tr>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'faturamento' && (
              <div className="values-section-card glass-card-static fade-in">
                <div className="values-section-header">
                  <div className="values-header-title-wrapper">
                    <h3 className="values-header-title">Faturamento & Câmbio de Moedas</h3>
                  </div>
                  <div className="exchange-rate-input-wrapper">
                    <label className="exchange-label">Câmbio 1 EUR (€) =</label>
                    <div className="exchange-input-container">
                      <span className="exchange-symbol">R$</span>
                      <input
                        className="input exchange-rate-input font-mono"
                        type="number"
                        step="0.01"
                        min="0"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        disabled={exchangeRateLoading}
                      />
                    </div>
                  </div>
                </div>

                {taskTotalsList.length === 0 ? (
                  <div className="no-values-message">Nenhum registro para calcular valores.</div>
                ) : (
                  <div className="values-content">
                    <table className="values-table">
                      <thead>
                        <tr>
                          <th>Tarefa</th>
                          <th>Categoria</th>
                          <th>Horas Trabalhadas</th>
                          <th>Valor/Hora (€)</th>
                          <th>Total em Euros (€)</th>
                          <th>Total em Real (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskTotalsList.map((item, index) => {
                          const hours = item.totalSeconds / 3600;
                          const earnedEUR = hours * item.hourlyRate;
                          const earnedBRL = earnedEUR * (parseFloat(exchangeRate) || 0);

                          return (
                            <tr key={index} className="values-row">
                              <td>
                                <div className="task-cell">
                                  <span className="task-color-dot" style={{ backgroundColor: item.color }} />
                                  <span className="task-name-text">{item.name}</span>
                                </div>
                              </td>
                              <td><span className={`badge badge-${item.category}`}>{item.category}</span></td>
                              <td className="font-mono">
                                {hours.toFixed(2)}h
                                <span className="values-sec-details"> ({formatDurationShort(item.totalSeconds)})</span>
                              </td>
                              <td className="font-mono">€ {item.hourlyRate.toFixed(2)}/h</td>
                              <td className="font-mono value-eur-highlight">€ {earnedEUR.toFixed(2)}</td>
                              <td className="font-mono value-brl-highlight">R$ {earnedBRL.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        <tr className="values-totals-row">
                          <td colSpan={2} className="totals-label-cell">Total Geral</td>
                          <td colSpan={2}></td>
                          <td className="font-mono overall-eur-total">€ {totalEUR.toFixed(2)}</td>
                          <td className="font-mono overall-brl-total">R$ {totalBRL.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === null && (
              <div className="no-tab-selected-message">
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Selecione um dia da semana ou a aba de faturamento acima para visualizar os dados.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
