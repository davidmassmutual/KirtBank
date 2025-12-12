// src/pages/InvestNow.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DepositModal from '../components/DepositModal';
import '../styles/InvestNow.css';
import API_BASE_URL from '../config/api';

export default function InvestNow() {
  const location = useLocation();
  const plan = location.state?.plan;
  const [amount, setAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [insufficientMessage, setInsufficientMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, fetchUser } = useAuth();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="investnow-container text-center p-12">
        <p className="text-xl text-secondary">Invalid investment plan.</p>
        <button onClick={() => navigate('/investments')} className="mt-4 underline text-gold">
          ← Back to Plans
        </button>
      </div>
    );
  }

  const amountNum = Number(amount) || 0;
  const isValid = amountNum >= plan.min && amountNum <= plan.max;
  const profit = isValid ? (amountNum * plan.rate).toFixed(2) : '0.00';
  const totalReturn = isValid ? (amountNum + parseFloat(profit)).toFixed(2) : '0.00';

  const handleInvest = async () => {
    if (!isValid) return;
    setError('');
    setSuccess('');

    const authToken = localStorage.getItem('token');
    if (!authToken) {
      setError('Please log in to make an investment.');
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/investments/invest`,
        { plan: plan.name.toLowerCase(), amount: amountNum },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      await fetchUser();
      setSuccess('Investment successful! Your funds are now growing.');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsDeposit) {
        // SHOW NOTIFICATION + OPEN DEPOSIT MODAL
        setInsufficientMessage(`You need $${data.required.toLocaleString()} more to complete this investment.`);
        setShowDeposit(true);
      } else {
        setError(data?.message || 'Investment failed. Please try again.');
      }
    }
  };

  return (
    <div className="investnow-container">
      <div className="investnow-card">
        {/* HEADER */}
        <div className="investnow-header">
          <div className="header-left">
            <h1 className="plan-title">{plan.name} Plan</h1>
            <p className="plan-subtitle">Secure, high-yield investment</p>
          </div>
          <div className="plan-badge">
            <span className="badge-text">{(plan.rate * 100).toFixed(0)}% ROI</span>
            <span className="badge-term">• {plan.term}</span>
          </div>
        </div>

        {/* INSUFFICIENT BALANCE NOTIFICATION */}
        {insufficientMessage && (
          <div className="insufficient-alert">
            <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="alert-text">{insufficientMessage}</p>
            <button onClick={() => setShowDeposit(true)} className="alert-btn">
              Deposit Now
            </button>
          </div>
        )}

        <div className="messages" style={{ marginBottom: '1rem' }}>
          {error && (
            <div className="error-message" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" style={{ background: '#d1fae5', color: '#16a34a', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {success}
            </div>
          )}
        </div>

        {/* FORM */}
        <div className="invest-form">
          <div className="amount-section">
            <label className="input-label">Investment Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: $${plan.min.toLocaleString()}`}
                className="amount-input"
              />
            </div>
            <div className="input-hint">
              <span>Max: ${plan.max.toLocaleString()}</span>
            </div>
          </div>

          {/* PROFIT CALCULATOR */}
          {isValid && (
            <div className="profit-calculator">
              <div className="calc-row">
                <span className="calc-label">Principal</span>
                <span className="calc-value">${amountNum.toLocaleString()}</span>
              </div>
              <div className="calc-row text-gold">
                <span className="calc-label">Expected Profit</span>
                <span className="calc-value">+${profit}</span>
              </div>
              <div className="calc-row total-return">
                <span className="calc-label">Total at Maturity</span>
                <span className="calc-value">${totalReturn}</span>
              </div>
              <div className="calc-footer">
                After <strong>{plan.term}</strong> • Locked until maturity
              </div>
            </div>
          )}

          {/* CONFIRM BUTTON */}
          <button
            onClick={handleInvest}
            disabled={!isValid}
            className={`confirm-btn ${isValid ? 'active' : ''}`}
          >
            {isValid ? (
              <>
                <span>Confirm Investment</span>
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            ) : (
              'Enter Valid Amount'
            )}
          </button>

          {/* TERMS */}
          <div className="terms-note">
            <p>
              By confirming, you agree to lock your funds for the full term. 
              Early withdrawal may incur penalties.
            </p>
          </div>
        </div>
      </div>

      {/* DEPOSIT MODAL */}
      {showDeposit && (
        <DepositModal 
          onClose={() => {
            setShowDeposit(false);
            setInsufficientMessage('');
          }}
          requiredAmount={amountNum}
        />
      )}
    </div>
  );
}
