// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AccountSummary from './AccountSummary';
import LoanBanner from '../components/LoanBanner';
import CurrencyConverter from '../components/CurrencyConverter';
import SecurityDisplay from '../components/SecurityDisplay';
import DepositModal from '../components/DepositModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import InvestmentCard from '../components/InvestmentCard';
import QuickStats from '../components/QuickStats';
import ActivityFeed from '../components/ActivityFeed';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';
import { useDeposit } from '../context/DepositContext';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaChartLine, FaExchangeAlt, FaCreditCard, FaBell } from 'react-icons/fa';
import '../styles/Dashboard.css';
import API_BASE_URL from '../config/api';

// Add a component to display profile image in dashboard
const ProfileImageDisplay = ({ user }) => {
  if (!user?.profileImage || user.profileImage === '/uploads/undefined' || user.profileImage === '/uploads/null') {
    return (
      <div className="dashboard-profile-placeholder">
        <FaBell />
      </div>
    );
  }

  return (
    <img
      src={`${API_BASE_URL}${user.profileImage}`}
      alt="Profile"
      className="dashboard-profile-image"
      onError={(e) => {
        e.target.style.display = 'none';
        const placeholder = e.target.nextElementSibling;
        if (placeholder) placeholder.style.display = 'flex';
      }}
    />
  );
};

function Dashboard() {
  const { user, loading, fetchUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const { openDepositModal, isModalOpen, closeDepositModal } = useDeposit();

  if (loading) return <LoadingSkeleton />;
  
  // Add safety check for user data - redirect to login if not authenticated
  if (!user) {
    // If no user data and not loading, redirect to login
    window.location.href = '/';
    return null;
  }

  return (
    <div className="dashboard">
      {/* MOBILE BRAND */}
      <div className="navbar-brand-mobile">
        <h1>Kirt Bank <img src={img9} alt="Kirt Bank" className="brand-logo" /></h1>
        <p>Strength. Security. Stability.</p>
      </div>

      {/* NOTIFICATIONS BELL */}
      <div className="notifications-bell">
        <button onClick={() => setShowNotifications(!showNotifications)} className="bell-icon">
          <FaBell />
          {user?.notifications?.length > 0 && (
            <span className="notification-badge">{user.notifications.length}</span>
          )}
        </button>

        {showNotifications && (
          <div className="notifications-panel glass">
            <h3>Notifications</h3>
            {user.notifications?.length > 0 ? (
              user.notifications
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent
                .slice(0, 2) // Show latest 2 notifications
                .map((n, i) => (
                  <div key={i} className="notif-item">
                    <p>{n.message}</p>
                    <span>{new Date(n.date).toLocaleString()}</span>
                  </div>
                ))
            ) : (
              <p>No notifications yet.</p>
            )}
            <Link to="/notifications" onClick={() => setShowNotifications(false)} className="view-all">
              View All
            </Link>
          </div>
        )}
      </div>



      {/* KYC STATUS */}
      {user?.kycStatus === 'verified' ? (
        <div className="kyc-verified">
          <p><span className="verified-badge">✓ VERIFIED</span> Your KYC has been verified</p>
        </div>
      ) : user?.kycStatus === 'submitted' ? (
        <div className="kyc-pending">
          <p><span className="pending-badge">⏳ PENDING</span> KYC under review</p>
        </div>
      ) : user?.kycStatus === 'rejected' ? (
        <div className="kyc-rejected">
          <p><span className="rejected-badge">✗ REJECTED</span> Your KYC was rejected. <Link to="/kyc">Please resubmit</Link></p>
        </div>
      ) : (
        <div className="kyc-warning">
          <p>KYC Pending — Upload ID to <Link to="/kyc">Complete KYC</Link> </p>
        </div>
      )}

      {/* PROFILE IMAGE DISPLAY */}
      <div className="welcome-section">
        <ProfileImageDisplay user={user} />
        <h1>Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
      </div>

     

      {/* ACCOUNT SUMMARY */}
      <div className="account-summary-wrapper">
        <AccountSummary />
      </div>

      {/* ACTION BUTTONS – 2×2 MOBILE, 4×1 DESKTOP */}
      <div className="action-grid">
        <button onClick={openDepositModal} className="action-card">
          <FaPlus className="icon" />
          <span>Deposit</span>
        </button>
        <Link to="/transfer" className="action-card">
          <FaExchangeAlt className="icon" />
          <span>Transfer</span>
        </Link>
        <Link to="/investment" className="action-card">
          <FaChartLine className="icon" />
          <span>Invest</span>
        </Link>
        <Link to="/cards" className="action-card">
          <FaCreditCard className="icon" />
          <span>Card</span>
        </Link>
      </div>

      {/* LOAN BANNER */}
      <div className="loan-banner-wrapper">
        <LoanBanner />
      </div>
<div className="feature-card glass">
          <InvestmentCard />
        </div>
      {/* QUICK STATS */}
      <div className="quick-stats-wrapper">
        <QuickStats balance={user?.balance} />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="activity-feed-wrapper">
        <ActivityFeed userId={user?._id} />
        <div className="view-all-activity">
          <Link to="/transactions" className="view-all-btn">
            View All Activity
          </Link>
        </div>
      </div>

      {/* SECONDARY FEATURES */}
      <div className="secondary-features-grid">
        <div className="feature-card glass">
          <CurrencyConverter />
        </div>
        <div className="feature-card glass">
          <SecurityDisplay 
            lastLogin={user?.lastLogin} 
            twoFactorEnabled={user?.twoFactorEnabled} 
          />
        </div>
      </div>

      {/* MODAL */}
      <DepositModal isOpen={isModalOpen} onClose={closeDepositModal} />
    </div>
  );
}

export default Dashboard;
