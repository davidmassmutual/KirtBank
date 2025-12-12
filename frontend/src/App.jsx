// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AccountSummary from './pages/AccountSummary';
import Transactions from './pages/Transactions';
import Loans from './pages/Loans';
import Support from './pages/Support';
import Settings from './pages/Settings';
import TransferPayment from './pages/TransferPayment';
import VirtualCards from './pages/VirtualCards';
import NotificationsPage from './pages/NotificationsPage';
import DepositDetails from './pages/DepositDetails';
import AdminLogin from './pages/AdminLogin';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import NotFound from './pages/NotFound';
import LoadingSkeleton from './components/LoadingSkeleton';
import { DepositProvider } from './context/DepositContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Profile from './pages/Profile';
import Investment from './pages/Investment';
import InvestNow from './pages/InvestNow';
import KYC from './pages/KYC';
import API_BASE_URL from './config/api';

// Lazy load heavy admin page
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

let idleTimer;

function AppContent() {
  const { user, token, loading, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const isAuthenticated = !!user && !!token;

  const resetIdleTimer = () => {
    setLastActivity(Date.now());
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      handleLogout();
    }, 60 * 60 * 1000); // 1 hour idle timeout
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('tokenExpiry');
    setIsAdmin(false);
    clearTimeout(idleTimer);
    window.location.href = '/';
  };

  // Enhanced token validation with refresh logic
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const tokenExpiry = localStorage.getItem('tokenExpiry');

      if (token) {
        // Check if token is expired
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          console.log('Token expired, logging out');
          handleLogout();
          return;
        }

        try {
          const res = await axios.get(`${API_BASE_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Authentication state updated via AuthContext
          const adminStatus = res.data.isAdmin || false;
          setIsAdmin(adminStatus);
          localStorage.setItem('isAdmin', adminStatus.toString());

          // Set token expiry to 24 hours from now
          const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
          localStorage.setItem('tokenExpiry', expiryTime.toString());

        } catch (err) {
          console.error('Token validation failed:', err);
          // Try to refresh token if it's a 401 error
          if (err.response?.status === 401) {
            handleLogout();
          }
        }
      }
    };

    validateToken();

    // Set up periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(validateToken, 5 * 60 * 1000);

    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Idle timeout
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();
      return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        clearTimeout(idleTimer);
      };
    }
  }, [isAuthenticated]);

  // Determine if Navbar should be shown
  const showNavbar = () => {
    const path = window.location.pathname;
    return isAuthenticated && path !== '/' && !path.startsWith('/admin');
  };

  return (
    <div className="app" onMouseMove={resetIdleTimer} onKeyDown={resetIdleTimer}>
      <ScrollToTop />

      {/* CONDITIONAL NAVBAR */}
      {showNavbar() && <Navbar handleLogout={handleLogout} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />}

      <div className="main-content">
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminLogin />} />

          {/* PROTECTED USER PAGES */}
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/account-summary" element={isAuthenticated ? <AccountSummary /> : <Navigate to="/" />} />
          <Route path="/transfer" element={isAuthenticated ? <TransferPayment /> : <Navigate to="/" />} />
          <Route path="/cards" element={isAuthenticated ? <VirtualCards /> : <Navigate to="/" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/" />} />
          <Route path="/notifications" element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/" />} />
          <Route path="/loans" element={isAuthenticated ? <Loans /> : <Navigate to="/" />} />
          <Route path="/support" element={isAuthenticated ? <Support /> : <Navigate to="/" />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" />} />
          <Route path="/deposit-details" element={isAuthenticated ? <DepositDetails /> : <Navigate to="/" />} />
          <Route path="/investment" element={isAuthenticated ? <Investment/> : <Navigate to="/" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile/> : <Navigate to="/" />} />
          <Route path="/invest" element={isAuthenticated ? <InvestNow/> : <Navigate to="/" />} />
          <Route path="/kyc" element={isAuthenticated ? <KYC /> : <Navigate to="/" />} />


          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin/dashboard"
            element={
              isAuthenticated && isAdmin ? (
                <Suspense fallback={<LoadingSkeleton />}>
                  <AdminDashboard />
                </Suspense>
              ) : (
                <Navigate to="/admin" />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* FOOTER */}
      <Footer />

      {/* TOAST */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DepositProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </DepositProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
