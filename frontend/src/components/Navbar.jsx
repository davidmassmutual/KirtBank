// src/components/Navbar.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaWallet, FaExchangeAlt, FaCreditCard, FaHistory, FaBell,
         FaHandHoldingUsd, FaHeadset, FaCog, FaSignOutAlt, FaBars, FaTimes, FaUserTie, FaChartBar} from 'react-icons/fa';
import { useDeposit } from '../context/DepositContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';
import API_BASE_URL from '../config/api';

function Navbar({ handleLogout, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { openDepositModal } = useDeposit();
  const { user, fetchUser } = useAuth();
  const navbarRef = useRef(null);

  if (!isAuthenticated) return null;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMenuOpen]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/account-summary', label: 'Account Summary', icon: <FaWallet /> },
    { path: '#', label: 'Deposit', icon: <FaExchangeAlt />, onClick: openDepositModal },
    { path: '/loans', label: 'Loan', icon: <FaHandHoldingUsd /> },
    { path: '/investment', label: 'Investment', icon: <FaChartBar/> },
    { path: '/cards', label: 'Cards', icon: <FaCreditCard /> },
    { path: '/transactions', label: 'Transactions', icon: <FaHistory /> },
    { path: '/notifications', label: 'Notifications', icon: <FaBell /> },
    { path: '/profile', label: 'Profile', icon: <FaUserTie /> },
    { path: '/support', label: 'Support', icon: <FaHeadset /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <>
      <button className="hamburger" onClick={toggleMenu}>
        <FaBars />
      </button>
      <nav ref={navbarRef} className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <div className="navbar-brand">
          <div className="brand-header">
            <h1>Kirt Bank <img src={img9} alt="" className='navbar-brand-image' /></h1>
            <div className="welcome-section">
              {user?.profileImage ? (
                <img
                  src={`${API_BASE_URL}${user.profileImage}`}
                  alt="Profile"
                  className="navbar-profile-image"
                />
              ) : (
                <div className="navbar-profile-placeholder">
                  <FaUserTie />
                </div>
              )}
              <span className="welcome-text">
                Welcome, {user?.name?.split(' ')[0] || 'User'}
              </span>
            </div>
          </div>
          <p>Strength. Security. Stability.</p>
          <button className="close-menu" onClick={toggleMenu}>
            <FaTimes />
          </button>
        </div>
        <ul className="navbar-menu">
          {navItems.map((item) => (
            <li key={item.label}>
              {item.onClick ? (
                <button
                  onClick={() => {
                    item.onClick();
                    setIsMenuOpen(false);
                  }}
                  className={location.pathname === '/deposit-details' ? 'active' : ''}
                >
                  {item.icon} {item.label}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon} {item.label}
                </Link>
              )}
            </li>
          ))}
          <li>
            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
