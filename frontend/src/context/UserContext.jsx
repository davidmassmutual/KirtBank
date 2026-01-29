// src/context/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Ensure we always have a valid user object
      if (res.data) {
        setUserData(res.data);
      } else {
        setUserData(null); // Set to null instead of leaving undefined
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setUserData(null); // Set to null instead of leaving undefined
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const refreshUserData = async () => {
    await fetchUserData();
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      loading, 
      refreshUserData,
      setUserData 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);