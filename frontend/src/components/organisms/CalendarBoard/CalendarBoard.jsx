import StatusLegend from '../../molecules/StatusLegend/StatusLegend';
import './CalendarBoard.css';

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarBoard({
  monthDate,
  monthGrid,
  currentMonthIndex,
  todayISO,
  projectsByDate,
  statusConfig,
  weekdayLabels,
  onPrevMonth,
  onNextMonth,
  onToday,
  onCreateDeadline,
  onEditProject,
}) {
  const legendItems = Object.entries(statusConfig).map(([key, config]) => ({ key, ...config }));
  const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-page fade-in">
      <div className="calendar-header">
        <h2 className="calendar-title gradient-text">📅 Calendário de Deadlines</h2>

        <div className="calendar-nav">
          <button className="btn btn-ghost calendar-nav-btn" onClick={onPrevMonth} title="Mês anterior">‹</button>
          <button className="btn btn-ghost calendar-today-btn" onClick={onToday}>Hoje</button>
          <span className="calendar-month-label">{monthLabel}</span>
          <button className="btn btn-ghost calendar-nav-btn" onClick={onNextMonth} title="Próximo mês">›</button>
        </div>
      </div>

      <StatusLegend items={legendItems} />

      <div className="calendar-grid-scroll">
        <div className="calendar-grid glass-card-static">
          <div className="calendar-weekdays">
            {weekdayLabels.map((label) => (
              <div key={label} className="calendar-weekday-cell">{label}</div>
            ))}
          </div>

          <div className="calendar-days">
            {monthGrid.map((cellDate) => {
              const iso = toISODate(cellDate);
              const isCurrentMonth = cellDate.getMonth() === currentMonthIndex;
              const isToday = iso === todayISO;
              const dayProjects = projectsByDate[iso] || [];

              return (
                <div key={iso} className={`calendar-day-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}>
                  <div className="calendar-day-cell-header">
                    <span className="calendar-day-number">{cellDate.getDate()}</span>
                    <button className="calendar-add-btn" onClick={() => onCreateDeadline(iso)} title="Adicionar deadline neste dia">+</button>
                  </div>
                  <div className="calendar-day-projects">
                    {dayProjects.map((project) => {
                      const config = statusConfig[project.status] || statusConfig.em_andamento;
                      return (
                        <button
                          key={project.id}
                          className="calendar-project-chip"
                          style={{ borderLeftColor: config.color, background: `${config.color}22` }}
                          onClick={() => onEditProject(project)}
                          title={project.notes || project.name}
                        >
                          <span className="chip-dot" style={{ backgroundColor: config.color }} />
                          <span className="chip-name truncate">{project.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
