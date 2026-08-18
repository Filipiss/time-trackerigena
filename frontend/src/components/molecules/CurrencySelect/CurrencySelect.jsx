import Select from '../../atoms/Select/Select';
import { CURRENCIES, CURRENCY_SYMBOLS } from '../../../utils/currency';
import './CurrencySelect.css';

export default function CurrencySelect({ className = '', ...props }) {
  return (
    <Select className={`currency-select ${className}`.trim()} {...props}>
      {CURRENCIES.map((currency) => (
        <option key={currency} value={currency}>
          {CURRENCY_SYMBOLS[currency]} {currency}
        </option>
      ))}
    </Select>
  );
}
