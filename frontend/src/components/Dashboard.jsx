import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStats } from '../api';
import './Dashboard.css';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
const formatTime = (seconds = 0) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
const initialFilters = { type: '', year: '', month: '', week: '', day: '' };

function datesFor(filters) {
  if (!filters.type || filters.type === 'total') return { period: 'total' };
  if (filters.type === 'day' && filters.day) return { period: 'day', start_date: filters.day, end_date: filters.day };
  const year = Number(filters.year || new Date().getFullYear());
  if (filters.type === 'year') return { period: 'year', start_date: `${year}-01-01`, end_date: `${year}-12-31` };
  if (filters.type === 'month') {
    const month = String(filters.month || new Date().getMonth() + 1).padStart(2, '0');
    return { period: 'month', start_date: `${year}-${month}-01`, end_date: `${year}-${month}-${new Date(year, Number(month), 0).getDate()}` };
  }
  const week = Number(filters.week || 1);
  const start = new Date(year, 0, 1 + (week - 1) * 7);
  const end = new Date(year, 0, 1 + week * 7 - 1);
  return { period: 'week', start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
}

export default function Dashboard({ refreshTrigger }) {
  const [filters, setFilters] = useState(() => JSON.parse(localStorage.getItem('dashboard_filters') || JSON.stringify(initialFilters)));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setStats(await fetchStats(datesFor(filters))); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { load(); }, [load, refreshTrigger]);
  useEffect(() => { localStorage.setItem('dashboard_filters', JSON.stringify(filters)); }, [filters]);
  const update = (key, value) => setFilters(old => ({ ...old, [key]: value }));
  const year = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, index) => year - index);
  const categories = (stats?.time_by_category || []).filter(item => item.total_seconds > 0);
  const tasks = (stats?.time_by_task || []).slice(0, 10).map(item => ({ ...item, hours: +(item.total_seconds / 3600).toFixed(2) }));
  const days = (stats?.time_by_day || []).map(item => ({ ...item, label: item.date?.slice(8, 10) + '/' + item.date?.slice(5, 7), hours: +(item.total_seconds / 3600).toFixed(2) }));
  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  return <div className="dashboard-container">
    <div className="dashboard-header"><h2 className="dashboard-title gradient-text">Dashboard</h2><div className="dashboard-filters">
      <select className="input" value={filters.type} onChange={event => update('type', event.target.value)}><option value="">Filtros</option><option value="total">Total acumulado</option><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option><option value="year">Ano</option></select>
      {filters.type && !['total', 'day'].includes(filters.type) && <select className="input" value={filters.year || year} onChange={event => update('year', event.target.value)}>{years.map(value => <option key={value} value={value}>{value}</option>)}</select>}
      {filters.type === 'month' && <select className="input" value={filters.month || new Date().getMonth() + 1} onChange={event => update('month', event.target.value)}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{new Date(2020, index).toLocaleString('pt-BR', { month: 'long' })}</option>)}</select>}
      {filters.type === 'week' && <select className="input" value={filters.week || 1} onChange={event => update('week', event.target.value)}>{Array.from({ length: 53 }, (_, index) => <option key={index} value={index + 1}>Semana {index + 1}</option>)}</select>}
      {filters.type === 'day' && <input className="input" type="date" value={filters.day} onChange={event => update('day', event.target.value)} />}
    </div></div>
    <div className="summary-cards"><div className="glass-card summary-card overall-card"><div className="card-info"><div className="card-label">Tempo Total Acumulado</div><div className="card-value font-mono">{formatTime(stats?.total_seconds)}</div></div></div>{categories.map((item, index) => <div className="glass-card summary-card" key={item.category}><div className="card-info"><div className="card-label">{item.category}</div><div className="card-value font-mono" style={{ color: COLORS[index % COLORS.length] }}>{formatTime(item.total_seconds)}</div></div></div>)}</div>
    <div className="charts-grid">
      <div className="glass-card chart-card"><h3 className="chart-card-title">Proporção por categoria</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={categories} dataKey="total_seconds" nameKey="category" innerRadius={55} outerRadius={90}>{categories.map((item, index) => <Cell key={item.category} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={formatTime}/><Legend /></PieChart></ResponsiveContainer></div>
      <div className="glass-card chart-card"><h3 className="chart-card-title">Horas trabalhadas</h3><ResponsiveContainer width="100%" height={260}><AreaChart data={days}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label"/><YAxis unit="h"/><Tooltip/><Area dataKey="hours" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25}/></AreaChart></ResponsiveContainer></div>
      <div className="glass-card chart-card span-2-desktop"><h3 className="chart-card-title">Tempo gasto por task</h3><ResponsiveContainer width="100%" height={280}><BarChart data={tasks}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="task_name"/><YAxis unit="h"/><Tooltip/><Bar dataKey="hours">{tasks.map((item, index) => <Cell key={item.task_name} fill={item.task_color || COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
  </div>;
}
