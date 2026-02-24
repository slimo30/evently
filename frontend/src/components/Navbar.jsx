import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, LogOut, LayoutDashboard, ShieldCheck, QrCode, Menu, X, History } from 'lucide-react';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="glass sticky-nav">
      <div className="container nav-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <Calendar className="icon-primary" />
          <span>Evently</span>
        </Link>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Explore</Link>

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="nav-link admin-link" onClick={closeMenu}>
                  <ShieldCheck size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}
              {(user.role === 'ADMIN' || user.role === 'EVENT_OWNER') && (
                <>
                  <Link to="/organizer" className="nav-link organizer-link" onClick={closeMenu}>
                    <LayoutDashboard size={18} />
                    <span>Hub</span>
                  </Link>
                  <Link to="/organizer/scanner" className="nav-link" onClick={closeMenu}>
                    <QrCode size={18} />
                    <span>Scan</span>
                  </Link>
                </>
              )}
              <Link to="/profile" className="nav-link" onClick={closeMenu}>
                <User size={18} />
                <span>Profile</span>
              </Link>
              <Link to="/history" className="nav-link" onClick={closeMenu}>
                <History size={18} />
                <span>History</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18} />
                <span className="mobile-only">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenu}>Join Now</Link>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .sticky-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 70px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }
        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .icon-primary {
          color: var(--primary);
        }
        .mobile-toggle {
          display: none;
          color: var(--text-main);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .nav-link:hover {
          color: var(--primary);
        }
        .admin-link {
          color: var(--accent);
          font-weight: 600;
        }
        .admin-link:hover {
          color: var(--accent);
          opacity: 0.8;
        }
        .organizer-link {
          color: var(--primary);
          font-weight: 600;
        }
        .organizer-link:hover {
          opacity: 0.8;
        }
        .btn-logout {
          color: var(--text-muted);
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-logout:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-toggle {
            display: block;
          }
          .nav-links {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            flex-direction: column;
            padding: 2rem;
            gap: 2rem;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            z-index: 1000;
          }
          .nav-links.open {
            transform: translateX(0);
          }
          .nav-link {
            font-size: 1.25rem;
            width: 100%;
            justify-content: center;
          }
          .btn-logout {
            width: 100%;
            justify-content: center;
            border-radius: var(--radius-sm);
            background: var(--bg-main);
            padding: 1rem;
          }
          .mobile-only {
            display: inline;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
