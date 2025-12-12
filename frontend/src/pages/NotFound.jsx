import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page Not Found</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

export default NotFound;