import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import './SideNav.css';

export default function SideNav() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidenav">
      <div className="sidenav-header">
        <img src={auth?.avatar || 'https://i.pravatar.cc/100'} alt="Avatar" />
        <span>{auth?.username}</span>
      </div>
      <nav className="sidenav-links">
        <button onClick={() => navigate('/profile')}>👤 Profile</button>
        <button onClick={handleLogout}>🚪 Logout</button>
      </nav>
    </aside>
  );
}
