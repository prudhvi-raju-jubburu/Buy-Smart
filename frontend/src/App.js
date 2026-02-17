import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import StatsBar from './components/StatsBar';
import ProductGrid from './components/ProductGrid';
import LoadingSpinner from './components/LoadingSpinner';
import TrendingSection from './components/TrendingSection';
import Navbar from './components/Navbar';
import HomePlatforms from './components/HomePlatforms';
import UserPanel from './components/UserPanel';
import Modal from './components/Modal';
import ComparisonChart from './components/ComparisonChart';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { searchProducts, getStats, getMe, getWishlist, getPurchases } from './services/api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    platforms: [],
    minRating: ''
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          alert('You can compare up to 3 products');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  useEffect(() => {
    loadStats();
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    const token = localStorage.getItem('buysmart_token');
    if (!token) return;
    try {
      const data = await getMe();
      setUser(data.user);
      await refreshUserCounts();
    } catch (_e) {
      localStorage.removeItem('buysmart_token');
      setUser(null);
    }
  };

  const refreshUserCounts = async () => {
    try {
      const [w, p] = await Promise.all([getWishlist(), getPurchases()]);
      // counts no longer shown on home; keep this for future use if needed
      void w;
      void p;
    } catch (_e) {
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (query, searchFilters) => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setLoading(true);
    setSearchQuery(query);
    setFilters(searchFilters);

    try {
      // If the query is new, this might take 10-15s due to Selenium
      const results = await searchProducts(query, searchFilters);
      setProducts(results.results || []);
      // Reload stats after search
      await loadStats();
    } catch (error) {
      console.error('Error searching products:', error);
      alert('Error searching for products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      platforms: [],
      minRating: ''
    });
  };

  return (
    <div className="App">
      <Navbar
        user={user}
        onAuthChange={async (u) => {
          setUser(u);
          if (u) {
            await refreshUserCounts();
          } else {
          }
        }}
        onOpenSection={(id) => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onOpenProfile={() => setUserPanelOpen(true)}
      />
      <Header />
      <UserPanel
        open={userPanelOpen}
        user={user}
        onClose={() => setUserPanelOpen(false)}
        onLogout={() => setUser(null)}
      />
      <div className="container" id="search">
        <SearchSection
          onSearch={handleSearch}
          filters={filters}
          onClearFilters={handleClearFilters}
        />
        <StatsBar stats={stats} />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '20px', color: '#6c5ce7', fontWeight: '500', fontSize: '1.2em' }}>
              🔍 Searching for best products...<br />
              <span style={{ fontSize: '1em', opacity: 0.8, marginTop: 10, display: 'block' }}>
                Checking Amazon, Flipkart, Meesho, and Myntra for you
              </span>
              <span style={{ fontSize: '0.9em', opacity: 0.7, marginTop: 5, display: 'block' }}>
                This takes 5-10 seconds to get latest prices
              </span>
            </p>
          </div>
        ) : (
          <ProductGrid
            products={products}
            searchQuery={searchQuery}
            user={user}
            selectedProducts={selectedProducts}
            onToggleSelect={toggleProductSelection}
          />
        )}
      </div>

      {selectedProducts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#fff',
          padding: 15,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 15,
          zIndex: 900
        }}>
          <div>
            <strong>{selectedProducts.length}</strong> products selected
          </div>
          <button
            className="action-btn"
            style={{ background: '#007185', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
            onClick={() => setShowComparison(true)}
          >
            Compare Now
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
            onClick={() => setSelectedProducts([])}
          >
            Clear
          </button>
        </div>
      )}

      <Modal isOpen={showComparison} onClose={() => setShowComparison(false)} title="Product Comparison">
        <ComparisonChart products={selectedProducts} />
      </Modal>

      <div className="container" style={{ marginTop: '12px' }}>
        <HomePlatforms />
        <div id="trending">
          <TrendingSection user={user} />
        </div>
      </div>

      <div className="container" style={{ marginTop: '12px' }}>
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

export default App;


