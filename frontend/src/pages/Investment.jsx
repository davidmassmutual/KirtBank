// src/pages/Investments.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import '../styles/Investment.css'; // Updated CSS file

export default function Investments() {
  const [plans, setPlans] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [userBalance, setUserBalance] = useState({ checking: 0, savings: 0, usdt: 0 });
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalAvailable = Object.values(userBalance).reduce((a, b) => a + b, 0);

  useEffect(() => {
    // Fetch investment plans
    axios.get(`${API_BASE_URL}/api/investments/plans`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setPlans(res.data);
        } else {
          console.error('Expected array for plans:', res.data);
          setPlans([]);
        }
      })
      .catch(err => {
        console.error('Failed to load plans:', err.response || err);
        setPlans([]);
      });

    // Fetch user data
    if (token) {
      axios.get(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('User data received:', res.data);
          setUserInvestments(res.data.investments || []);
          setUserBalance(res.data.balance || { checking: 0, savings: 0, usdt: 0 });
        })
        .catch(err => {
          console.error('Failed to load user data:', err.response || err);
        });
    }
  }, [token]);

  const handleInvest = (plan) => {
    navigate('/invest', { state: { plan } });
  };

  const handleBreakInvestment = async (investment) => {
    // Create a custom confirmation modal instead of browser confirm
    const customConfirm = document.createElement('div');
    customConfirm.className = 'custom-confirm-modal';
    customConfirm.innerHTML = `
      <div class="custom-confirm-overlay">
        <div class="custom-confirm-content">
          <h3>Break Investment</h3>
          <p>Are you sure you want to break this investment? You will receive the full amount back to your checking account.</p>
          <div class="custom-confirm-buttons">
            <button class="custom-confirm-btn custom-confirm-cancel">Cancel</button>
            <button class="custom-confirm-btn custom-confirm-confirm">Yes, Break Investment</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(customConfirm);
    
    return new Promise((resolve) => {
      const cancelBtn = customConfirm.querySelector('.custom-confirm-cancel');
      const confirmBtn = customConfirm.querySelector('.custom-confirm-confirm');
      
      const closeModal = () => {
        if (customConfirm.parentNode) {
          customConfirm.parentNode.removeChild(customConfirm);
        }
      };
      
      cancelBtn.addEventListener('click', () => {
        closeModal();
        resolve(false);
      });
      
      confirmBtn.addEventListener('click', () => {
        closeModal();
        resolve(true);
      });
    }).then(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        // Use POST instead of GET for the break investment endpoint
        await axios.post(
          `${API_BASE_URL}/api/investments/break/${investment._id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        // Show success message directly on the card
        investment.breakSuccess = 'Investment broken successfully!';
        investment.breakError = '';
        setUserInvestments([...userInvestments]);
        
        // Refresh user data to update balance and investments
        if (token) {
          axios.get(`${API_BASE_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => {
              setUserInvestments(res.data.investments || []);
              setUserBalance(res.data.balance || { checking: 0, savings: 0, usdt: 0 });
            })
            .catch(err => {
              console.error('Failed to refresh user data:', err.response || err);
            });
        }
      } catch (error) {
        // Show error message directly on the card
        const errorMessage = error.response?.status === 400 
          ? 'You need at least $10,000 in your savings account to break an investment'
          : error.response?.data?.message || 'Failed to break investment';
        
        investment.breakError = errorMessage;
        investment.breakSuccess = '';
        setUserInvestments([...userInvestments]);
        
        // If it's the $10k savings requirement error, redirect to deposit modal after 5 seconds
        if (error.response?.status === 400) {
          setTimeout(() => {
            // Trigger deposit modal by dispatching a custom event
            window.dispatchEvent(new CustomEvent('openDepositModal'));
          }, 5000);
        }
      }
    });
  };

  return (
    <div className="investments-page">
      <div className="investments-container">

        {/* INVESTMENT HERO SECTION */}
        <div className="investment-heroes">
          <h1 className="hero-title">Grow Your Wealth</h1>
          <p className="hero-subtitle">Secure fixed-term investments with up to 50% ROI</p>
        </div>

        {/* SUMMARY CARDS - Only if user has investments */}
        {userInvestments.length > 0 && (
          <div className="summary-grid">
            <div className="summary-card glass">
              <p className="summary-label">Total Invested</p>
              <p className="summary-value">${totalInvested.toLocaleString()}</p>
            </div>
            <div className="summary-card glass">
              <p className="summary-label">Active Plans</p>
              <p className="summary-value">{userInvestments.length}</p>
            </div>
            <div className="summary-card glass">
              <p className="summary-label">Available Balance</p>
              <p className="summary-value">${totalAvailable.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* ACTIVE INVESTMENTS */}
        {userInvestments.length > 0 && (
          <div className="active-section">
            <h2 className="section-title">Your Active Investments</h2>
            
            <div className="active-grid">
              {userInvestments.map((inv, i) => {
                const profit = (inv.amount * inv.rate).toFixed(2);
                const maturityDate = new Date(inv.maturityDate);
                const startDate = inv.startDate ? new Date(inv.startDate) : new Date(); // fallback
                const progress = Math.min(100, ((Date.now() - startDate.getTime()) / (maturityDate.getTime() - startDate.getTime())) * 100 || 0);

                return (
                  <div key={i} className="active-card glass">
                    <div className="active-header">
                      <h4 className="active-plan">{inv.plan.toUpperCase()} PLAN</h4>
                      <span className="active-status">Active</span>
                    </div>
                    <p className="active-maturity">Matures on {maturityDate.toLocaleDateString()}</p>

                    <div className="active-progress-container">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="active-amounts">
                      <div>
                        <p className="amount-label">Principal</p>
                        <p className="amount-value">${inv.amount.toLocaleString()}</p>
                      </div>
                      <div className="profit-section">
                        <p className="amount-label">Expected Profit</p>
                        <p className="amount-profit">+${profit}</p>
                      </div>
                    </div>

                    {/* Break Investment Button */}
                    <div className="break-investment-section">
                      <button 
                        onClick={() => handleBreakInvestment(inv)}
                        className="break-investment-btn"
                      >
                        Break Investment
                      </button>
                      
                      {/* Inline Notifications for this specific investment */}
                      {inv.breakError && (
                        <div className="inline-error-notification">
                          {inv.breakError}
                        </div>
                      )}
                      {inv.breakSuccess && (
                        <div className="inline-success-notification">
                          {inv.breakSuccess}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INVESTMENT PLANS */}
        <div className="plans-section">
          <h2 className="section-title">Choose an Investment Plan</h2>
          <div className="plans-grid">
            {plans.length === 0 ? (
              <p className="loading-text">Loading investment plans...</p>
            ) : (
              plans.map(plan => (
                <div key={plan.name} className="plan-card glass">
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-roi">{Math.ceil(plan.rate * 100 * 1.8)}%</div>
                    <span className="roi-label">ROI</span>
                  </div>
                  <div className="plan-body">
                    <p className="plan-term">{plan.term}</p>
                    <p className="plan-range">${plan.min.toLocaleString()} – ${plan.max.toLocaleString()}</p>
                    <button onClick={() => handleInvest(plan)} className="invest-btn">
                      Invest Now →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
