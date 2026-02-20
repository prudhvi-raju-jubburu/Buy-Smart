import React, { useEffect, useState } from 'react';
import './UserPanel.css';
import { getWishlist, getPurchases, getSearchHistory, removeFromWishlist, logoutUser } from '../services/api';

const TabBtn = ({ active, onClick, children }) => (
  <button className={`up-tab ${active ? 'active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

const UserPanel = ({ open, user, onClose, onLogout }) => {
  const [tab, setTab] = useState('wishlist'); // wishlist | purchases | history | profile
  const [wishlist, setWishlist] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const [w, p, h] = await Promise.all([
        getWishlist(),
        getPurchases(),
        getSearchHistory({ limit: 50 }),
      ]);
      setWishlist(w.items || []);
      setPurchases(p.items || []);
      setHistory(h.items || []);
    } catch (_e) {
      setWishlist([]);
      setPurchases([]);
      setHistory([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && user) refresh();
  }, [open, user]);

  if (!open) return null;
  if (!user) return null;

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutUser();
    } catch (_e) {
      // ignore
    } finally {
      localStorage.removeItem('buysmart_token');
      onLogout?.();
      setBusy(false);
      onClose?.();
    }
  };

  return (
    <div className="up-backdrop" onClick={onClose}>
      <div className="up-panel" onClick={(e) => e.stopPropagation()}>
        <div className="up-header">
          <div>
            <div className="up-title">Profile</div>
            <div className="up-sub">{user.name} • {user.email}</div>
          </div>
          <button className="up-close" onClick={onClose}>✕</button>
        </div>

        <div className="up-tabs">
          <TabBtn active={tab === 'wishlist'} onClick={() => setTab('wishlist')}>Wishlist</TabBtn>
          <TabBtn active={tab === 'purchases'} onClick={() => setTab('purchases')}>Purchases</TabBtn>
          <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>Search History</TabBtn>
          <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')}>Settings</TabBtn>
        </div>

        <div className="up-body">
          <div className="up-actions">
            <button className="up-btn" onClick={refresh} disabled={busy}>{busy ? 'Loading...' : 'Refresh'}</button>
            <button className="up-btn danger" onClick={handleLogout} disabled={busy}>Logout</button>
          </div>

          {tab === 'wishlist' && (
            <div className="up-list">
              {wishlist.length === 0 ? (
                <div className="up-empty">No wishlist items yet.</div>
              ) : wishlist.map((item) => (
                <div key={item.id} className="up-row">
                  <div className="up-row-main">
                    <div className="up-row-title">{item.product?.name || 'Product'}</div>
                    <div className="up-row-sub">{item.product?.platform}</div>
                  </div>
                  <button
                    className="up-btn small"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await removeFromWishlist(item.product_id);
                        await refresh();
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'purchases' && (
            <div className="up-list">
              {purchases.length === 0 ? (
                <div className="up-empty">No purchases recorded yet (simulated).</div>
              ) : purchases.map((p) => (
                <div key={p.id} className="up-row">
                  <div className="up-row-main">
                    <div className="up-row-title">{p.product?.name || 'Product'}</div>
                    <div className="up-row-sub">{p.platform} • {p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="up-list">
              {history.length === 0 ? (
                <div className="up-empty">No search history yet.</div>
              ) : history.map((h) => (
                <div key={h.id} className="up-row">
                  <div className="up-row-main">
                    <div className="up-row-title">{h.query}</div>
                    <div className="up-row-sub">{new Date(h.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'profile' && (
            <div className="up-empty">
              Basic settings panel (mini-project). Use Logout button to sign out.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPanel;





