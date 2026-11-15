import { Link, useNavigate } from 'react-router-dom';
import NavBar from './NavBar.jsx';
import { useAuth } from '../hooks/useAuth.js';

// Reads global auth state from context to swap the call-to-action area.
export default function Header() {
  const { user, status, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="header">
      <NavBar>
        {status === 'loading' && <span className="nav__user" aria-live="polite">…</span>}
        {status === 'anonymous' && (
          <>
            <Link to="/login" className="btn btn--ghost">Log in</Link>
            <Link to="/register" className="btn btn--primary">Join free</Link>
          </>
        )}
        {status === 'authenticated' && (
          <>
            <span className="nav__user">
              Hi, {user.name.split(' ')[0]}
              {isAdmin && <span className="pill pill--admin">Admin</span>}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>Log out</button>
          </>
        )}
      </NavBar>
    </header>
  );
}
