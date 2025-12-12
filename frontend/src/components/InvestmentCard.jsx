// src/components/InvestmentCard.jsx
import { Link } from 'react-router-dom';
import { FaChartLine } from 'react-icons/fa';
import '../styles/InvestmentCard.css';

export default function InvestmentCard() {
  return (
    <Link to="/investment" className="investment-mini-card glass">
      <FaChartLine className="icon" />
      <div>
        <h4>Earn up to 15.5% APY</h4>
        <p>Start investing today</p>
      </div>
      <span className="arrow">→</span>
    </Link>
  );
}