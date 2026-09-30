
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

export async function fetchExchangeRates() {
  const res = await fetch('https://economia.awesomeapi.com.br/last/EUR-BRL,USD-BRL');
  const data = await res.json();
  return {
    EURBRL: parseFloat(data?.EURBRL?.ask) || 6.25,
    USDBRL: parseFloat(data?.USDBRL?.ask) || 5.4,
  };
}

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
