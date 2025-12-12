// src/components/LoadingSpinner.jsx
import '../styles/LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner"></div>
      <p>Processing...</p>
    </div>
  );
}

export default LoadingSpinner;