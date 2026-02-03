// src/components/DepositModal.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaCopy, FaCheck, FaQrcode, FaUniversity, FaBitcoin, FaArrowRight } from 'react-icons/fa';
import '../styles/DepositModal.css';

const DepositModal = ({ isOpen, onClose }) => {
  const [depositMethod, setDepositMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [methodError, setMethodError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const amountInputRef = useRef(null);
  const navigate = useNavigate();

  const currency = localStorage.getItem('currency') || 'USD';
  const symbol = currency === 'USD' ? '$' : currency;

  useEffect(() => {
    if (isOpen && depositMethod) {
      setTimeout(() => amountInputRef.current?.focus(), 300);
    }
  }, [depositMethod, isOpen]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let hasErrors = false;

    // Check if deposit method is selected
    if (!depositMethod) {
      setMethodError(true);
      hasErrors = true;
    } else {
      setMethodError(false);
    }

    // Check if amount is valid
    if (!amount || parseFloat(amount) < 10) {
      setAmountError(true);
      hasErrors = true;
    } else {
      setAmountError(false);
    }

    // If there are errors, prevent submission (inline errors are already shown)
    if (hasErrors) {
      return;
    }

    setLoading(true);
    
    // If crypto is selected, redirect to crypto page
    if (depositMethod === 'crypto') {
      setTimeout(() => {
        navigate('/crypto', {
          state: { amount: parseFloat(amount), account, currency }
        });
        onClose();
        setLoading(false);
        setSuccess(false);
        setAmount('');
        setDepositMethod('');
        setMethodError(false);
        setAmountError(false);
      }, 600);
    } else {
      // For bank transfer (disabled), show message
      setTimeout(() => {
        alert('Bank transfer is not available at the moment. Please use Crypto option.');
        setLoading(false);
        setSuccess(false);
        setAmount('');
        setDepositMethod('');
        setMethodError(false);
        setAmountError(false);
      }, 600);
    }
  };

  const methods = [
    { value: 'bank', label: 'Bank Transfer (Not Available)', icon: <FaUniversity />, color: '#666', disabled: true },
    { value: 'crypto', label: 'Crypto', icon: <FaBitcoin />, color: '#f7931a' },
  ];

  if (success) {
    return (
      <div className="deposit-modal-overlay">
        <div className="deposit-modal success-mode">
          <div className="success-check"><FaCheck size={60} /></div>
          <h2>Ready!</h2>
          <p>Redirecting...</p>
          <div className="loader-bar"><div className="progress"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="deposit-modal-overlay" onClick={onClose}>
      <div className="deposit-modal glass" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>

        <div className="modal-header">
          <h2>Deposit Funds</h2>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="method-grid">
            {methods.map(m => (
              <button
                key={m.value}
                type="button"
                className={`method-btn ${depositMethod === m.value ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (m.disabled) {
                    alert('Not available at the moment. Contact support for assistance.');
                    return;
                  }
                  setDepositMethod(m.value);
                  // Clear method error when user selects a method
                  if (methodError) setMethodError(false);
                }}
                style={{ '--method-color': m.color }}
                disabled={m.disabled}
              >
                <span className="method-icon">{m.icon}</span>
                <span className="method-label">{m.label}</span>
              </button>
            ))}
          </div>

          {methodError && (
            <div className="method-error">
              Please select a deposit method to continue.
            </div>
          )}

          <div className="form-group">
            <label>Amount</label>
              <div className="amount-input-wrapper">
              <input
                ref={amountInputRef}
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  // Clear amount error when user starts typing
                  if (amountError) setAmountError(false);
                }}
                placeholder={`${symbol}10.00`}
                min="10"
                step="0.01"
                required
                className={amountError ? 'error' : ''}
              />
            </div>
            {amountError && (
              <div className="field-error">
                Please enter a valid amount (minimum $10).
              </div>
            )}
          </div>

          <div className="form-group">
            <label>To</label>
            <select value={account} onChange={e => setAccount(e.target.value)}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="usdt">USDT</option>
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              disabled={loading || !depositMethod || !amount || parseFloat(amount) < 10}
              className="proceed-btn"
            >
              {loading ? 'Processing...' : <>Proceed <FaArrowRight /></>}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;