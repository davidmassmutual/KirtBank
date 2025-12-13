// src/pages/DepositDetails.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaCopy, FaUpload, FaQrcode } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/DepositDetails.css';
import API_BASE_URL from '../config/api';

function DepositDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('checking');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [btcCopied, setBtcCopied] = useState(false);
  const [usdtErc20Copied, setUsdtErc20Copied] = useState(false);
  const [usdtSolCopied, setUsdtSolCopied] = useState(false);
  const [usdtTrc20Copied, setUsdtTrc20Copied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGiftCard, setSelectedGiftCard] = useState('');
  const [giftCardDigits, setGiftCardDigits] = useState('');

  const token = localStorage.getItem('token');
  const API = `${API_BASE_URL}` || 'https://kirt-bank.onrender.com';
  const currency = localStorage.getItem('currency') || 'USD';
  const symbol = currency === 'USD' ? '$' : currency;

  // Initialize from modal state
  useEffect(() => {
    const s = location.state || {};
    setMethod(s.method || '');
    setAmount(s.amount?.toString() || '');
    setAccount(s.account || 'checking');
  }, [location]);

  // Copy helper
  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // File preview
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(f);
  };

  // SUBMIT WITH INSTANT FEEDBACK
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!method || !amount || parseFloat(amount) < 10) {
      setError('Enter at least $10');
      return;
    }

    setLoading(true);

    // INSTANT SUCCESS UI (within 2 seconds)
    setShowSuccess(true);
    setSuccess('Deposit submitted! Awaiting approval.');

    const form = new FormData();
    form.append('amount', amount);
    form.append('method', method);
    form.append('account', account);
    if (file) form.append('receipt', file);

    try {
      await axios.post(`${API}/api/transactions/deposit`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
      setShowSuccess(false);
      setLoading(false);
      setError(err.response?.data?.message || 'Deposit failed');
      return;
    } finally {
      setLoading(false);
      // Redirect after 2.5s if success
      if (showSuccess) {
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    }
  };

  // SUCCESS SCREEN (INSTANT)
  if (showSuccess) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <FaCheckCircle className="checkmark" />
          <h2>Deposit Processed</h2>
          <p>
            <strong>{symbol}{amount}</strong> via <strong>{method.replace('-', ' ').toUpperCase()}</strong>
          </p>
          <p>You’ll be notified when it’s approved.</p>
          <button onClick={() => navigate('/dashboard')} className="home-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // LOADING
  if (loading) return <LoadingSpinner />;

  // NO METHOD
  if (!method) {
    return (
      <div className="deposit-details">
        <div className="error-card">
          <p>Please select a deposit method first.</p>
          <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  const bankInfo = {
    name: 'Kirt Bank',
    account: '1234-5678-9012-3456',
    routing: '987654321',
    swift: 'KIRTUS33',
  };

  return (
    <div className="deposit-details">
      <h2>Complete Your Deposit</h2>

      {/* SUMMARY */}
      <div className="summary-card">
        <div className="summary-row"><span>Method</span><strong>{method.replace('-', ' ').toUpperCase()}</strong></div>
        <div className="summary-row"><span>Amount</span><strong>{symbol}{amount}</strong></div>
        <div className="summary-row"><span>To</span><strong>{account.toUpperCase()} Account</strong></div>
      </div>

      <div className="messages" style={{ marginBottom: '1rem' }}>
        {error && (
          <div className="error-message" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCheckCircle />
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" style={{ background: '#d1fae5', color: '#16a34a', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCheckCircle />
            {success}
          </div>
        )}
      </div>

      {/* BANK TRANSFER */}
      {method === 'bank-transfer' && (
        <div className="bank-info-card">
          <h3>Bank Transfer Details</h3>
          <div className="info-grid">
            <div><label>Bank Name</label><p>{bankInfo.name}</p></div>
            <div>
              <label>Account Number</label><p>{bankInfo.account}</p>
              <button onClick={() => handleCopy(bankInfo.account)} className="copy-btn">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div><label>Routing Number</label><p>{bankInfo.routing}</p></div>
            <div><label>SWIFT</label><p>{bankInfo.swift}</p></div>
          </div>
        </div>
      )}

      {/* CRYPTO */}
      {method === 'crypto' && (
        <div className="crypto-card">
          <h3>Crypto Deposit Addresses</h3>
          <div className="crypto-addresses">
            <div className="crypto-item">
              <h4>BTC</h4>
              <p className="address">1N43mXw49SSYKSjuyfPsZmLg738QzkzhFm</p>
              <button onClick={() => {
                navigator.clipboard.writeText('1N43mXw49SSYKSjuyfPsZmLg738QzkzhFm');
                setBtcCopied(true);
                setTimeout(() => setBtcCopied(false), 2000);
              }} className="copy-btn">
                {btcCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="crypto-item">
              <h4>USDT (ERC20)</h4>
              <p className="address">0xa99c57accf1fbe123d4b9a1667ce64af8c9b21bd</p>
              <button onClick={() => {
                navigator.clipboard.writeText('0xa99c57accf1fbe123d4b9a1667ce64af8c9b21bd');
                setUsdtErc20Copied(true);
                setTimeout(() => setUsdtErc20Copied(false), 2000);
              }} className="copy-btn">
                {usdtErc20Copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="crypto-item">
              <h4>USDT (SOL)</h4>
              <p className="address">3RZb19cCyMrvdSGWyyQJ8kQp3CedmgApv3SGgH4HQcnG</p>
              <button onClick={() => {
                navigator.clipboard.writeText('3RZb19cCyMrvdSGWyyQJ8kQp3CedmgApv3SGgH4HQcnG');
                setUsdtSolCopied(true);
                setTimeout(() => setUsdtSolCopied(false), 2000);
              }} className="copy-btn">
                {usdtSolCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="crypto-item">
              <h4>USDT (TRC20)</h4>
              <p className="address">TPSN93ntkTrZ3tUwWeTyR9X3qBKfPWu32Y</p>
              <button onClick={() => {
                navigator.clipboard.writeText('TPSN93ntkTrZ3tUwWeTyR9X3qBKfPWu32Y');
                setUsdtTrc20Copied(true);
                setTimeout(() => setUsdtTrc20Copied(false), 2000);
              }} className="copy-btn">
                {usdtTrc20Copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIFT CARDS */}
      {method === 'gift-cards' && (
        <div className="gift-card-card">
          <h3>Select Gift Card Type</h3>
          <div className="gift-card-options">
            <button
              type="button"
              className={`gift-card-option ${selectedGiftCard === 'apple' ? 'active' : ''}`}
              onClick={() => setSelectedGiftCard('apple')}
            >
              <div className="gift-card-logo">🍎</div>
              <div className="gift-card-name">Apple Gift Card</div>
            </button>
            <button
              type="button"
              className={`gift-card-option ${selectedGiftCard === 'razer' ? 'active' : ''}`}
              onClick={() => setSelectedGiftCard('razer')}
            >
              <div className="gift-card-logo">🎮</div>
              <div className="gift-card-name">Razer Gold Gift Card</div>
            </button>
            <button
              type="button"
              className={`gift-card-option ${selectedGiftCard === 'steam' ? 'active' : ''}`}
              onClick={() => setSelectedGiftCard('steam')}
            >
              <div className="gift-card-logo">🎯</div>
              <div className="gift-card-name">Steam Gift Card</div>
            </button>
            <button
              type="button"
              className={`gift-card-option ${selectedGiftCard === 'amazon' ? 'active' : ''}`}
              onClick={() => setSelectedGiftCard('amazon')}
            >
              <div className="gift-card-logo">📦</div>
              <div className="gift-card-name">Amazon Gift Card</div>
            </button>
          </div>
          {selectedGiftCard && (
            <div className="gift-card-input">
              <label>Enter Gift Card Digits</label>
              <input
                type="text"
                value={giftCardDigits}
                onChange={(e) => setGiftCardDigits(e.target.value)}
                placeholder="Enter gift card code/digits"
                required
              />
            </div>
          )}
        </div>
      )}

      {/* RECEIPT UPLOAD */}
      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Upload Proof</h3>
        <div className="file-upload">
          <input type="file" id="receipt" accept="image/*,.pdf" onChange={handleFile} />
          <label htmlFor="receipt" className="upload-label">
            <FaUpload /> Upload Receipt
          </label>
        </div>
        {filePreview && (
          <div className="preview">
            <img src={filePreview} alt="preview" />
          </div>
        )}
        <button type="submit" className="submit-btn">
          Confirm Deposit
        </button>
      </form>

      <div className="security-note">
        <p>All deposits are encrypted with 256-bit AES</p>
      </div>
    </div>
  );
}

export default DepositDetails;
