import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/TransferPayment.css';
import API_BASE_URL from '../config/api';

function TransferPayment() {
  const [form, setForm] = useState({
    type: 'send',
    name: '',
    accountNumber: '',
    routing: '',
    amount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountVerified, setAccountVerified] = useState(false);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(null);

  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear verification when account/routing changes
    if (e.target.name === 'accountNumber' || e.target.name === 'routing') {
      setAccountVerified(false);
      setAccountName('');
      setError('');
    }
  };

  const verifyAccount = async () => {
    if (!form.accountNumber || !form.routing) {
      toast.error('Please enter both account number and routing number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Simulate account verification API call
      const res = await axios.post(`${API_BASE_URL}/api/transfer/verify-account`, {
        accountNumber: form.accountNumber,
        routingNumber: form.routing
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAccountName(res.data.accountName || 'John Doe');
      setAccountVerified(true);
      toast.success('Account verified successfully');
    } catch (err) {
      console.error('Account verification error:', err);
      setError(err.response?.data?.message || 'Account verification failed');
      toast.error('Account verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accountVerified) {
      toast.error('Please verify the account first');
      return;
    }
    
    if (form.name !== accountName) {
      setError('Account name different from name registered');
      toast.error('Account name different from name registered');
      return;
    }

    if (!form.amount || form.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      const transferData = {
        type: 'send',
        amount: Number(form.amount),
        notes: form.notes,
        recipientName: form.name,
        accountNumber: form.accountNumber,
        routingNumber: form.routing,
      };

      const res = await axios.post(`${API_BASE_URL}/api/transfer`, transferData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Transfer successful!');
      setForm({
        type: 'send',
        name: '',
        accountNumber: '',
        routing: '',
        amount: '',
        notes: '',
      });
      setAccountVerified(false);
      setAccountName('');
      setError('');
    } catch (err) {
      console.error('Transfer error:', err);
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
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

          <div className="form-group">
            <button 
              type="button" 
              onClick={verifyAccount}
              disabled={loading || !form.accountNumber || !form.routing}
              className="verify-btn"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
            
            {accountVerified && accountName && (
              <div className="account-info">
                <span className="verified-text">✓ Account verified</span>
                <span className="account-name">Account Name: {accountName}</span>
              </div>
            )}
          </div>

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
              disabled={loading || !accountVerified || form.name !== accountName}
              className="submit-btn"
            >
              <i className="fas fa-paper-plane"></i> {loading ? 'Processing...' : 'Transfer Money'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferPayment;
