import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Input from '../../atoms/Input/Input';
import Select from '../../atoms/Select/Select';
import Spinner from '../../atoms/Spinner/Spinner';
import StatCard from '../../molecules/StatCard/StatCard';
import { fetchCategories, fetchStats } from '../../../api';
import './DashboardOverview.css';

const COLORS = ['#a3e635', '#bbf7d0', '#84cc16', '#a1a1aa', '#71717a', '#d4d4d8'];
const formatTime = (seconds = 0) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
const initialFilters = { type: '', year: '', month: '', week: '', day: '', category: '' };

function datesFor(filters) {
  if (!filters.type || filters.type === 'total') return { period: 'total' };
  if (filters.type === 'day' && filters.day) return { period: 'day', start_date: filters.day, end_date: filters.day };
  const year = Number(filters.year || new Date().getFullYear());
  if (filters.type === 'year') return { period: 'year', start_date: `${year}-01-01`, end_date: `${year}-12-31` };
  if (filters.type === 'month') {
    const month = String(filters.month || new Date().getMonth() + 1).padStart(2, '0');
    return { period: 'month', start_date: `${year}-${month}-01`, end_date: `${year}-${month}-${new Date(year, Number(month), 0).getDate()}` };
  }
  const monthIndex = Number(filters.month || new Date().getMonth() + 1) - 1;
  const start = new Date(year, monthIndex, 1 + (Number(filters.week || 1) - 1) * 7);
  const end = new Date(
    year,
    monthIndex + 1,
    Math.min(start.getDate() + (7 - start.getDay()), new Date(year, monthIndex + 1, 0).getDate()),
  );
  return { period: 'week', start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
}

export default function DashboardOverview({ refreshTrigger }) {
  const [filters, setFilters] = useState(() => JSON.parse(localStorage.getItem('dashboard_filters') || JSON.stringify(initialFilters)));
  const [stats, setStats] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (active) {
        setLoading(true);
      }
      try {
        const statsData = await fetchStats({ ...datesFor(filters), ...(filters.category ? { category: filters.category } : {}) });
        if (active) {
          setStats(statsData);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [filters, refreshTrigger]);

  useEffect(() => {
    fetchCategories().then(setAvailableCategories).catch(console.error);
  }, [refreshTrigger]);

  useEffect(() => {
    localStorage.setItem('dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }));
  const year = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, index) => year - index);
  const categories = (stats?.time_by_category || []).filter((item) => item.total_seconds > 0);
  const tasks = (stats?.time_by_task || []).slice(0, 10).map((item) => ({ ...item, hours: +(item.total_seconds / 3600).toFixed(2) }));
  const days = (stats?.time_by_day || []).map((item) => ({
    ...item,
    label: `${item.date?.slice(8, 10)}/${item.date?.slice(5, 7)}`,
    hours: +(item.total_seconds / 3600).toFixed(2),
  }));

  if (loading) {
    return <div className="loading-container"><Spinner /></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title gradient-text">Dashboard</h2>
        <div className="dashboard-filters">
          <Select value={filters.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">Todas as categorias</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </Select>
          <Select value={filters.type} onChange={(event) => update('type', event.target.value)}>
            <option value="">Filtros</option>
            <option value="total">Total acumulado</option>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </Select>
          {filters.type && !['total', 'day'].includes(filters.type) ? (
            <Select value={filters.year || year} onChange={(event) => update('year', event.target.value)}>
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          ) : null}
          {['month', 'week'].includes(filters.type) ? (
            <Select value={filters.month || new Date().getMonth() + 1} onChange={(event) => update('month', event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index + 1}>{new Date(2020, index).toLocaleString('pt-BR', { month: 'long' })}</option>
              ))}
            </Select>
          ) : null}
          {filters.type === 'week' ? (
            <Select
              value={filters.week || 1}
              onChange={(event) => update('week', event.target.value)}
            >
              {Array.from({
                length: Math.ceil(new Date(Number(filters.year || year), Number(filters.month || new Date().getMonth() + 1), 0).getDate() / 7),
              }, (_, index) => (
                <option key={index} value={index + 1}>Semana {index + 1}</option>
              ))}
            </Select>
          ) : null}
          {filters.type === 'day' ? <Input type="date" value={filters.day} onChange={(event) => update('day', event.target.value)} /> : null}
        </div>
      </div>

      <div className="summary-cards">
        {filters.type === 'total' ? <StatCard label="Tempo Total Acumulado" value={formatTime(stats?.total_seconds)} className="overall-card" /> : null}
        {categories.map((item, index) => (
          <StatCard key={item.category} label={item.category} value={formatTime(item.total_seconds)} valueStyle={{ color: COLORS[index % COLORS.length] }} />
        ))}
      </div>

      <div className="charts-grid">
        <div className="glass-card chart-card">
          <h3 className="chart-card-title">Proporção por categoria</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} dataKey="total_seconds" nameKey="category" innerRadius={55} outerRadius={90}>
                  {categories.map((item, index) => <Cell key={item.category} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={formatTime} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card chart-card">
          <h3 className="chart-card-title">Horas trabalhadas</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis unit="h" />
                <Tooltip />
                <Area dataKey="hours" stroke="#a3e635" fill="#a3e635" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card chart-card span-2-desktop">
          <h3 className="chart-card-title">Tempo gasto por task</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tasks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task_name" />
                <YAxis unit="h" />
                <Tooltip />
                <Bar dataKey="hours">
                  {tasks.map((item, index) => <Cell key={item.task_name} fill={item.task_color || COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
