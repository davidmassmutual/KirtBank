import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaWallet, FaUniversity, FaCoins } from 'react-icons/fa';
import '../styles/AccountSummary.css';
import API_BASE_URL from '../config/api';


function AccountSummary() {
  const [balances, setBalances] = useState({ checking: 0, savings: 0, usdt: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { balance } = res.data;
      setBalances({
        checking: balance?.checking || 0,
        savings: balance?.savings || 0,
        usdt: balance?.usdt || 0,
      });
    } catch (err) {
      toast.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="account-summary">
      <h2>
        <FaWallet /> Account Summary
      </h2>
      <div className="balance-cards">
        <div className="balance-card">
          <FaUniversity />
          <h4>Checking</h4>
          <p>${Number(balances.checking).toLocaleString()}</p>
        </div>
        <div className="balance-card">
          <FaCoins />
          <h4>Savings</h4>
          <p>${Number(balances.savings).toLocaleString()}</p>
        </div>
        <div className="balance-card">
          <FaCoins />
          <h4>USDT</h4>
          <p>{Number(balances.usdt).toLocaleString()} USDT</p>
        </div>
      </div>
    </div>
  );
}

export default AccountSummary;