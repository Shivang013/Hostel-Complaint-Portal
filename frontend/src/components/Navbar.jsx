import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-mark" />
        <span className="navbar-brand-text">Hostel Complaint Portal</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-role">{user.name} · {user.role}</span>
            <Link to="/dashboard">Dashboard</Link>
            {user.role === 'student' && <Link to="/new-complaint">File Complaint</Link>}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
