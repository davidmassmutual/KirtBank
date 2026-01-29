// src/components/QuickStats.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/QuickStats.css';
import API_BASE_URL from '../config/api';

export default function QuickStats({ balance }) {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvestments(res.data.investments || []);
      } catch (err) {
        console.error('Failed to fetch investments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const total = (balance?.checking || 0) + (balance?.savings || 0) + (balance?.usdt || 0) + totalInvestments;

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
      <div className="stat">
        <span>Investments</span>
        <strong>${totalInvestments.toLocaleString()}</strong>
      </div>
    </div>
  );
}
