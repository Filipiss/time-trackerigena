import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import { fetchStats } from '../api';
import './Dashboard.css';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
const formatSeconds = (value = 0) => `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
const chartDate = (date) => date ? date.slice(8, 10) + '/' + date.slice(5, 7) : '';

export default function Dashboard({ refreshTrigger }) {
  const [period, setPeriod] = useState('week');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({ proportion: false, hours: false, tasks: false });
  const loadStats = useCallback(async () => {
    setLoading(true);
    try { setStats(await fetchStats(period)); } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [period]);
  useEffect(() => { loadStats(); }, [loadStats, refreshTrigger]);
  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  const categories = (stats?.time_by_category || []).filter(item => item.total_seconds > 0);
  const tasks = (stats?.time_by_task || []).slice(0, 10).map(item => ({ ...item, Horas: +(item.total_seconds / 3600).toFixed(2) }));
  const days = (stats?.time_by_day || []).map(item => ({ ...item, label: chartDate(item.date), Horas: +(item.total_seconds / 3600).toFixed(2) }));
  const toggle = (chart) => setCollapsed(current => ({ ...current, [chart]: !current[chart] }));
  const ChartTitle = ({ chart, children }) => <div className="chart-title-row"><h3 className="chart-card-title">{children}</h3><button className="btn btn-ghost" onClick={() => toggle(chart)}>{collapsed[chart] ? 'Expandir' : 'Minimizar'}</button></div>;
  return <div className="dashboard-container">
    <div className="dashboard-header"><h2 className="dashboard-title gradient-text">Dashboard</h2><div className="dashboard-filters">{[['week','Semana'], ['month','Mês'], ['year','Ano']].map(([value,label]) => <button key={value} className={`btn ${period === value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod(value)}>{label}</button>)}</div></div>
    <div className="summary-cards"><div className="glass-card summary-card overall-card"><div className="card-info"><div className="card-label">Tempo Total Acumulado</div><div className="card-value font-mono">{formatSeconds(stats?.total_seconds)}</div></div></div>{categories.map((category, index) => <div className="glass-card summary-card" key={category.category}><div className="card-info"><div className="card-label">{category.category}</div><div className="card-value font-mono" style={{ color: COLORS[index % COLORS.length] }}>{formatSeconds(category.total_seconds)}</div></div></div>)}</div>
    <div className="charts-grid">
      <div className="glass-card chart-card"><ChartTitle chart="proportion">Proporção por categoria</ChartTitle>{!collapsed.proportion && <div className="chart-wrapper"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={categories} dataKey="total_seconds" nameKey="category" innerRadius={55} outerRadius={90}>{categories.map((item,index) => <Cell key={item.category} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={formatSeconds}/><Legend /></PieChart></ResponsiveContainer></div>}</div>
      <div className="glass-card chart-card"><ChartTitle chart="hours">Horas trabalhadas</ChartTitle>{!collapsed.hours && <div className="chart-wrapper"><ResponsiveContainer width="100%" height={260}><AreaChart data={days}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label"/><YAxis unit="h"/><Tooltip/><Area dataKey="Horas" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25}/></AreaChart></ResponsiveContainer></div>}</div>
      <div className="glass-card chart-card span-2-desktop"><ChartTitle chart="tasks">Tempo gasto por task</ChartTitle>{!collapsed.tasks && <div className="chart-wrapper"><ResponsiveContainer width="100%" height={280}><BarChart data={tasks}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="task_name"/><YAxis unit="h"/><Tooltip/><Bar dataKey="Horas">{tasks.map((task,index) => <Cell key={task.task_name} fill={task.task_color || COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>}</div>
    </div>
  </div>;
}
