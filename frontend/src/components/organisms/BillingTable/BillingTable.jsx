import { useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);

  const [prevListLength, setPrevListLength] = useState(taskTotalsList.length);
  if (taskTotalsList.length !== prevListLength) {
    setPrevListLength(taskTotalsList.length);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(taskTotalsList.length / 5);
  const visibleTotals = taskTotalsList.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <div className="c-billing-card o-card--static u-fade-in">
      <div className="c-billing-card__header">
        <div className="c-billing-card__title-wrap">
          <h3 className="c-billing-card__title">{t("Faturamento & Câmbio de Moedas")}</h3>
        </div>
        <div className="c-billing-card__exchange-wrap">
          <label className="c-billing-card__exchange-label">{t("Mostrar Total em")}</label>
          <CurrencySelect className="font-mono" value={targetCurrency} onChange={(event) => setTargetCurrency(event.target.value)} disabled={exchangeRateLoading} />
          <span className="c-billing-card__exchange-hint">
            {exchangeRateLoading
              ? t('Atualizando cotação...')
              : `${t("Câmbio")}: 1€ = R$ ${exchangeRates.EURBRL.toFixed(2)} · 1US$ = R$ ${exchangeRates.USDBRL.toFixed(2)}`}
          </span>
        </div>
      </div>

      {taskTotalsList.length === 0 ? (
        <div className="c-billing-card__empty">{t("Nenhum registro para calcular valores.")}</div>
      ) : (
        <div className="c-billing-card__content">
          <table className="c-billing-table">
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
              {visibleTotals.map((item, index) => {
                const hours = item.totalSeconds / 3600;
                const earned = hours * item.hourlyRate;
                const totalConverted = convertCurrency(earned, item.currency, targetCurrency, exchangeRates);
                const hasBudget = item.budgetedHours != null;
                const taskProfit = hasBudget ? item.budgetedHours - hours : null;

                return (
                  <tr key={index} className="c-billing-table__row">
                    <td>{t(item.projectName || 'Sem Projeto')}</td>
                    <td>
                      <div className="c-billing-table__task-cell">
                        <span className="o-color-dot" style={{ backgroundColor: item.color }} />
                        <span className="c-billing-table__task-name">{item.name}</span>
                      </div>
                    </td>
                    <td className="font-mono">
                      {hours.toFixed(2)}h
                      <span className="c-billing-table__sec-details"> ({formatDurationShort(item.totalSeconds)})</span>
                    </td>
                    <td className="font-mono">{CURRENCY_SYMBOLS[item.currency]} {item.hourlyRate.toFixed(2)}/h</td>
                    <td className="font-mono" style={{ color: !hasBudget ? 'var(--text-muted)' : (taskProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)') }}>
                      {hasBudget ? `${taskProfit >= 0 ? '+' : ''}${taskProfit.toFixed(2)}h` : '—'}
                    </td>
                    <td className="font-mono c-billing-table__highlight">{CURRENCY_SYMBOLS[targetCurrency]} {totalConverted.toFixed(2)}</td>
                    <td>
                      <button className="c-btn--icon" onClick={() => onEdit?.(item)} title={t("Editar Horas e Valor/Hora")}>
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {totalPages > 1 && (
                <tr className="c-billing-table__pagination-row">
                  <td colSpan={7}>
                    <div className="c-entry-pagination" style={{ marginBlock: '12px' }}>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="c-entry-pagination__btn"
                      >
                        &larr;
                      </button>
                      <span className="c-entry-pagination__info">
                        {t("Tarefas")} {((currentPage - 1) * 5) + 1} - {Math.min(currentPage * 5, taskTotalsList.length)} {t("de")} {taskTotalsList.length}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="c-entry-pagination__btn"
                      >
                        &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              <tr className="c-billing-table__totals-row">
                <td colSpan={5} className="c-billing-table__totals-label">{t("Total Geral")}</td>
                <td className="font-mono c-billing-table__overall-total">{CURRENCY_SYMBOLS[targetCurrency]} {totalInTargetCurrency.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
