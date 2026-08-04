import CurrencySelect from '../../molecules/CurrencySelect/CurrencySelect';
import { CURRENCY_SYMBOLS } from '../../../utils/currency';
import './BillingTable.css';

export default function BillingTable({
  taskTotalsList,
  targetCurrency,
  setTargetCurrency,
  exchangeRates,
  exchangeRateLoading,
  totalInTargetCurrency,
  formatDurationShort,
  convertCurrency,
}) {
  return (
    <div className="values-section-card glass-card-static fade-in">
      <div className="values-section-header">
        <div className="values-header-title-wrapper">
          <h3 className="values-header-title">Faturamento & Câmbio de Moedas</h3>
        </div>
        <div className="exchange-rate-input-wrapper">
          <label className="exchange-label">Mostrar Total em</label>
          <CurrencySelect className="font-mono" value={targetCurrency} onChange={(event) => setTargetCurrency(event.target.value)} disabled={exchangeRateLoading} />
          <span className="exchange-rate-hint">
            {exchangeRateLoading
              ? 'Atualizando cotação...'
              : `Câmbio: 1€ = R$ ${exchangeRates.EURBRL.toFixed(2)} · 1US$ = R$ ${exchangeRates.USDBRL.toFixed(2)}`}
          </span>
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
                <th>Valor/Hora</th>
                <th>Lucro da Task</th>
                <th>Total ({targetCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {taskTotalsList.map((item, index) => {
                const hours = item.totalSeconds / 3600;
                const earned = hours * item.hourlyRate;
                const totalConverted = convertCurrency(earned, item.currency, targetCurrency, exchangeRates);
                const hasBudget = item.budgetedHours != null;
                const taskProfit = hasBudget ? item.budgetedHours - hours : null;

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
                    <td className="font-mono">{CURRENCY_SYMBOLS[item.currency]} {item.hourlyRate.toFixed(2)}/h</td>
                    <td className="font-mono" style={{ color: !hasBudget ? 'var(--text-muted)' : (taskProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)') }}>
                      {hasBudget ? `${taskProfit >= 0 ? '+' : ''}${taskProfit.toFixed(2)}h` : '—'}
                    </td>
                    <td className="font-mono value-eur-highlight">{CURRENCY_SYMBOLS[targetCurrency]} {totalConverted.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="values-totals-row">
                <td colSpan={5} className="totals-label-cell">Total Geral</td>
                <td className="font-mono overall-eur-total">{CURRENCY_SYMBOLS[targetCurrency]} {totalInTargetCurrency.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
