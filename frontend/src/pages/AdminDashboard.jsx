// src/pages/AdminDashboard.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  FaSearch, FaEdit, FaTrash, FaEye, FaFileCsv, FaCheck, FaTimes,
  FaHistory, FaPlus, FaBell, FaUserShield, FaSync
} from 'react-icons/fa';
import '../styles/AdminDashboard.css';
import API_BASE_URL from '../config/api';

// Deposit alert sound
const depositSound = new Audio('/sounds/deposit.mp3');

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkBalance, setBulkBalance] = useState({ checking: '', savings: '', usdt: '' });
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [editBal, setEditBal] = useState(null);
  const [editTxUser, setEditTxUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ type: '', amount: '', method: '', status: 'Completed', account: 'checking', date: '' });
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [userDocuments, setUserDocuments] = useState(null);
  const [userNotifications, setUserNotifications] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLoanInfo, setShowLoanInfo] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const pollRef = useRef(null);
  const prevPendingCount = useRef(0);

  const API = `${API_BASE_URL}` || 'http://localhost:5000';

  // FETCH USERS
  const fetchUsers = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/user/search?q=${q}&page=${p}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setPage(res.data.pagination?.page || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, API]);

  // FETCH NOTIFICATIONS
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminNotifs(res.data.slice(0, 8));
    } catch (err) {
      console.error('Notif fetch error:', err);
    }
  }, [token, API]);

  // FETCH PENDING DEPOSITS
  const fetchPendingDeposits = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/transactions/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pending = (res.data || [])
        .filter(tx => tx.status === 'Pending' && tx.type === 'deposit')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setPendingDeposits(pending);

      if (pending.length > prevPendingCount.current && pending.length > 0) {
        const latest = pending[0];
        const msg = `New deposit: $${latest.amount.toLocaleString()} from ${latest.userId?.name || 'User'}`;
        setPopupMsg(msg);
        setShowPopup(true);
        depositSound.play().catch(() => {});
        setTimeout(() => setShowPopup(false), 6000);
      }
      prevPendingCount.current = pending.length;
    } catch (err) {
      console.error('Pending deposits error:', err);
    }
  }, [token, API]);

  // FETCH PENDING KYC
  const fetchPendingKYC = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/user/kyc-pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch pending KYC requests:', err);
      return [];
    }
  }, [token, API]);

  const fetchPendingKYCData = useCallback(async () => {
    try {
      const kycData = await fetchPendingKYC();
      setPendingKYC(kycData);
    } catch (err) {
      console.error('Failed to fetch pending KYC:', err);
    }
  }, [fetchPendingKYC]);

  // OPTIMIZED POLLING FOR FREE TIER
  useEffect(() => {
    // Initial fetch
    fetchPendingDeposits();
    fetchPendingKYCData();
    fetchNotifs();
    
    // Free tier optimized intervals - longer delays to reduce API calls
    const depositPoll = setInterval(fetchPendingDeposits, 30000); // 30 seconds instead of 5 seconds
    const kycPoll = setInterval(fetchPendingKYCData, 60000); // 1 minute instead of 10 seconds
    const notifPoll = setInterval(fetchNotifs, 60000); // 1 minute instead of 10 seconds

    return () => {
      clearInterval(depositPoll);
      clearInterval(kycPoll);
      clearInterval(notifPoll);
    };
  }, [fetchPendingDeposits, fetchPendingKYCData, fetchNotifs]);

  // CONFIRM / REJECT DEPOSIT
  const handleDepositAction = async (txId, action) => {
    try {
      const res = await axios.put(
        `${API}/api/transactions/admin/${txId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Deposit ${action}ed successfully!`);

      setPendingDeposits(prev => prev.filter(tx => tx._id !== txId));

      if (res.data.user) {
        setUsers(prev => prev.map(u =>
          u._id === res.data.user._id
            ? { ...u, balance: res.data.user.balance }
            : u
        ));
      }

      // Refresh data after action
      fetchNotifs();
      fetchUsers(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} deposit`);
      console.error(err);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    if (!token || localStorage.getItem('isAdmin') !== 'true') {
      toast.error('Admin access required');
      navigate('/admin');
      return;
    }
    fetchUsers();
    fetchNotifs();
  }, [fetchUsers, fetchNotifs, token, navigate]);

  // SEARCH
  const handleSearch = () => {
    setPage(1);
    fetchUsers(search, 1);
  };

  // BULK ACTIONS
  const handleBulk = async () => {
    if (!bulkAction || selected.length === 0) {
      toast.error('Select users and action');
      return;
    }

    try {
      const payload = { action: bulkAction, userIds: selected };
      if (bulkAction === 'updateBalance') {
        payload.data = {
          balance: {
            checking: Number(bulkBalance.checking) || 0,
            savings: Number(bulkBalance.savings) || 0,
            usdt: Number(bulkBalance.usdt) || 0,
          },
        };
      }

      await axios.post(`${API}/api/user/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Bulk action completed');
      setSelected([]);
      setBulkAction('');
      setBulkBalance({ checking: '', savings: '', usdt: '' });
      fetchUsers(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    }
  };

  // EDIT BALANCE
  const openBalanceEdit = (user) => {
    setEditBal({
      userId: user._id,
      name: user.name,
      email: user.email,
      checking: user.balance?.checking || 0,
      savings: user.balance?.savings || 0,
      usdt: user.balance?.usdt || 0,
    });
  };

  // EDIT INVESTMENT BALANCE
  const openInvestmentEdit = (user) => {
    const totalInvestments = user.investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    setEditBal({
      userId: user._id,
      name: user.name,
      email: user.email,
      investments: totalInvestments,
      type: 'investment'
    });
  };

  // EDIT MEMBER JOIN DATE
  const openJoinDateEdit = (user) => {
    setEditBal({
      userId: user._id,
      name: user.name,
      email: user.email,
      joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
      type: 'joinDate'
    });
  };

  const submitBalance = async (e) => {
    e.preventDefault();
    try {
      if (editBal.type === 'investment') {
        // Update investment balance
        const res = await axios.put(
          `${API}/api/user/${editBal.userId}/investments`,
          {
            amount: Number(editBal.investments)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(prev => prev.map(u =>
          u._id === editBal.userId
            ? { ...u, investments: res.data.investments }
            : u
        ));

        toast.success('Investment balance updated successfully');
      } else if (editBal.type === 'joinDate') {
        // Update member join date
        const res = await axios.put(
          `${API}/api/user/${editBal.userId}/join-date`,
          {
            joinDate: editBal.joinDate
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(prev => prev.map(u =>
          u._id === editBal.userId
            ? { ...u, createdAt: res.data.createdAt }
            : u
        ));

        toast.success('Member since date updated successfully');
      } else {
        // Update regular balances
        const res = await axios.put(
          `${API}/api/user/${editBal.userId}/balances`,
          {
            checkingBalance: Number(editBal.checking),
            savingsBalance: Number(editBal.savings),
            usdtBalance: Number(editBal.usdt),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(prev => prev.map(u =>
          u._id === editBal.userId
            ? { ...u, balance: res.data.balance }
            : u
        ));

        toast.success('Balance updated successfully');
      }
      
      setEditBal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update balance');
      console.error(err);
    }
  };

  // TRANSACTIONS MODAL
  const openTx = async (user) => {
    setEditTxUser(user._id);
    try {
      const res = await axios.get(`${API}/api/transactions/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  };

  const addTx = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API}/api/transactions/user/${editTxUser}`,
        { ...newTx, amount: Number(newTx.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(prev => [...prev, res.data]);
      setNewTx({ type: '', amount: '', method: '', status: 'Completed', account: 'checking', date: '' });
      toast.success('Transaction added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  const deleteTx = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await axios.delete(`${API}/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(prev => prev.filter(t => t._id !== id));
      toast.success('Transaction deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // CSV DATA
  const csvData = useMemo(() => users.map(u => ({
    Name: u.name,
    Email: u.email,
    Checking: u.balance?.checking || 0,
    Savings: u.balance?.savings || 0,
    USDT: u.balance?.usdt || 0,
    Joined: new Date(u.createdAt).toLocaleDateString(),
  })), [users]);

  // SELECT ALL
  const toggleSelectAll = () => {
    setSelected(prev => prev.length === users.length ? [] : users.map(u => u._id));
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // VIEW USER DOCUMENTS
  const viewDocuments = async (user) => {
    try {
      const res = await axios.get(`${API}/api/loans/admin/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDocuments({...res.data, _id: user._id}); // Include user ID for KYC actions
    } catch (err) {
      toast.error('Failed to load user documents');
      console.error(err);
    }
  };

  // FETCH ALL KYC STATUS
  const fetchAllKYC = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/user/kyc-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch all KYC status:', err);
      return [];
    }
  }, [token, API]);

  // HANDLE KYC APPROVAL/REJECTION
  const handleKYCAction = async (userId, action) => {
    try {
      const res = await axios.put(
        `${API}/api/user/${userId}/kyc-approve`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`KYC ${action}d successfully`);

      // Update user in table
      setUsers(prev => prev.map(u =>
        u._id === userId
          ? { ...u, kycStatus: res.data.kycStatus }
          : u
      ));

      // Update documents modal if open
      if (userDocuments && userDocuments._id === userId) {
        setUserDocuments(prev => ({ ...prev, kycStatus: res.data.kycStatus }));
      }

      // Refresh notifications
      fetchNotifs();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} KYC`);
      console.error(err);
    }
  };

  // VIEW USER NOTIFICATIONS
  const viewNotifications = async (user) => {
    try {
      const res = await axios.get(`${API}/api/user/${user._id}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserNotifications({user, notifications: res.data});
    } catch (err) {
      toast.error('Failed to load user notifications');
      console.error(err);
    }
  };

  // ADD USER NOTIFICATION
  const addUserNotification = async (userId, message, type) => {
    try {
      const res = await axios.post(`${API}/api/user/${userId}/notifications`, {
        message,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification added successfully');
      if (userNotifications && userNotifications.user._id === userId) {
        setUserNotifications(prev => ({
          ...prev,
          notifications: [...prev.notifications, res.data.notification]
        }));
      }
      fetchUsers(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add notification');
      console.error(err);
    }
  };

  // EDIT USER NOTIFICATION
  const editUserNotification = async (userId, notificationId, updates) => {
    try {
      const res = await axios.put(`${API}/api/user/${userId}/notifications/${notificationId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification updated successfully');
      if (userNotifications && userNotifications.user._id === userId) {
        setUserNotifications(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n._id === notificationId ? res.data.notification : n
          )
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notification');
      console.error(err);
    }
  };

  // DELETE USER NOTIFICATION
  const deleteUserNotification = async (userId, notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${API}/api/user/${userId}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification deleted successfully');
      if (userNotifications && userNotifications.user._id === userId) {
        setUserNotifications(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n._id !== notificationId)
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
      console.error(err);
    }
  };

  // MARK ALL NOTIFICATIONS AS READ
  const markAllNotificationsAsRead = async (userId) => {
    try {
      await axios.put(`${API}/api/user/${userId}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All notifications marked as read');
      if (userNotifications && userNotifications.user._id === userId) {
        setUserNotifications(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true }))
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark notifications as read');
      console.error(err);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="admin-dashboard-fullscreen">

      {/* REAL-TIME POPUP */}
      {showPopup && (
        <div className="deposit-popup">
          <FaBell className="pulse" /> {popupMsg}
        </div>
      )}

      {/* PENDING DEPOSITS - MOVED TO TOP */}
      {pendingDeposits.length > 0 && (
        <div className="pending-deposits-card">
          <h3><FaUserShield /> Pending Deposits ({pendingDeposits.length})</h3>
          <div className="deposit-list">
            {pendingDeposits.map(tx => (
              <div key={tx._id} className="deposit-item">
                <div>
                  <strong>{tx.userId?.name || 'Unknown'}</strong> • ${tx.amount.toLocaleString()} • {tx.method}
                  {tx.receipt && (
                    <a href={`${API}${tx.receipt}`} target="_blank" rel="noopener noreferrer">
                      View Receipt
                    </a>
                  )}
                </div>
                <div className="deposit-actions">
                  <button onClick={() => handleDepositAction(tx._id, 'confirm')} className="confirm-btn">
                    Confirm
                  </button>
                  <button onClick={() => handleDepositAction(tx._id, 'reject')} className="reject-btn">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING KYC REQUESTS */}
      {pendingKYC.length > 0 && (
        <div className="pending-kyc-card">
          <h3><FaUserShield /> Pending KYC Requests ({pendingKYC.length})</h3>
          <div className="kyc-list">
            {pendingKYC.map(user => (
              <div key={user._id} className="kyc-item">
                <div className="kyc-user-info">
                  <div className="kyc-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="kyc-details">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <span className="kyc-date">Submitted: {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="kyc-actions">
                  <button onClick={() => viewDocuments(user)} className="kyc-view-btn">
                    View Documents
                  </button>
                  <button onClick={() => handleKYCAction(user._id, 'approve')} className="kyc-approve-btn">
                    Approve
                  </button>
                  <button onClick={() => handleKYCAction(user._id, 'reject')} className="kyc-reject-btn">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="admin-header">
        <h1><FaUserShield /> Admin Dashboard</h1>
        <div className="header-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => {
              fetchUsers(search, page);
              fetchNotifs();
              fetchPendingDeposits();
              toast.success('Data refreshed!');
            }}
            className="refresh-btn"
            title="Refresh Data"
          >
            <FaSync /> Refresh
          </button>
          <CSVLink data={csvData} filename="kirtbank-users.csv" className="export-btn">
            <FaFileCsv /> Export CSV
          </CSVLink>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="admin-main-content">
        {/* LEFT PANEL - USER LIST */}
        <div className="user-list-panel">
          <h3>All Users ({users.length})</h3>
          <div className="user-emails-list">
            {users.map(u => (
              <div
                key={u._id}
                className={`user-email-item ${selectedUser?._id === u._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="user-email">{u.email}</div>
                <div className="user-name-small">{u.name}</div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button onClick={() => fetchUsers(search, page - 1)} disabled={page === 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => fetchUsers(search, page + 1)} disabled={page === totalPages}>Next</button>
          </div>
        </div>

        {/* RIGHT PANEL - USER DETAILS */}
        <div className="user-details-panel">
          {selectedUser ? (
            <div className="user-details">
              <div className="user-header">
                <div className="user-avatar">{selectedUser.name.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  <p className="user-joined">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="user-balance">
                <h4>Account Balances</h4>
                <div className="balance-grid">
                  <div className="balance-item">
                    <span className="balance-label">Checking:</span>
                    <span className="balance-amount">${(selectedUser.balance?.checking || 0).toLocaleString()}</span>
                  </div>
                  <div className="balance-item">
                    <span className="balance-label">Savings:</span>
                    <span className="balance-amount">${(selectedUser.balance?.savings || 0).toLocaleString()}</span>
                  </div>
                  <div className="balance-item">
                    <span className="balance-label">USDT:</span>
                    <span className="balance-amount">${(selectedUser.balance?.usdt || 0).toLocaleString()}</span>
                  </div>
                  <div className="balance-item">
                    <span className="balance-label">Investments:</span>
                    <span className="balance-amount">${(selectedUser.investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {showLoanInfo && (
                <div className="user-loan-info">
                  <h4>Loan Information</h4>
                  <div className="loan-info-grid">
                    <div className="loan-info-item">
                      <span className="loan-label">Loan Status:</span>
                      <span className={`loan-status ${selectedUser.hasReceivedLoan ? 'received' : 'none'}`}>
                        {selectedUser.hasReceivedLoan ? 'Active Loan' : 'No Loan'}
                      </span>
                    </div>
                    {selectedUser.hasReceivedLoan && (
                      <>
                        <div className="loan-info-item">
                          <span className="loan-label">Loan Amount:</span>
                          <span className="loan-amount">${(selectedUser.currentLoanAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="loan-info-item">
                          <span className="loan-label">Loan Start:</span>
                          <span className="loan-date">
                            {selectedUser.loanStartDate ? new Date(selectedUser.loanStartDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="loan-info-item">
                          <span className="loan-label">Repayment Due:</span>
                          <span className="loan-date">
                            {selectedUser.loanRepaymentDate ? new Date(selectedUser.loanRepaymentDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedUser.loanOffer && !selectedUser.hasReceivedLoan && (
                      <div className="loan-info-item">
                        <span className="loan-label">Loan Offer:</span>
                        <span className="loan-offer">${(selectedUser.loanOffer || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="user-actions">
                <h4>Actions</h4>
                <div className="action-buttons-grid">
                  <button onClick={() => openBalanceEdit(selectedUser)} className="action-btn edit-balance">
                    Edit Balance
                  </button>
                  <button onClick={() => openInvestmentEdit(selectedUser)} className="action-btn edit-investment">
                    Edit Investment Balance
                  </button>
                  <button onClick={() => openTx(selectedUser)} className="action-btn view-transactions">
                    View Transactions
                  </button>
                  <button onClick={() => viewDocuments(selectedUser)} className="action-btn view-documents">
                    View Documents
                  </button>
                  <button 
                    onClick={() => handleKYCAction(selectedUser._id, 'approve')} 
                    className="action-btn kyc-verify-btn"
                    disabled={selectedUser.kycStatus === 'verified'}
                  >
                    {selectedUser.kycStatus === 'verified' ? 'KYC Verified ✓' : 'Verify KYC'}
                  </button>
                  <button onClick={() => viewNotifications(selectedUser)} className="action-btn view-notifications">
                    View Notifications
                  </button>
                  <button onClick={() => setShowLoanInfo(!showLoanInfo)} className="action-btn manage-loans">
                    {showLoanInfo ? 'Hide Loan Info' : 'Manage Loans'}
                  </button>
                  <button onClick={() => openJoinDateEdit(selectedUser)} className="action-btn edit-join-date">
                    Edit Member Since
                  </button>
                  <button onClick={() => {
                    // Placeholder for remove transactions action
                    toast.info('Remove transactions feature coming soon');
                  }} className="action-btn remove-transactions">
                    Remove Transactions
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-user-selected">
              <div className="no-selection-icon">👤</div>
              <h3>Select a user</h3>
              <p>Click on any email from the list to view user details and perform actions.</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPACT RECENT ACTIVITY */}
      {adminNotifs.length > 0 && (
        <div className="compact-activity">
          <h3><FaHistory /> Recent Activity</h3>
          <div className="activity-list">
            {adminNotifs.slice(0, 3).map((n, i) => (
              <div key={i} className="activity-item">
                <span className="activity-msg">{n.message}</span>
                <span className="activity-time">{new Date(n.date).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BALANCE EDIT MODAL */}
      {editBal && editBal.type !== 'investment' && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Balance - {editBal.name} ({editBal.email})</h3>
              <button onClick={() => setEditBal(null)} className="close-btn"><FaTimes /></button>
            </div>
            <form onSubmit={submitBalance} className="balance-form">
              <div className="input-group">
                <label>Checking Balance</label>
                <input type="number" value={editBal.checking} onChange={e => setEditBal({...editBal, checking: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Savings Balance</label>
                <input type="number" value={editBal.savings} onChange={e => setEditBal({...editBal, savings: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>USDT Balance</label>
                <input type="number" value={editBal.usdt} onChange={e => setEditBal({...editBal, usdt: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setEditBal(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVESTMENT BALANCE EDIT MODAL */}
      {editBal && editBal.type === 'investment' && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Investment Balance - {editBal.name} ({editBal.email})</h3>
              <button onClick={() => setEditBal(null)} className="close-btn"><FaTimes /></button>
            </div>
            <form onSubmit={submitBalance} className="balance-form">
              <div className="input-group">
                <label>Total Investment Balance</label>
                <input type="number" value={editBal.investments || 0} onChange={e => setEditBal({...editBal, investments: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setEditBal(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER JOIN DATE EDIT MODAL */}
      {editBal && editBal.type === 'joinDate' && (
        <div className="modal-overlay" onClick={() => setEditBal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Member Since Date - {editBal.name} ({editBal.email})</h3>
              <button onClick={() => setEditBal(null)} className="close-btn"><FaTimes /></button>
            </div>
            <form onSubmit={submitBalance} className="balance-form">
              <div className="input-group">
                <label>Member Since Date</label>
                <input type="date" value={editBal.joinDate || ''} onChange={e => setEditBal({...editBal, joinDate: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Changes</button>
                <button type="button" onClick={() => setEditBal(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTIONS MODAL */}
      {editTxUser && (
        <div className="modal-overlay" onClick={() => setEditTxUser(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transactions - {users.find(u => u._id === editTxUser)?.name || 'User'}</h3>
              <button onClick={() => setEditTxUser(null)} className="close-btn"><FaTimes /></button>
            </div>

            <div className="add-tx-card">
              <h4><FaPlus /> Add Manual Transaction</h4>
              <form onSubmit={addTx} className="tx-form">
                <input placeholder="Type (deposit/withdraw)" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} required />
                <input type="number" placeholder="Amount" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
                <input placeholder="Method" value={newTx.method} onChange={e => setNewTx({...newTx, method: e.target.value})} />
                <select value={newTx.status} onChange={e => setNewTx({...newTx, status: e.target.value})}>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
                <select value={newTx.account} onChange={e => setNewTx({...newTx, account: e.target.value})}>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="usdt">USDT</option>
                </select>
                <input type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                <button type="submit" className="add-btn">Add Transaction</button>
              </form>
            </div>

            <div className="tx-list">
              {transactions.length === 0 ? (
                <p className="empty">No transactions found.</p>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Account</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td>{new Date(t.date).toLocaleDateString()}</td>
                        <td>{t.type}</td>
                        <td className="amount">${t.amount.toLocaleString()}</td>
                        <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                        <td>{t.account}</td>
                        <td className="tx-actions">
                          {t.status === 'Pending' && t.type === 'deposit' && (
                            <>
                              <button onClick={() => handleDepositAction(t._id, 'confirm')} className="confirm-btn"><FaCheck /></button>
                              <button onClick={() => handleDepositAction(t._id, 'reject')} className="fail-btn"><FaTimes /></button>
                            </>
                          )}
                          <button onClick={() => deleteTx(t._id)} className="delete-btn"><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS MODAL */}
      {userDocuments && (
        <div className="modal-overlay" onClick={() => setUserDocuments(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Documents - {userDocuments.name} ({userDocuments.email})</h3>
              <button onClick={() => setUserDocuments(null)} className="close-btn"><FaTimes /></button>
            </div>
            <div className="documents-content">
              <div className="doc-item">
                <label>ID Document:</label>
                {userDocuments.idDocument ? (
                  <a href={`${API}${userDocuments.idDocument}`} target="_blank" rel="noopener noreferrer" className="doc-link">
                    View ID Document
                  </a>
                ) : (
                  <div className="no-doc">No ID document uploaded</div>
                )}
              </div>
              <div className="doc-item">
                <label>SSN:</label>
                <div className="ssn-display">{userDocuments.ssn || 'No SSN provided'}</div>
              </div>
              <div className="doc-item">
                <label>KYC Status:</label>
                <div className={`kyc-status status-${userDocuments?.kycStatus || 'pending'}`}>
                  {userDocuments?.kycStatus === 'verified' ? 'Verified ✓' :
                   userDocuments?.kycStatus === 'rejected' ? 'Rejected ✗' :
                   userDocuments?.kycStatus === 'submitted' ? 'Pending Review' : 'Not Submitted'}
                </div>
              </div>
              <div className="doc-item">
                <label>Has Received Loan:</label>
                <div className={userDocuments.hasReceivedLoan ? 'status-yes' : 'status-no'}>
                  {userDocuments.hasReceivedLoan ? 'Yes' : 'No'}
                </div>
              </div>

              {/* KYC Approval Section */}
              {userDocuments.kycStatus === 'submitted' && (
                <div className="kyc-actions">
                  <h4>KYC Review</h4>
                  <div className="kyc-buttons">
                    <button
                      onClick={() => handleKYCAction(userDocuments._id, 'approve')}
                      className="kyc-approve-btn"
                    >
                      <FaCheck /> Approve KYC
                    </button>
                    <button
                      onClick={() => handleKYCAction(userDocuments._id, 'reject')}
                      className="kyc-reject-btn"
                    >
                      <FaTimes /> Reject KYC
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER NOTIFICATIONS MODAL */}
      {userNotifications && (
        <div className="modal-overlay" onClick={() => setUserNotifications(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notifications - {userNotifications.user.name} ({userNotifications.user.email})</h3>
              <button onClick={() => setUserNotifications(null)} className="close-btn"><FaTimes /></button>
            </div>

            <div className="notifications-actions">
              <button 
                onClick={() => markAllNotificationsAsRead(userNotifications.user._id)}
                className="mark-all-read-btn"
              >
                Mark All as Read
              </button>
            </div>

            <div className="notifications-list">
              {userNotifications.notifications.length === 0 ? (
                <p className="empty">No notifications found.</p>
              ) : (
                <table className="notifications-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userNotifications.notifications.map(n => (
                      <tr key={n._id}>
                        <td>{new Date(n.date).toLocaleDateString()}</td>
                        <td className="notification-message">{n.message}</td>
                        <td><span className={`type-badge ${n.type}`}>{n.type}</span></td>
                        <td><span className={`status-badge ${n.read ? 'read' : 'unread'}`}>{n.read ? 'Read' : 'Unread'}</span></td>
                        <td className="notification-actions">
                          <button 
                            onClick={() => editUserNotification(userNotifications.user._id, n._id, { read: !n.read })}
                            className="toggle-read-btn"
                          >
                            {n.read ? 'Mark Unread' : 'Mark Read'}
                          </button>
                          <button 
                            onClick={() => editUserNotification(userNotifications.user._id, n._id, { type: n.type === 'admin' ? 'info' : 'admin' })}
                            className="edit-type-btn"
                          >
                            Change Type
                          </button>
                          <button 
                            onClick={() => deleteUserNotification(userNotifications.user._id, n._id)}
                            className="delete-btn"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="add-notification-card">
              <h4><FaPlus /> Add New Notification</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const message = formData.get('message');
                  const type = formData.get('type');
                  if (message && message.trim()) {
                    addUserNotification(userNotifications.user._id, message.trim(), type);
                    e.target.reset();
                  }
                }}
                className="notification-form"
              >
                <input 
                  name="message" 
                  placeholder="Enter notification message..." 
                  required 
                />
                <select name="type" defaultValue="admin">
                  <option value="admin">Admin</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
                <button type="submit" className="add-btn">Add Notification</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
