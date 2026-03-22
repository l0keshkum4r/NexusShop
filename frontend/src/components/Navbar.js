import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useCart } from '../services/useCart';
import { interactionAPI } from '../services/api';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    if (user) interactionAPI.addSearchHistory(search).catch(() => {});
    navigate(`/?search=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Nexus<span>Shop</span></span>
        </Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        {/* Nav links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          {user && (
            <Link to="/wishlist" className={location.pathname === '/wishlist' ? 'active' : ''}>
              Wishlist
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={`nav-admin ${location.pathname === '/admin' ? 'active' : ''}`}>
              Admin
            </Link>
          )}

          {user ? (
            <>
              <Link to="/cart" className="cart-link">
                <span>🛒</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <div className="nav-user">
                <span className="user-avatar">{user.name[0].toUpperCase()}</span>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
