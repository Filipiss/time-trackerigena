import CurrencySelect from '../../molecules/CurrencySelect/CurrencySelect';
import { CURRENCY_SYMBOLS } from '../../../utils/currency';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Pencil } from 'lucide-react';
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
  onEdit,
}) {
  const { t } = useLanguage();

  return (
    <div className="values-section-card o-card--static u-fade-in">
      <div className="values-section-header">
        <div className="values-header-title-wrapper">
          <h3 className="values-header-title">{t("Faturamento & Câmbio de Moedas")}</h3>
        </div>
        <div className="exchange-rate-input-wrapper">
          <label className="exchange-label">{t("Mostrar Total em")}</label>
          <CurrencySelect className="font-mono" value={targetCurrency} onChange={(event) => setTargetCurrency(event.target.value)} disabled={exchangeRateLoading} />
          <span className="exchange-rate-hint">
            {exchangeRateLoading
              ? t('Atualizando cotação...')
              : `${t("Câmbio")}: 1€ = R$ ${exchangeRates.EURBRL.toFixed(2)} · 1US$ = R$ ${exchangeRates.USDBRL.toFixed(2)}`}
          </span>
        </div>
      </div>

      {taskTotalsList.length === 0 ? (
        <div className="no-values-message">{t("Nenhum registro para calcular valores.")}</div>
      ) : (
        <div className="values-content">
          <table className="values-table">
            <thead>
              <tr>
                <th>{t("Projeto")}</th>
                <th>{t("Tarefa")}</th>
                <th>{t("Horas Trabalhadas")}</th>
                <th>{t("Valor/Hora")}</th>
                <th>{t("Saldo da Tarefa")}</th>
                <th>{t("Total")} ({targetCurrency})</th>
                <th>{t("Ações")}</th>
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
                    <td>{t(item.projectName || 'Sem Projeto')}</td>
                    <td>
                      <div className="task-cell">
                        <span className="o-color-dot" style={{ backgroundColor: item.color }} />
                        <span className="task-name-text">{item.name}</span>
                      </div>
                    </td>
                    <td className="font-mono">
                      {hours.toFixed(2)}h
                      <span className="values-sec-details"> ({formatDurationShort(item.totalSeconds)})</span>
                    </td>
                    <td className="font-mono">{CURRENCY_SYMBOLS[item.currency]} {item.hourlyRate.toFixed(2)}/h</td>
                    <td className="font-mono" style={{ color: !hasBudget ? 'var(--text-muted)' : (taskProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)') }}>
                      {hasBudget ? `${taskProfit >= 0 ? '+' : ''}${taskProfit.toFixed(2)}h` : '—'}
                    </td>
                    <td className="font-mono value-eur-highlight">{CURRENCY_SYMBOLS[targetCurrency]} {totalConverted.toFixed(2)}</td>
                    <td>
                      <button className="c-btn--icon" onClick={() => onEdit?.(item)} title={t("Editar Horas e Valor/Hora")}>
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="values-totals-row">
                <td colSpan={5} className="totals-label-cell">{t("Total Geral")}</td>
                <td className="font-mono overall-eur-total">{CURRENCY_SYMBOLS[targetCurrency]} {totalInTargetCurrency.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
