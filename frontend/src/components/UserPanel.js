import React, { useEffect, useState } from 'react';
import './UserPanel.css';
import { getWishlist, getPurchases, getSearchHistory, removeFromWishlist, logoutUser } from '../services/api';

const TabBtn = ({ active, onClick, children }) => (
  <button className={`up-tab ${active ? 'active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

const UserPanel = ({ open, user, onClose, onLogout }) => {
  const [tab, setTab] = useState('wishlist'); // wishlist | purchases
  const [wishlist, setWishlist] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Fetch individually so one failure doesn't block the rest
      getWishlist().then(w => setWishlist(w.items || [])).catch(() => setWishlist([]));
      getPurchases().then(p => setPurchases(p.items || [])).catch(() => setPurchases([]));

    } finally {
      // Small delay to show loading state if it's too fast
      setTimeout(() => setBusy(false), 500);
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
                  <div className="up-row-btns">
                    {item.product?.product_url && (
                      <button
                        className="up-btn small primary"
                        onClick={() => window.open(item.product.product_url, '_blank')}
                      >
                        View Deal
                      </button>
                    )}
                    <button
                      className="up-btn small danger"
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
                  <div className="up-row-btns">
                    {p.product?.product_url && (
                      <button
                        className="up-btn small primary"
                        onClick={() => window.open(p.product.product_url, '_blank')}
                      >
                        Buy Again
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPanel;





