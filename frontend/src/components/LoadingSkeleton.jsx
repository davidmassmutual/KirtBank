// src/components/LoadingSkeleton.jsx
import '../styles/LoadingSkeleton.css';

function LoadingSkeleton() {
  return (
    <div className="skeleton-container">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>

      <div className="skeleton-card">
        <div className="skeleton-line short"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line long"></div>
        <div className="skeleton-line medium"></div>
      </div>

      <div className="skeleton-card">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
        <div className="skeleton-line long"></div>
      </div>

      <div className="skeleton-card">
        <div className="skeleton-circle"></div>
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line short"></div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;