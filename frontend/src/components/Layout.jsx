import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

// Shared page frame. Keying <main> by pathname replays the short (<100ms) route fade-in.
export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" key={pathname} className="page">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
