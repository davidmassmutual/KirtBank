import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';
import img1 from '../images/hero2.jpg';
import img2 from '../images/hero1.jpg';
import img3 from '../images/65aa41dfd56eff4889757fcc_customer service in banking_cover image.jpg';
import img4 from '../images/8523a5f867ed9cbc1e1944bf7d2c25b340b6550a.png';
import img5 from '../images/fast.webp';
import img6 from '../images/Mobile-Banking-App-Features.jpg';
import img7 from '../images/support.png';
import img9 from '../images/WhatsApp Image 2025-10-17 at 16.15.27.jpeg';
import janeDoeImg from '../images/janedoe.jpeg';
import mikeSmithImg from '../images/mike.avif';
import sarahJohnsonImg from '../images/sarah.jpg';
import {
  FaShieldAlt,
  FaRocket,
  FaCreditCard,
  FaLock,
  FaCheckCircle,
  FaArrowRight,
  FaStar,
  FaUsers,
  FaGlobe,
  FaChartLine,
  FaPiggyBank,
  FaWallet,
  FaExchangeAlt,
  FaExclamationCircle,
  FaHandHoldingUsd
} from 'react-icons/fa';
import API_BASE_URL from '../config/api';

function Home() {
  const { login, user, loading: authLoading, setToken } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);



  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (isSignUp && (!formData.firstName.trim() || !formData.lastName.trim())) {
      setError('First name and last name are required for registration');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('A valid email is required');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // For registration, use direct axios call
        const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
        if (res.data.token) {
          setSuccess('Registration successful! You can now sign in below.');
          setIsSignUp(false);
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
          });
          setTimeout(() => setSuccess(''), 5000); // Clear success after 5 seconds
        }
      } else {
        // For login, use AuthContext and wait for it to complete
        await login(formData.email, formData.password);
        setSuccess('Login successful!');
        // Navigation will happen via useEffect when user is set
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });
    setError('');
  };

  return (
    <div className="home">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <FaShieldAlt /> Trusted by 10,000+ Customers
          </div>

          {/* KIRT BANK BRAND NAME */}
          <header className="site-header">
            <div className="container">
              <h1 className="brand-name">
                <span className="kirt-navy">KI</span><span className="r-gold">R</span><span className="t-bank-navy">T BANK</span>
              </h1>
            </div>
          </header>
          <h1 className="hero-title">
            Modern Banking Made <span className="highlight">Simple</span>
          </h1>
          <p className="hero-subtitle">
            Experience next-generation banking with instant transfers, competitive rates,
            and bank-grade security. Join thousands of satisfied customers.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">$2.1B+</div>
              <div className="stat-label">Assets Under Management</div>
            </div>
            <div className="stat">
              <div className="stat-number">28%</div>
              <div className="stat-label">Average Investment Returns</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Customer Support</div>
            </div>
          </div>

          <button onClick={() => {
            setIsSignUp(true);
            document.querySelector('.auth-section')?.scrollIntoView({ behavior: 'smooth' });
          }} className="btn-primary hero-cta-btn">
            <FaRocket /> Get Started Free
          </button>

        </div>
      </section>

      {/* AUTH SECTION */}
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header">
              <h2 className='auth-heads'>{isSignUp ? 'Create Your Account' : 'Welcome Back'}</h2>
              <p>
                {isSignUp
                  ? 'Join thousands of customers who trust Kirt Bank with their finances'
                  : 'Access your account and continue managing your money securely'
                }
              </p>
            </div>

<div className="messages">
              {error && (
                <div className="error-message" key="error">
                  <FaExclamationCircle />
                  {error}
                </div>
              )}
              {success && (
                <div className="success-message" key="success">
                  <FaCheckCircle />
                  {success}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {isSignUp && (
                <>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={toggleAuthMode} className="toggle-link">
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>

          <div className="auth-visual">
            <div className="benefits-list">
              <div className="benefit-item">
                <FaCheckCircle className="check-icon" />
                <span>Free transfers up to $10,000/month</span>
              </div>
              <div className="benefit-item">
                <FaCheckCircle className="check-icon" />
                <span>No hidden fees or charges</span>
              </div>
              <div className="benefit-item">
                <FaCheckCircle className="check-icon" />
                <span>Instant account verification</span>
              </div>
              <div className="benefit-item">
                <FaCheckCircle className="check-icon" />
                <span>Advanced fraud protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Kirt Bank?</h2>
          <p>Experience banking designed for the modern world</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FaHandHoldingUsd />
            </div>
            <h3>Interest-Free Loans</h3>
            <p>Get loans with 0% interest rate. Borrow what you need and repay exactly the same amount.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaRocket />
            </div>
            <h3>Lightning Fast</h3>
            <p>Instant transfers and real-time balance updates. No waiting, no delays.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaShieldAlt />
            </div>
            <h3>Bank-Grade Security</h3>
            <p>256-bit encryption, biometric authentication, and FDIC insurance up to $250,000.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaPiggyBank />
            </div>
            <h3>High-Yield Savings</h3>
            <p>Earn up to 5.25% APY on your savings with our premium accounts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaGlobe />
            </div>
            <h3>Mobile Banking</h3>
            <p>Manage your money anywhere with our award-winning mobile app.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FaExchangeAlt />
            </div>
            <h3>Multi-Currency</h3>
            <p>Send and receive money in 30+ currencies with competitive exchange rates.</p>
          </div>
        </div>
      </section>

      {/* SECURITY SECTION */}
      <section className="security-section">
        <div className="security-content">
          <div className="security-text">
            <h2>Your Security is Our Priority</h2>
            <p>
              We employ bank-grade security measures including 256-bit SSL encryption,
              biometric authentication, and real-time fraud monitoring to keep your money safe.
            </p>
            <div className="security-features">
              <div className="security-feature">
                <FaLock className="security-icon" />
                <div>
                  <h4>End-to-End Encryption</h4>
                  <p>All data is encrypted in transit and at rest</p>
                </div>
              </div>
              <div className="security-feature">
                <FaShieldAlt className="security-icon" />
                <div>
                  <h4>Fraud Protection</h4>
                  <p>AI-powered fraud detection and prevention</p>
                </div>
              </div>
              <div className="security-feature">
                <FaCheckCircle className="security-icon" />
                <div>
                  <h4>Federal Insurance</h4>
                  <p>FDIC insured up to $250,000 per account</p>
                </div>
              </div>
            </div>
          </div>
          <div className="security-visual">
            <div className="security-badge">
              <FaShieldAlt className="badge-icon" />
              <span>Bank-Grade Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="reviews-section">
        <div className="section-header">
          <h2>What Our Customers Say</h2>
          <p>Join thousands of satisfied banking customers</p>
        </div>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="star" />
              ))}
            </div>
            <p className="review-text">
              "Kirt Bank has transformed how I manage my money. The app is intuitive,
              transfers are instant, and customer service is exceptional."
            </p>
            <div className="review-author">
              <img src={janeDoeImg} alt="Jane Doe" className="author-avatar" />
              <div>
                <div className="author-name">Jane Doe</div>
                <div className="author-title">Small Business Owner</div>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="star" />
              ))}
            </div>
            <p className="review-text">
              "The investment options are fantastic. I've seen returns I never thought
              possible with traditional banks. Highly recommend!"
            </p>
            <div className="review-author">
              <img src={mikeSmithImg} alt="Mike Smith" className="author-avatar" />
              <div>
                <div className="author-name">Mike Smith</div>
                <div className="author-title">Tech Professional</div>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="star" />
              ))}
            </div>
            <p className="review-text">
              "Security is top-notch. I feel completely safe banking with Kirt Bank.
              The mobile app makes managing finances a breeze."
            </p>
            <div className="review-author">
              <img src={sarahJohnsonImg} alt="Sarah Johnson" className="author-avatar" />
              <div>
                <div className="author-name">Sarah Johnson</div>
                <div className="author-title">Marketing Director</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Experience Modern Banking?</h2>
          <p>
            Join Kirt Bank today and discover why thousands of customers have made the switch.
            Open your account in minutes, no credit check required.
          </p>
          <div className="cta-buttons">
            <button onClick={() => {
              setIsSignUp(true);
              document.querySelector('.auth-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="btn-primary">
              <FaRocket /> Start Banking Today
            </button>
          </div>
          <div className="cta-trust">
            <div className="trust-item">
              <FaCheckCircle />
              <span>No Monthly Fees</span>
            </div>
            <div className="trust-item">
              <FaCheckCircle />
              <span>Free Transfers</span>
            </div>
            <div className="trust-item">
              <FaCheckCircle />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
