import '../styles/SecurityDisplay.css';

function SecurityDisplay({ lastLogin, twoFactorEnabled }) {
  return (
    <div className="security-display">
      <h2><i className="fas fa-shield-alt"></i> Security</h2>
      <p><i className="fas fa-clock"></i> Last Login: {lastLogin}</p>
      <p><i className="fas fa-user-shield"></i> Two-Factor Authentication: {twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
    </div>
  );
}

export default SecurityDisplay;