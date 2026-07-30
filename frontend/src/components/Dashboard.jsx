import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { fetchStats } from '../api';
import './Dashboard.css';

// Formata segundos em HH:MM
function formatHours(seconds) {
  if (!seconds) return '0h';
  const hours = seconds / 3600;
  if (hours < 0.1) return '0h';
  return `${hours.toFixed(1)}h`;
}

// Formata segundos para exibição detalhada no Tooltip
function formatSecondsDetailed(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(' ');
}

// Formata datas no formato do gráfico (ex: "2026-06-01" -> "01/06")
function formatChartDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export default function Dashboard({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Se não houver dados
  const hasData =
    stats &&
    ((stats.time_by_category && stats.time_by_category.some((c) => c.total_seconds > 0)) ||
      (stats.time_by_task && stats.time_by_task.some((t) => t.total_seconds > 0)));

  if (!hasData) {
    return (
      <div className="dashboard-empty">
        <h2 className="dashboard-title gradient-text">📊 Dashboard</h2>
        <div className="glass-card-static empty-card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="empty-state">
            <span className="empty-state-icon">📊</span>
            <div className="empty-state-title">Sem dados suficientes</div>
            <div className="empty-state-text">
              Gere alguns registros no timer para poder ver estatísticas e gráficos aqui!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico de pizza (Categorias)
  const categoryColors = {
    loco: 'var(--color-loco)',
    freelas: 'var(--color-freelas)',
  };

  const pieData = stats.time_by_category
    .filter((c) => c.total_seconds > 0)
    .map((c) => ({
      name: c.category === 'loco' ? '🏢 Loco' : '💼 Freelas',
      value: c.total_seconds,
      color: categoryColors[c.category] || '#6366f1',
    }));

  // Preparar dados para o gráfico de barras (Tasks)
  const barData = stats.time_by_task.slice(0, 8).map((t) => ({
    name: t.task_name,
    Segundos: t.total_seconds,
    Horas: Number((t.total_seconds / 3600).toFixed(2)),
    color: t.task_color || '#6366f1',
    category: t.category === 'loco' ? 'Loco' : 'Freelas',
  }));

  // Preparar dados para o gráfico de linha (Histórico dos últimos 7 dias)
  const lineData = stats.time_by_day.map((d) => ({
    date: formatChartDate(d.date),
    Segundos: d.total_seconds,
    Horas: Number((d.total_seconds / 3600).toFixed(2)),
  }));

  // Totais rápidos
  const totalSecondsLoco =
    stats.time_by_category.find((c) => c.category === 'loco')?.total_seconds || 0;
  const totalSecondsFreelas =
    stats.time_by_category.find((c) => c.category === 'freelas')?.total_seconds || 0;
  const totalSecondsOverall = totalSecondsLoco + totalSecondsFreelas;

  // Custom tooltip para os gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const val = payload[0].value;
      const isSeconds = typeof val === 'number' && val > 24; // se maior que 24, provavelmente é segundos
      const displayVal = isSeconds ? formatSecondsDetailed(val) : `${val}h`;

      return (
        <div className="custom-tooltip glass-card-static">
          <p className="tooltip-label">{data.name || label}</p>
          <p className="tooltip-value" style={{ color: payload[0].color || '#06b6d4' }}>
            ⏱️ Tempo: {displayVal}
          </p>
          {data.category && (
            <p className="tooltip-sub">
              Categoria: <span className={`badge badge-${data.category.toLowerCase()}`}>{data.category}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title gradient-text">📊 Dashboard</h2>

      {/* Cards de Resumo Rápido */}
      <div className="summary-cards">
        <div className="glass-card summary-card overall-card">
          <div className="card-icon">⚡</div>
          <div className="card-info">
            <div className="card-label">Tempo Total Acumulado</div>
            <div className="card-value font-mono">{formatSecondsDetailed(totalSecondsOverall)}</div>
          </div>
        </div>

        <div className="glass-card summary-card loco-card">
          <div className="card-icon" style={{ color: 'var(--color-loco)' }}>🏢</div>
          <div className="card-info">
            <div className="card-label">Total Loco</div>
            <div className="card-value font-mono" style={{ color: 'var(--color-loco)' }}>
              {formatSecondsDetailed(totalSecondsLoco)}
            </div>
          </div>
        </div>

        <div className="glass-card summary-card freelas-card">
          <div className="card-icon" style={{ color: 'var(--color-freelas)' }}>💼</div>
          <div className="card-info">
            <div className="card-label">Total Freelas</div>
            <div className="card-value font-mono" style={{ color: 'var(--color-freelas)' }}>
              {formatSecondsDetailed(totalSecondsFreelas)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="charts-grid">
        {/* Gráfico 1: Pizza — Divisão por Categoria */}
        {pieData.length > 0 && (
          <div className="glass-card chart-card">
            <h3 className="chart-card-title">🏢 Loco vs 💼 Freelas (Proporção)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico 2: Linha — Evolução dos Últimos 7 Dias */}
        <div className="glass-card chart-card full-width-mobile">
          <h3 className="chart-card-title">📈 Horas Trabalhadas (Últimos 7 dias)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Horas"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Barras — Top Tasks por Tempo */}
        {barData.length > 0 && (
          <div className="glass-card chart-card span-2-desktop">
            <h3 className="chart-card-title">📊 Tempo Gasto por Tarefa (Top Tasks)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} unit="h" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Horas" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
