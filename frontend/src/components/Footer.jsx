import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Kirt Bank</h3>
          <p>Strength. Security. Stability.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/support">Support</a></li>
            <li><a href="/loans">Loans</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: sterlingtrustcontact@gmail.com</p>
          <p>Phone: +1 (541) 456-7890</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Kirt Bank. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;