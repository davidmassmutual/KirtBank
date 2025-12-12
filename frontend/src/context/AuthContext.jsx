// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);
import API_BASE_URL from '../config/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error('Auth error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    const { token } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, setIsAdmin, login, logout, loading, fetchUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
