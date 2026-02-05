import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaBitcoin, FaCopy, FaCheck, FaQrcode, FaArrowRight } from 'react-icons/fa';
import '../styles/Crypto.css';

const Crypto = () => {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 10) {
      toast.error('Please enter a valid amount (minimum $10)');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Deposit request submitted successfully');
      setAmount('');
    } catch (err) {
      toast.error('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crypto-page">
      <div className="crypto-container">
        <div className="crypto-header">
          <h1>Crypto Deposits</h1>
          <p>Deposit funds using cryptocurrency</p>
        </div>

        <div className="crypto-content">
          <div className="crypto-details">
            <div className="crypto-address">
              <h3>Bitcoin Address</h3>
              <div className="address-display">
                <code>{bitcoinAddress}</code>
                <button 
                  type="button" 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={() => handleCopy(bitcoinAddress)}
                >
                  {copied ? <FaCheck /> : 'Copy'}
                </button>
              </div>
            </div>

            <div className="crypto-qr">
              <h3>Scan QR Code</h3>
              <div className="qr-container">
                <img 
                  src="/images/photo_2026-01-29 18.26.16.jpeg" 
                  alt="Bitcoin QR Code" 
                  className="qr-code"
                  onError={(e) => {
                    console.log('QR code image failed to load:', e.target.src);
                    // If the image fails to load, create a simple QR code representation
                    e.target.style.display = 'none';
                    const container = e.target.parentElement;
                    const fallback = document.createElement('div');
                    fallback.className = 'qr-fallback';
                    fallback.innerHTML = `
                      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">₿</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 15px;">Bitcoin QR Code</div>
                        <div style="font-family: monospace; font-size: 11px; background: white; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                          ${bitcoinAddress}
                        </div>
                      </div>
                    `;
                    container.appendChild(fallback);
                  }}
                />
              </div>
            </div>

            <div className="crypto-form">
              <h3>Deposit Amount</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Amount (USD)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="10"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="deposit-btn"
                  >
                    {loading ? 'Processing...' : <>Submit Deposit <FaArrowRight /></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crypto;
