import React, { useState } from 'react';
import './Navbar.css';
import AuthModal from './AuthModal';

const Navbar = ({ user, onAuthChange, onOpenSection, onOpenProfile }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  return (
    <>
      <div className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left" onClick={() => onOpenSection?.('home')}>
            <div className="nav-logo-wrap">
              <img className="nav-logo" src="/buysmart-logo.png" alt="BuySmart logo" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.nav-logo-fallback').style.display = 'inline-block'; }} />
              <div className="nav-logo-fallback">BuySmart</div>
            </div>
            <div className="tagline">Price compare + recommendations</div>
          </div>

          <div className="navbar-links">
            <button className="navlink" onClick={() => onOpenSection?.('home')}>Home</button>
            <button className="navlink" onClick={() => onOpenSection?.('search')}>Search</button>
            <button className="navlink" onClick={() => onOpenSection?.('trending')}>Trending</button>
            <button className="navlink" onClick={() => onOpenSection?.('analytics')}>Analytics</button>
          </div>

          <div className="navbar-right">
            {user ? (
              <button className="userpill clickable" onClick={() => onOpenProfile?.()}>
                <span className="userpill-name">{user.name}</span>
                <span className="userpill-email">{user.email}</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

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


