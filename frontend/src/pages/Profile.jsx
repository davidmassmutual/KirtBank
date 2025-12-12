// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/Profile.css';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaShieldAlt, FaEdit } from 'react-icons/fa';

export default function Profile() {
  const { user, token, fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Split name into first and last name
  const nameParts = user.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>View your personal information and account details</p>
      </div>

      <div className="profile-content">
        {/* Profile Image Section */}
        <div className="profile-image-section">
          <div className="profile-image-wrapper">
            {user.profileImage ? (
              <img
                src={`${API_BASE_URL}${user.profileImage}`}
                alt="Profile"
                className="profile-display-image"
              />
            ) : (
              <div className="profile-image-placeholder">
                <FaUser />
              </div>
            )}
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="profile-info-cards">
          {/* Personal Information */}
          <div className="info-card personal-card">
            <div className="card-header">
              <FaUser className="card-icon" />
              <h3>Personal Information</h3>
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>First Name</label>
                <span>{firstName}</span>
              </div>
              <div className="info-item">
                <label>Last Name</label>
                <span>{lastName}</span>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="info-item">
                  <label>Phone Number</label>
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="info-card address-card">
            <div className="card-header">
              <FaMapMarkerAlt className="card-icon" />
              <h3>Address Information</h3>
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>Address</label>
                <span>{user.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="info-card account-card">
            <div className="card-header">
              <FaCalendarAlt className="card-icon" />
              <h3>Account Information</h3>
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>Member Since</label>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Account Status</label>
                <span className="status-active">Active</span>
              </div>
              <div className="info-item">
                <label>KYC Status</label>
                <span className={`status-${user.kycStatus || 'pending'}`}>
                  {user.kycStatus === 'verified' ? 'Verified' :
                   user.kycStatus === 'submitted' ? 'Under Review' : 'Not Submitted'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="info-card security-card">
            <div className="card-header">
              <FaShieldAlt className="card-icon" />
              <h3>Security Information</h3>
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>Two-Factor Authentication</label>
                <span className={`status-${user.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="info-item">
                <label>Account Security</label>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button
            onClick={() => navigate('/settings')}
            className="edit-profile-btn"
          >
            <FaEdit /> Edit Profile Information
          </button>
        </div>
      </div>
    </div>
  );
}
