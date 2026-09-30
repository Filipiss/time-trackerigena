import StatusLegend from '../../molecules/StatusLegend/StatusLegend';
import { useLanguage } from '../../../contexts/LanguageContext';
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
  eventsByDate,
  statusConfig,
  weekdayLabels,
  onPrevMonth,
  onNextMonth,
  onToday,
  onCreateDeadline,
  onEditEvent,
}) {
  const { t, language } = useLanguage();
  const legendItems = Object.entries(statusConfig).map(([key, config]) => ({ key, ...config }));
  const monthLocale = language === 'en' ? 'en-US' : 'pt-BR';
  const monthLabel = monthDate.toLocaleDateString(monthLocale, { month: 'long', year: 'numeric' });

  return (
    <div className="c-calendar u-fade-in">
      <div className="c-calendar__header">
        <h2 className="c-calendar__title u-gradient-text">📅 {t("Calendário de Compromissos")}</h2>

        <div className="c-calendar__nav">
          <button className="c-btn c-btn--ghost c-calendar__nav-btn" onClick={onPrevMonth} title={t("Mês anterior")}>‹</button>
          <button className="c-btn c-btn--ghost c-calendar__today-btn" onClick={onToday}>{t("Hoje")}</button>
          <span className="c-calendar__month-label">{monthLabel}</span>
          <button className="c-btn c-btn--ghost c-calendar__nav-btn" onClick={onNextMonth} title={t("Próximo mês")}>›</button>
        </div>
      </div>

      <StatusLegend items={legendItems} />

      <div className="c-calendar__scroll">
        <div className="c-calendar__grid o-card--static">
          <div className="c-calendar__weekdays">
            {weekdayLabels.map((label) => (
              <div key={label} className="c-calendar__weekday-cell">{label}</div>
            ))}
          </div>

          <div className="c-calendar__days">
            {monthGrid.map((cellDate) => {
              const iso = toISODate(cellDate);
              const isCurrentMonth = cellDate.getMonth() === currentMonthIndex;
              const isToday = iso === todayISO;
              const dayEvents = eventsByDate[iso] || [];

              return (
                <div key={iso} className={`c-calendar__day-cell ${isCurrentMonth ? '' : 'is-other-month'} ${isToday ? 'is-today' : ''}`}>
                  <div className="c-calendar__day-header">
                    <span className="c-calendar__day-number">{cellDate.getDate()}</span>
                    <button className="c-calendar__add-btn" onClick={() => onCreateDeadline(iso)} title={t("Adicionar status/compromisso neste dia")}>+</button>
                  </div>
                  <div className="c-calendar__project-list">
                    {dayEvents.map((event) => {
                      const config = statusConfig[event.status] || statusConfig.em_andamento;
                      return (
                        <button
                          key={`${event.eventType}-${event.id}`}
                          className="c-calendar__chip"
                          style={{ borderLeftColor: config.color, background: `${config.color}22` }}
                          onClick={() => onEditEvent(event)}
                          title={`${event.eventType.toUpperCase()}: ${event.notes || event.name}`}
                        >
                          <span className="c-calendar__chip-dot" style={{ backgroundColor: config.color }} />
                          <span className="c-calendar__chip-name u-truncate">{event.name}</span>
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
