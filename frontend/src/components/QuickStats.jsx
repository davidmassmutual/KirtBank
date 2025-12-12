// src/components/QuickStats.jsx
import '../styles/QuickStats.css';

export default function QuickStats({ balance }) {
  const total = (balance?.checking || 0) + (balance?.savings || 0) + (balance?.usdt || 0);
  return (
    <div className="quick-stats">
      <div className="stat">
        <span>Total Balance</span>
        <strong>${total.toLocaleString()}</strong>
      </div>
      <div className="stat">
        <span>Available</span>
        <strong>${(balance?.checking || 0).toLocaleString()}</strong>
      </div>
      <div className="stat">
        <span>Savings</span>
        <strong>${(balance?.savings || 0).toLocaleString()}</strong>
      </div>
    </div>
  );
}