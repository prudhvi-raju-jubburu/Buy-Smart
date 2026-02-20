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
import SearchAnalytics from './components/SearchAnalytics';
import { searchProducts, getStats, getMe, getWishlist, getPurchases } from './services/api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // home | search | trending | analytics
  const [theme, setTheme] = useState(localStorage.getItem('buysmart_theme') || 'dark');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    platforms: ['Amazon', 'Flipkart', 'Meesho', 'Myntra'],
    minRating: '',
    fastMode: true,
    includeLiveScraping: true
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('buysmart_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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

      if (results.message) {
        // Option to show a toast or alert if fallback occurred
        console.log(results.message);
      }

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
      platforms: ['Amazon', 'Flipkart', 'Meesho', 'Myntra'],
      minRating: '',
      fastMode: true,
      includeLiveScraping: true
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
          }
        }}
        onOpenSection={(id) => setActiveTab(id)}
        onOpenProfile={() => setUserPanelOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="main-scroll-area">
        <Header />
        <UserPanel
          open={userPanelOpen}
          user={user}
          onClose={() => setUserPanelOpen(false)}
          onLogout={() => setUser(null)}
        />
        {activeTab === 'search' && (
          <main className="container main-content">
            <SearchSection
              onSearch={handleSearch}
              filters={filters}
              onClearFilters={handleClearFilters}
            />
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {products.length > 0 && <SearchAnalytics products={products} />}
                <ProductGrid
                  products={products}
                  searchQuery={searchQuery}
                  user={user}
                  selectedProducts={selectedProducts}
                  onToggleSelect={toggleProductSelection}
                />
              </>
            )}
          </main>
        )}

        {selectedProducts.length > 0 && (
          <div className="comparison-bar">
            <div>
              <strong>{selectedProducts.length}</strong> products selected
            </div>
            <button
              className="compare-btn"
              onClick={() => setShowComparison(true)}
            >
              Compare Now
            </button>
            <button
              className="clear-btn"
              onClick={() => setSelectedProducts([])}
            >
              Clear Selected
            </button>
          </div>
        )}

        <Modal isOpen={showComparison} onClose={() => setShowComparison(false)} title="Product Comparison">
          <ComparisonChart products={selectedProducts} />
        </Modal>

        {activeTab === 'home' && (
          <div className="container tab-content">
            <HomePlatforms />
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="container tab-content">
            <TrendingSection user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


