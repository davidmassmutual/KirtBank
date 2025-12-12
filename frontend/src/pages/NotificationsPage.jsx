// src/pages/NotificationsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes
} from 'react-icons/fa';
import '../styles/NotificationsPage.css';
import API_BASE_URL from '../config/api';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markAsRead = async ( id ) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const filtered = notifications.filter(n => filter === 'all' || (filter === 'unread' ? !n.read : n.read));

  if (loading) return <LoadingSkeleton />;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <FaExclamationCircle className="priority high" />;
      case 'medium': return <FaInfoCircle className="priority medium" />;
      default: return <FaBell className="priority low" />;
    }
  };

  return (
    <div className="notifications-page">
      <header className="page-header">
        <h1><FaBell /> Notifications</h1>
        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Unread</button>
          <button className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>Read</button>
        </div>
      </header>

      <div className="notifications-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <p>No notifications</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif._id}
              className={`notification-card ${notif.read ? 'read' : 'unread'} priority-${notif.priority}`}
              onClick={!notif.read ? () => markAsRead(notif._id) : undefined}
              style={!notif.read ? { cursor: 'pointer' } : {}}
            >
              <div className="notif-header">
                {getPriorityIcon(notif.priority)}
                <span className="notif-time">
                  {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button onClick={(e) => { e.stopPropagation(); if (notif.read) markAsRead(notif._id); }} className={`mark-read ${notif.read ? 'read' : 'unread'}`}>
                  <FaCheckCircle />
                </button>
              </div>
              <h3>{notif.title}</h3>
              <p>{notif.message}</p>
              {notif.action && (
                <Link to={notif.action} className="action-link">
                  View Details
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
