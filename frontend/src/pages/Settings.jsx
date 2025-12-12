import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { QRCodeSVG } from "qrcode.react";
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBell,
  FaGlobe,
  FaPalette,
  FaShieldAlt,
  FaKey,
  FaDesktop,
  FaSignOutAlt,
  FaSave,
  FaCog
} from 'react-icons/fa';
import '../styles/Settings.css';
import API_BASE_URL from '../config/api';

function Settings() {
  const { fetchUser } = useAuth();

  // ────────────────────────────────────── STATE ──────────────────────────────────────
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', profileImage: '' });
  const [security, setSecurity] = useState({
    twoFactor: false,
    newPassword: '',
    confirmPassword: '',
    totpSecret: '',
    totpUrl: '',
  });
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
  const [preferences, setPreferences] = useState({ currency: 'USD', theme: 'light' });
  const [sessions, setSessions] = useState([]);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);

  // ────────────────────────────────────── HELPERS ──────────────────────────────────────
  const token = localStorage.getItem('token');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Split name into first and last name
      const nameParts = res.data.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfile({
        firstName,
        lastName,
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        profileImage: res.data.profileImage || '',
      });
      setSecurity(prev => ({ ...prev, twoFactor: res.data.twoFactorEnabled || false }));
      setNotifications(res.data.notificationsSettings || { email: true, sms: false, push: true });
      setPreferences({ currency: res.data.currency || 'USD', theme: res.data.theme || 'light' });

      const sessRes = await axios.get(`${API_BASE_URL}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(sessRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ────────────────────────────────────── EFFECTS ──────────────────────────────────────
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ────────────────────────────────────── HANDLERS ──────────────────────────────────────
  const handleProfileChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handleSecurityChange = e => setSecurity({ ...security, [e.target.name]: e.target.value });
  const handleNotificationsChange = e =>
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  const handlePreferencesChange = e => setPreferences({ ...preferences, [e.target.name]: e.target.value });

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile({ ...profile, profileImage: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImageFile) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImageFile);

      const res = await axios.put(`${API_BASE_URL}/api/user/profile/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      setProfile(prev => ({ ...prev, profileImage: res.data.profileImage }));
      await fetchUser(); // Update global user state
      toast.success('Profile image updated successfully');
      setProfileImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setSubmitting(false);
    }
  };

  const submitProfile = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Combine firstName and lastName for backend
      const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();

      const profileData = {
        name: fullName,
        phone: profile.phone,
        address: profile.address
      };

      await axios.put(`${API_BASE_URL}/api/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh user data to update navbar
      await fetchSettings();
      await fetchUser(); // Update global state

      setSuccess('Profile updated successfully!');

{error && (

  <div className="error-message">

    <FaExclamationCircle />

    {error}

  </div>

)}

{success && (

  <div className="success-message">

    <FaCheckCircle />

    {success}

  </div>

)}

    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async e => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/user/password`,
        { password: security.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed');
      setSecurity(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSubmitting(false);
    }
  };

  const start2FASetup = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurity(prev => ({ ...prev, totpSecret: res.data.secret, totpUrl: res.data.otpauth_url }));
      setShow2FASetup(true);
      toast.success('Scan QR code with an authenticator app');
    } catch (err) {
      toast.error(err.response?.data?.message || '2FA setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const verify2FA = async () => {
    if (!/^\d{6}$/.test(totpCode)) return toast.error('Enter a 6‑digit code');
    try {
      await axios.post(
        `${API_BASE_URL}/api/user/2fa/verify`,
        { token: totpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSecurity(prev => ({ ...prev, twoFactor: true }));
      setShow2FASetup(false);
      setTotpCode('');
      toast.success('2FA enabled');
    } catch (err) {
      toast.error('Invalid code');
    }
  };

  const disable2FA = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/user/2fa/disable`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurity(prev => ({ ...prev, twoFactor: false }));
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disable failed');
    }
  };

  const requestPasswordReset = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: profile.email });
      toast.success('Password‑reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    }
  };

  const submitNotifications = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/notifications`, notifications, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPreferences = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/api/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      document.documentElement.setAttribute('data-theme', preferences.theme);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const logoutSession = async sessionId => {
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/user/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Session terminated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terminate failed');
    } finally {
      setSubmitting(false);
    }
  };

  const clearAllSessions = async () => {
    if (!confirm('Are you sure you want to clear all sessions? You will be logged out of all devices.')) return;

    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/user/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions([]);
      toast.success('All sessions cleared');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear sessions');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────── RENDER ──────────────────────────────────────
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="settings">
      <h2>
        <FaCog /> Settings
      </h2>

      <div className="settings-container">
        {/* ───── PROFILE ───── */}
        <div className="settings-card">
          <h3>
            <FaUser /> Profile Information
          </h3>

          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="profile-image-container">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage.startsWith('data:') ? profile.profileImage : `${API_BASE_URL}${profile.profileImage}`}
                  alt="Profile"
                  className="profile-image-display"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="profile-image-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: 'none' }}
                id="profile-image-input"
                disabled={submitting}
              />
              <label htmlFor="profile-image-input" className="image-upload-btn">
                Choose Image
              </label>
              {profileImageFile && (
                <button onClick={uploadProfileImage} disabled={submitting} className="image-save-btn">
                  {submitting ? 'Uploading...' : 'Save Image'}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={submitProfile}>
            <div className="name-fields">
              <label>
                <FaUser /> First Name
                <input name="firstName" value={profile.firstName || ''} onChange={handleProfileChange} required disabled={submitting} />
              </label>
              <label>
                <FaUser /> Last Name
                <input name="lastName" value={profile.lastName || ''} onChange={handleProfileChange} required disabled={submitting} />
              </label>
            </div>
            <label>
              <FaEnvelope /> Email
              <input name="email" type="email" value={profile.email} disabled title="Email cannot be changed" />
            </label>
            <label>
              <FaPhone /> Phone
              <input name="phone" type="tel" value={profile.phone} onChange={handleProfileChange} disabled={submitting} />
            </label>
            <label>
              <FaMapMarkerAlt /> Address
              <textarea name="address" rows="3" value={profile.address} onChange={handleProfileChange} disabled={submitting} />
            </label>
            <button type="submit" disabled={submitting}>
              <FaSave /> {submitting ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* ───── SECURITY ───── */}
        <div className="settings-card">
          <h3>
            <FaShieldAlt /> Security
          </h3>

          {/* 2FA */}
          <div className="settings-toggle">
            {security.twoFactor ? (
              <button onClick={disable2FA} disabled={submitting}>
                Disable 2FA
              </button>
            ) : (
              <button onClick={start2FASetup} disabled={submitting}>
                {submitting ? 'Setting up…' : 'Enable 2FA'}
              </button>
            )}
          </div>

     {show2FASetup && (
  <div className="qrcode-section">
    <QRCodeSVG value={security.totpUrl} size={128} />
    <input
      type="text"
      placeholder="6-digit code"
      value={totpCode}
      onChange={e => setTotpCode(e.target.value)}
      maxLength={6}
    />
    <button onClick={verify2FA}>Verify</button>
  </div>
)}

          {/* Password */}
          <form onSubmit={submitPassword}>
            <label>
              <FaKey /> New Password
              <input
                type="password"
                name="newPassword"
                value={security.newPassword}
                onChange={handleSecurityChange}
                required
                disabled={submitting}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={security.confirmPassword}
                onChange={handleSecurityChange}
                required
                disabled={submitting}
              />
            </label>
            <button type="submit" disabled={submitting}>
              <FaKey /> {submitting ? 'Changing…' : 'Change Password'}
            </button>
          </form>

          <button onClick={requestPasswordReset} className="reset-link">
            Send Password‑Reset Email
          </button>
        </div>

        {/* ───── NOTIFICATIONS ───── */}
        <div className="settings-card">
          <h3>
            <FaBell /> Notification Preferences
          </h3>
          <form onSubmit={submitNotifications}>
            <label>
              <input
                type="checkbox"
                name="email"
                checked={notifications.email}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              Email
            </label>
            <label>
              <input
                type="checkbox"
                name="sms"
                checked={notifications.sms}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              SMS
            </label>
            <label>
              <input
                type="checkbox"
                name="push"
                checked={notifications.push}
                onChange={handleNotificationsChange}
                disabled={submitting}
              />
              Push
            </label>
            <button type="submit" disabled={submitting}>
              <FaSave /> {submitting ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* ───── PREFERENCES ───── */}
        <div className="settings-card">
          <h3>
            <FaPalette /> Account Preferences
          </h3>
          <form onSubmit={submitPreferences}>
            <label>
              <FaGlobe /> Currency
              <select name="currency" value={preferences.currency} onChange={handlePreferencesChange} disabled={submitting}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label>
              Theme
              <select name="theme" value={preferences.theme} onChange={handlePreferencesChange} disabled={submitting}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <button type="submit" disabled={submitting}>
              <FaSave /> {submitting ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* ───── SESSIONS ───── */}
        <div className="settings-card">
          <h3>
            <FaDesktop /> Active Sessions
          </h3>
          {sessions.length > 0 && (
            <div className="session-actions">
              <button onClick={clearAllSessions} disabled={submitting} className="clear-all-btn">
                <FaSignOutAlt /> Clear All Sessions
              </button>
            </div>
          )}
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s._id} className="session-item">
                  <p>{s.device}</p>
                  <span>Last active: {new Date(s.lastActive).toLocaleString()}</span>
                  <button onClick={() => logoutSession(s._id)} disabled={submitting}>
                    <FaSignOutAlt /> Log out
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No active sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
