import Footer from '../components/Footer';
import '../styles/Support.css';

function Support() {
  return (
    <div className="support">
      <h2><i className="fas fa-headset"></i> Support</h2>
      <p>Contact our support team via live chat or email.</p>
      <button onClick={() => window.smartsupp('chat:open')}>
        <i className="fas fa-comment-dots"></i> Talk to an Agent
      </button>
    </div>
  );
}

export default Support;