import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../styles/CurrencyConverter.css';
import API_BASE_URL from '../config/api';

function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // More comprehensive currency list
  const currencies = useMemo(() => [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  ], []);

  const convert = async () => {
    if (!amount || !fromCurrency || !toCurrency) {
      setError('Please fill in all fields');
      return;
    }

    if (fromCurrency === toCurrency) {
      setError('Please select different currencies');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Using exchangerate-api.com for free tier, you can change to another API
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const rates = res.data.rates;

      const rate = rates[toCurrency];
      const convertedAmount = (parseFloat(amount) * rate).toFixed(2);

      setResult(convertedAmount);
      setConversion({
        from: currencies.find(c => c.code === fromCurrency),
        to: currencies.find(c => c.code === toCurrency),
        amount: parseFloat(amount),
        convertedAmount: parseFloat(convertedAmount),
        rate: rate.toFixed(4),
        date: new Date().toLocaleString()
      });
    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error('Currency conversion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    if (result) {
      setAmount(result);
      setResult(null);
    }
  };

  useEffect(() => {
    // Convert automatically when amount or currencies change
    if (amount && fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      const timeoutId = setTimeout(() => {
        convert();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="currency-converter">
      <h3><i className="fas fa-exchange-alt"></i> Currency Converter</h3>

      {error && <div className="converter-error">{error}</div>}

      <div className="converter-inputs">
        <div className="input-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="currency-selectors">
          <div className="currency-input">
            <label>From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <button className="swap-currencies" onClick={swapCurrencies} title="Swap currencies">
            ⇄
          </button>

          <div className="currency-input">
            <label>To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {conversion && (
          <div className="conversion-result">
            <div className="result-amount">
              {conversion.from.symbol}{conversion.amount.toLocaleString()} {conversion.from.code} =
              <strong> {conversion.to.symbol}{conversion.convertedAmount.toLocaleString()} {conversion.to.code}</strong>
            </div>
            <div className="conversion-rate">
              1 {conversion.from.code} = {conversion.rate} {conversion.to.code}
            </div>
            <div className="conversion-date">
              Last updated: {conversion.date}
            </div>
          </div>
        )}

        {loading && (
          <div className="converter-loading">
            <i className="fas fa-spinner fa-spin"></i> Converting...
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrencyConverter;
