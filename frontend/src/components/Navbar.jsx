import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

// Primary navigation. `menuOpen` is local UI state (useState); the auth slot is injected by Header.
export default function NavBar({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const linkClass = ({ isActive }) => (isActive ? 'nav__link nav__link--active' : 'nav__link');

  return (
    <nav className="nav" aria-label="Main">
      <Link to="/" className="brand" onClick={close}>
        <span className="brand__mark" aria-hidden="true">⌂</span>
        <span>CivicShare</span>
      </Link>
      <button
        type="button"
        className="nav__toggle"
        aria-expanded={menuOpen}
        aria-controls="nav-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        <span className="nav__burger" aria-hidden="true" />
      </button>
      <div id="nav-menu" className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`} onClick={close}>
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/catalog" className={linkClass}>Browse tools</NavLink>
        <div className="nav__auth">{children}</div>
      </div>
    </nav>
  );
}
