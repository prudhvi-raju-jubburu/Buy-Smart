import React, { useState } from 'react';
import './AuthBar.css';
import { loginUser, registerUser, logoutUser } from '../services/api';

const AuthBar = ({ user, onAuthChange }) => {
  const [mode, setMode] = useState('login'); // login | register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('buysmart_token', data.token);
      onAuthChange(data.user);
      setPassword('');
    } catch (e) {
      alert(e?.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true);
    try {
      await registerUser({ name, email, password });
      // auto-login after register for convenience
      await handleLogin();
    } catch (e) {
      alert(e?.response?.data?.error || 'Register failed');
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutUser();
    } catch (_e) {
      // ignore
    } finally {
      localStorage.removeItem('buysmart_token');
      onAuthChange(null);
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="authbar">
        <div className="authbar-left">
          Logged in as <b>{user.name}</b> ({user.email})
        </div>
        <button className="authbar-btn" onClick={handleLogout} disabled={busy}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="authbar">
      <div className="authbar-modes">
        <button
          className={`authbar-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
          disabled={busy}
        >
          Login
        </button>
        <button
          className={`authbar-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
          disabled={busy}
        >
          Register
        </button>
      </div>

      {mode === 'register' && (
        <input
          className="authbar-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
      )}
      <input
        className="authbar-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="authbar-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button
        className="authbar-btn"
        onClick={mode === 'login' ? handleLogin : handleRegister}
        disabled={busy}
      >
        {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
      </button>
    </div>
  );
};

export default AuthBar;


