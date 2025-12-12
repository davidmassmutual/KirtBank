import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaEye, FaEyeSlash, FaLock, FaUnlock, FaTrash, FaCreditCard, FaCopy, FaPlus, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/VirtualCards.css';
import API_BASE_URL from '../config/api';

function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/virtual-cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired');
        navigate('/login');
      } else toast.error(err.response?.data?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createVirtual = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/virtual-cards`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(prev => [...prev, res.data]);
      toast.success('Virtual card created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create virtual card');
    } finally {
      setSubmitting(false);
    }
  };

  const orderPhysical = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/virtual-cards/physical`,
        { shippingAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards(prev => [...prev, res.data.card]);
      setShowPhysicalForm(false);
      setShippingAddress({ street: '', city: '', state: '', zipCode: '', country: 'USA' });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to order physical card');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async id => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/virtual-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(prev => prev.filter(c => c._id !== id));
      toast.success('Card deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, cur) => {
    setSubmitting(true);
    const newStatus = cur === 'Active' ? 'Frozen' : 'Active';
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/virtual-cards/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards(prev => prev.map(c => (c._id === id ? { ...c, status: newStatus } : c)));
      toast.success(`Card ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Check if user can create virtual card (no active virtual cards)
  const canCreateVirtual = !cards.some(c => c.cardType === 'virtual' && ['Active', 'Frozen'].includes(c.status));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="virtual-cards">
      <h2>
        <FaCreditCard /> Cards
      </h2>

      {/* Card Creation Options */}
      <div className="card-options">
        {canCreateVirtual && (
          <button onClick={createVirtual} disabled={submitting} className="create-btn virtual-btn">
            <FaCreditCard /> {submitting ? 'Creating…' : 'Create Virtual Card'}
          </button>
        )}

        <button
          onClick={() => setShowPhysicalForm(true)}
          disabled={submitting}
          className="create-btn physical-btn"
        >
          <FaTruck /> Order Physical Card ($100)
        </button>
      </div>

      {/* Physical Card Order Form */}
      {showPhysicalForm && (
        <div className="modal-overlay" onClick={() => setShowPhysicalForm(false)}>
          <div className="modal physical-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaMapMarkerAlt /> Order Physical Card</h3>
              <button onClick={() => setShowPhysicalForm(false)} className="close-btn"><FaTrash /></button>
            </div>

            <div className="physical-info">
              <p><strong>Cost:</strong> $100 (deducted from your account)</p>
              <p><strong>Processing Time:</strong> 3-5 business days</p>
              <p><strong>Shipping:</strong> Free standard shipping to USA addresses</p>
            </div>

            <form onSubmit={orderPhysical} className="shipping-form">
              <h4>Shipping Address</h4>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})}
                  required
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                    required
                    placeholder="New York"
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})}
                    required
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    value={shippingAddress.zipCode}
                    onChange={e => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                    required
                    placeholder="10001"
                    pattern="\d{5}"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={shippingAddress.country}
                    onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})}
                  >
                    <option value="USA">United States</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={submitting} className="order-btn">
                  {submitting ? 'Processing Order…' : 'Order Physical Card ($100)'}
                </button>
                <button type="button" onClick={() => setShowPhysicalForm(false)} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="cards-list">
        {cards.length === 0 ? (
          <div className="no-cards">
            <p>No cards yet. Create a virtual card or order a physical card to get started.</p>
          </div>
        ) : (
          cards.map(c => (
            <div key={c._id} className={`card-item ${c.cardType}`}>
              <div className="card-header">
                <span className={`card-type-badge ${c.cardType}`}>
                  {c.cardType === 'virtual' ? <FaCreditCard /> : <FaTruck />}
                  {c.cardType === 'virtual' ? 'Virtual' : 'Physical'}
                </span>
                <span className={`status-badge ${c.status.toLowerCase()}`}>
                  {c.status}
                </span>
              </div>

              <div className="card-preview">
                <div className="visa-card">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="visa-logo" />
                  <div className="card-info">
                    <h3>Kirt Bank {c.cardType === 'physical' ? 'Physical' : 'Virtual'}</h3>
                    <p className="card-number">
                      {showDetails === c._id ? c.cardNumber : `**** **** **** ${c.cardNumber.slice(-4)}`}
                      {showDetails === c._id && (
                        <button onClick={() => copyToClipboard(c.cardNumber)} className="copy-btn">
                          <FaCopy />
                        </button>
                      )}
                    </p>
                    <div className="card-details">
                      <p>CVV: {showDetails === c._id ? c.cvv : '***'}</p>
                      <p>Expiry: {c.expiryDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Info for Physical Cards */}
              {c.cardType === 'physical' && c.shippingAddress && (
                <div className="shipping-info">
                  <h4><FaMapMarkerAlt /> Shipping Details</h4>
                  <p>{c.shippingAddress.street}</p>
                  <p>{c.shippingAddress.city}, {c.shippingAddress.state} {c.shippingAddress.zipCode}</p>
                  <p><strong>Status:</strong> {c.shippingStatus}</p>
                  {c.trackingNumber && <p><strong>Tracking:</strong> {c.trackingNumber}</p>}
                  {c.orderDate && <p><strong>Ordered:</strong> {new Date(c.orderDate).toLocaleDateString()}</p>}
                </div>
              )}

              <div className="card-actions">
                <button onClick={() => setShowDetails(showDetails === c._id ? null : c._id)} disabled={submitting}>
                  {showDetails === c._id ? <FaEyeSlash /> : <FaEye />} {showDetails === c._id ? 'Hide' : 'Show'} Details
                </button>

                {c.cardType === 'virtual' && c.status !== 'Deleted' && (
                  <button onClick={() => toggleStatus(c._id, c.status)} disabled={submitting}>
                    {c.status === 'Active' ? <FaLock /> : <FaUnlock />} {c.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                  </button>
                )}

                {c.status !== 'Ordered' && c.status !== 'Shipped' && c.status !== 'Processing' && (
                  <button onClick={() => remove(c._id)} disabled={submitting}>
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VirtualCards;
