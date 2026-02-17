import React, { useState } from 'react';
import './ProductCard.css';
import { addToWishlist, createRedirect, confirmPurchase, getProductPriceHistory } from '../services/api';
import Modal from './Modal';
import PriceHistoryChart from './PriceHistoryChart';

const ProductCard = ({ product, user, source = 'search', searchQuery, isSelected, onToggleSelect }) => {
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getProductPriceHistory(product.id);
      setHistoryData(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatINR = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="rating-stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  return (
    <div className={`product-card ${isSelected ? 'selected' : ''}`}>
      <div className="product-selection-overlay">
        <label>
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect(product)}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <span style={{ marginLeft: 5, fontSize: '0.8rem', color: '#666' }}>Compare</span>
        </label>
      </div>
      <div className="product-header">
        <div className="product-name" style={{ fontSize: '1.3em', fontWeight: 'bold', lineHeight: 1.4 }}>
          {product.name || 'Unknown Product'}
        </div>
        <div className="product-platform" style={{ fontSize: '1em', marginTop: 8 }}>
          From: <strong>{product.platform}</strong>
        </div>
      </div>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      <div className="product-price" style={{ fontSize: '2.2em', fontWeight: 'bold', color: '#10b981', margin: '15px 0' }}>
        {formatINR(product.price || 0)}
        {product.original_price && product.original_price > product.price && (
          <span className="product-original-price" style={{ fontSize: '0.6em', display: 'block', marginTop: 5 }}>
            Was: {formatINR(product.original_price)}
          </span>
        )}
      </div>

      {product.rating && (
        <div className="product-rating" style={{ fontSize: '1.1em', marginBottom: 10 }}>
          <div style={{ marginBottom: 5 }}>
            {renderStars(product.rating)}
            <span className="rating-value" style={{ marginLeft: 8, fontWeight: 'bold' }}>
              {product.rating.toFixed(1)} out of 5
            </span>
          </div>
          {product.review_count && (
            <div className="review-count" style={{ color: '#6c757d', fontSize: '0.95em' }}>
              {product.review_count.toLocaleString()} people reviewed this
            </div>
          )}
        </div>
      )}

      {product.description && (
        <div className="product-description">
          {product.description.length > 200
            ? `${product.description.substring(0, 200)}...`
            : product.description}
        </div>
      )}

      {/* Simple badges for easy understanding */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {product.platform === 'Amazon' && (
          <span style={{ background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: '0.85em', fontWeight: 'bold' }}>
            ✓ Trusted Site
          </span>
        )}
        {product.rating && product.rating >= 4.0 && (
          <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: '0.85em', fontWeight: 'bold' }}>
            ⭐ High Rating
          </span>
        )}
        {product.price && (
          <span style={{ background: '#2563eb', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: '0.85em', fontWeight: 'bold' }}>
            💰 Best Price
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 15 }}>
        <button
          className="product-link"
          style={{ fontSize: '1.1em', padding: '12px 20px', fontWeight: 'bold' }}
          onClick={async () => {
            setBusy(true);
            try {
              const data = await createRedirect({
                product_id: product.id,
                source: source || 'search',
                search_query: searchQuery,
              });
              window.open(`http://localhost:5000${data.redirect_url}`, '_blank', 'noopener,noreferrer');
            } catch (e) {
              // Fallback to direct URL
              if (product.product_url) {
                window.open(product.product_url, '_blank', 'noopener,noreferrer');
              } else {
                alert('Product link not available');
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          🛒 Buy Now on {product.platform}
        </button>

        {user && (
          <button
            className="product-link"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                // Send full product data for real-time products
                await addToWishlist(product.id, { product_data: product });
                alert('✅ Added to wishlist!');
              } catch (e) {
                alert(e?.response?.data?.error || 'Wishlist failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            ❤️ Save for Later
          </button>
        )}
      </div>

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`Price History: ${product.name}`}>
        {loadingHistory ? (
          <div>Loading...</div>
        ) : (
          <PriceHistoryChart data={historyData} />
        )}
      </Modal>
    </div>
  );
};

export default ProductCard;


