// frontend/src/pages/KYC.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/KYC.css';
import API_BASE_URL from '../config/api';
import { FaShieldAlt, FaCheckCircle, FaUpload, FaLock, FaUser, FaCreditCard } from 'react-icons/fa';

const KYC = () => {
  const [kycStatus, setKycStatus] = useState('pending'); // pending, submitted, verified, rejected
  const [idFile, setIdFile] = useState(null);
  const [ssn, setSsn] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKYCData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to access KYC verification');
          navigate('/');
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(res.data);
        setKycStatus(res.data.kycStatus || 'pending');
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expired, please log in again');
          localStorage.removeItem('token');
          navigate('/');
        } else {
          toast.error('Failed to load KYC data');
        }
        setLoading(false);
      }
    };

    fetchKYCData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!idFile || !ssn) {
      setError('Please provide both ID document and SSN');
      return;
    }

    // Validate SSN format (XXX-XX-XXXX)
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
      setError('Please enter SSN in format XXX-XX-XXXX');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('idDocument', idFile);
      formData.append('ssn', ssn);

      const res = await axios.post(
        `${API_BASE_URL}/api/user/kyc`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setKycStatus('submitted');
      setSuccess('KYC documents submitted successfully! Verification may take 1-2 business days.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC documents');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="kyc-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading KYC verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-container">
      <div className="kyc-header">
        <div className="header-icon">
          <FaShieldAlt />
        </div>
        <h1>Complete Your KYC Verification</h1>
        <p>Verify your identity to unlock all banking features and increase your limits</p>
      </div>

      {/* Status Cards */}
      <div className="status-cards">
        <div className={`status-card ${kycStatus === 'verified' ? 'completed' : kycStatus === 'submitted' ? 'pending' : 'incomplete'}`}>
          <div className="status-icon">
            {kycStatus === 'verified' ? <FaCheckCircle /> : kycStatus === 'submitted' ? <FaUpload /> : <FaUser />}
          </div>
          <h3>Identity Verification</h3>
          <p>
            {kycStatus === 'verified' ? 'Your identity has been verified' :
             kycStatus === 'submitted' ? 'Documents submitted, under review' :
             'Upload your government ID and SSN'}
          </p>
        </div>

        <div className={`status-card ${kycStatus === 'verified' ? 'completed' : 'locked'}`}>
          <div className="status-icon">
            <FaLock />
          </div>
          <h3>Account Unlocked</h3>
          <p>
            {kycStatus === 'verified' ? 'All features now available' : 'Complete KYC to unlock full access'}
          </p>
        </div>

        <div className={`status-card ${kycStatus === 'verified' ? 'completed' : 'locked'}`}>
          <div className="status-icon">
            <FaCreditCard />
          </div>
          <h3>Higher Limits</h3>
          <p>
            {kycStatus === 'verified' ? 'Increased transaction and deposit limits' : 'Get higher limits with verification'}
          </p>
        </div>
      </div>

      {/* KYC Form */}
      {kycStatus === 'pending' && (
        <div className="kyc-form-section">
          <div className="form-header">
            <h2>Submit Your Documents</h2>
            <p>Please provide the following information to complete your verification</p>
          </div>

          <div className="messages" style={{ marginBottom: '1rem' }}>
            {error && (
              <div className="error-message" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaShieldAlt />
                {error}
              </div>
            )}
            {success && (
              <div className="success-message" style={{ background: '#d1fae5', color: '#16a34a', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCheckCircle />
                {success}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="kyc-form">
            <div className="form-group">
              <label htmlFor="idDocument">
                <FaUpload className="field-icon" />
                Government ID Document
              </label>
              <p className="field-description">
                Upload a clear photo of your driver's license, passport, or state ID
              </p>
              <input
                type="file"
                id="idDocument"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setIdFile(e.target.files[0])}
                required
                className="file-input"
              />
              {idFile && (
                <div className="file-preview">
                  <span>Selected: {idFile.name}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ssn">
                <FaLock className="field-icon" />
                Social Security Number (SSN)
              </label>
              <p className="field-description">
                Enter your SSN in the format XXX-XX-XXXX for identity verification
              </p>
              <input
                type="text"
                id="ssn"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder="XXX-XX-XXXX"
                pattern="\d{3}-\d{2}-\d{4}"
                maxLength="11"
                required
                className="text-input"
              />
            </div>

            <div className="form-notice">
              <FaShieldAlt />
              <p>
                Your documents are encrypted and stored securely. We comply with all banking privacy regulations.
                Your information will never be shared with third parties.
              </p>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={submitting || !idFile || !ssn}
                className="submit-btn"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submitted State */}
      {kycStatus === 'submitted' && (
        <div className="kyc-status submitted">
          <div className="status-icon large">
            <FaUpload />
          </div>
          <h2>Documents Submitted</h2>
          <p>
            Thank you for submitting your KYC documents. Our team will review them within 1-2 business days.
            You'll receive an email notification once verification is complete.
          </p>
          <div className="next-steps">
            <h3>What happens next?</h3>
            <ul>
              <li>Document review by our compliance team</li>
              <li>Identity verification against government databases</li>
              <li>Email notification of approval</li>
              <li>Immediate unlocking of all account features</li>
            </ul>
          </div>
        </div>
      )}

      {/* Verified State */}
      {kycStatus === 'verified' && (
        <div className="kyc-status verified">
          <div className="status-icon large">
            <FaCheckCircle />
          </div>
          <h2>Identity Verified!</h2>
          <p>
            Congratulations! Your identity has been successfully verified.
            You now have full access to all banking features and increased limits.
          </p>
          <div className="verified-benefits">
            <h3>Your Benefits:</h3>
            <div className="benefits-grid">
              <div className="benefit">
                <FaCheckCircle />
                <span>Higher transaction limits</span>
              </div>
              <div className="benefit">
                <FaCheckCircle />
                <span>Access to all investment options</span>
              </div>
              <div className="benefit">
                <FaCheckCircle />
                <span>Priority customer support</span>
              </div>
              <div className="benefit">
                <FaCheckCircle />
                <span>Advanced security features</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Rejected State */}
      {kycStatus === 'rejected' && (
        <div className="kyc-status rejected">
          <div className="status-icon large error">
            <FaShieldAlt />
          </div>
          <h2>Verification Failed</h2>
          <p>
            We were unable to verify your identity with the provided documents.
            Please check your information and try again, or contact support for assistance.
          </p>
          <div className="contact-info">
            <p><strong>Support:</strong> support@kirtbank.com | 1-800-KIRT-BANK</p>
          </div>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default KYC;
