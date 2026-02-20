import React, { useState } from 'react';
import './Navbar.css';
import AuthModal from './AuthModal';

const Navbar = ({ user, onAuthChange, onOpenSection, onOpenProfile, theme, onToggleTheme }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left" onClick={() => onOpenSection?.('home')}>
            <div className="nav-logo-wrap">
              <div className="nav-logo-fallback">BuySmart</div>
            </div>
          </div>

          <div className="navbar-links">
            <button className="navlink" onClick={() => onOpenSection?.('home')}>Home</button>
            <button className="navlink" onClick={() => onOpenSection?.('search')}>Search</button>
            <button className="navlink" onClick={() => onOpenSection?.('trending')}>Trending</button>
          </div>

          <div className="navbar-right">
            <button className="nav-theme-toggle" onClick={onToggleTheme}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <button className="userpill" onClick={() => onOpenProfile?.()}>
                <div className="user-avatar">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="userpill-name">{user.name || 'User'}</span>
                  <span className="userpill-email">{user.email}</span>
                </div>
              </button>
            ) : (
              <div className="user-actions">
                <button
                  className="navbtn"
                  onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
                >
                  Login
                </button>
                <button
                  className="navbtn primary"
                  onClick={() => { setAuthMode('register'); setAuthOpen(true); }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthChange={onAuthChange}
      />
    </>
  );
};

export default Navbar;


