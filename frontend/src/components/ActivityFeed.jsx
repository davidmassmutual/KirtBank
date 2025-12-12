// src/components/ActivityFeed.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import '../styles/ActivityFeed.css';
import API_BASE_URL from '../config/api';

export default function ActivityFeed({ userId }) {
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/transactions/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTxns(res.data.slice(0, 3));
      } catch (err) {}
    };
    if (userId) fetch();
  }, [userId]);

  return (
    <div className="activity-feed">
      <h3>Recent Activity</h3>
      {txns.length > 0 ? (
        txns.map(tx => (
          <div key={tx._id} className="activity-item">
            <div className={`icon ${tx.type}`}>
              {tx.type === 'deposit' ? <FaArrowDown /> : <FaArrowUp />}
            </div>
            <div className="details">
              <p>{tx.method || tx.type}</p>
              <span>{new Date(tx.date).toLocaleDateString()}</span>
            </div>
            <div className={`amount ${tx.type}`}>
              {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
            </div>
          </div>
        ))
      ) : (
        <p>No recent transactions.</p>
      )}
    </div>
  );
}