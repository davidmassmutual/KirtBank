// frontend/src/pages/LoanBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoanBanner.css';

function LoanBanner() {
  const navigate = useNavigate();

  const handleApplyNow = () => {
    navigate('/loans');
  };

  return (
    <div className="loan-banner">
      <h2><i className="fas fa-hand-holding-usd"></i> You’re pre-approved for up to $5,000!</h2>
      <button onClick={handleApplyNow}>
        <i className="fas fa-arrow-right"></i> Apply Now
      </button>
    </div>
  );
}

export default LoanBanner;