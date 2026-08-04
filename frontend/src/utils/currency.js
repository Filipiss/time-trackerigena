// Utilitário de moedas — símbolos, cotações e conversão

export const CURRENCIES = ['EUR', 'USD', 'BRL'];

export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  BRL: 'R$',
};

export const CURRENCY_LABELS = {
  EUR: 'Euro (€)',
  USD: 'Dólar (US$)',
  BRL: 'Real (R$)',
};

/**
 * Busca as cotações atuais (EUR-BRL e USD-BRL) na AwesomeAPI.
 * Retorna um objeto { EURBRL, USDBRL } com os valores em BRL.
 */
export async function fetchExchangeRates() {
  const res = await fetch('https://economia.awesomeapi.com.br/last/EUR-BRL,USD-BRL');
  const data = await res.json();
  return {
    EURBRL: parseFloat(data?.EURBRL?.ask) || 6.25,
    USDBRL: parseFloat(data?.USDBRL?.ask) || 5.4,
  };
}

/**
 * Converte um valor de uma moeda para outra usando o Real (BRL) como moeda-ponte.
 * `rates` deve conter { EURBRL, USDBRL } (quantos BRL vale 1 EUR / 1 USD).
 */
export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (!amount || fromCurrency === toCurrency) return amount || 0;

  const toBRL = (value, currency) => {
    if (currency === 'BRL') return value;
    if (currency === 'EUR') return value * (rates.EURBRL || 0);
    if (currency === 'USD') return value * (rates.USDBRL || 0);
    return value;
  };

  const fromBRLTo = (valueInBRL, currency) => {
    if (currency === 'BRL') return valueInBRL;
    if (currency === 'EUR') return valueInBRL / (rates.EURBRL || 1);
    if (currency === 'USD') return valueInBRL / (rates.USDBRL || 1);
    return valueInBRL;
  };

  const amountInBRL = toBRL(amount, fromCurrency);
  return fromBRLTo(amountInBRL, toCurrency);
}
