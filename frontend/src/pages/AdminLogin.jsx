// frontend/src/pages/AdminLogin.jsx
// frontend/src/pages/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminLogin.css';
import API_BASE_URL from '../config/api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { setToken, setIsAdmin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Admin login form submitted');

    try {
      console.log('Posting to:', `${API_BASE_URL}/api/auth/admin/login`);
      console.log('Email:', email, 'Password:', password.replace(/./g, '*'));
      const res = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email,
        password,
      });
      console.log('Response:', res);
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', 'true');
      setToken(token);
      setIsAdmin(true);
      setSuccess('Admin login successful!');
      setTimeout(() => navigate('/admin/dashboard'), 100);
    } catch (err) {
      console.error('Admin login error:', err.response?.data?.message, err.message);
      setError(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h2><i className="fas fa-user-shield"></i> Admin Login</h2>
      <div className="login-card">
        <div className="messages" style={{ marginBottom: '1rem' }}>
          {error && (
            <div className="error-message" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" style={{ background: '#d1fae5', color: '#16a34a', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            <i className="fas fa-sign-in-alt"></i> {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
