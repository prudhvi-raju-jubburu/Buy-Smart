import React, { useState, useEffect } from 'react';
import './SearchSection.css';

const SearchSection = ({ onSearch, filters, onClearFilters }) => {
  const [query, setQuery] = useState('');
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, localFilters);
  };

  const handlePlatformChange = (platform) => {
    const platforms = localFilters.platforms || [];
    const newPlatforms = platforms.includes(platform)
      ? platforms.filter(p => p !== platform)
      : [...platforms, platform];
    setLocalFilters({ ...localFilters, platforms: newPlatforms });
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type what you want to buy (example: laptop, phone, headphones)"
          className="search-input"
        />
        <button type="submit" className="search-btn">Find Best Deals</button>
      </form>

      <div className="filters">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">⚡ Search Mode:</span>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.fastMode !== false}
                onChange={(e) => setLocalFilters({ ...localFilters, fastMode: e.target.checked })}
              />
              Fast (Recommended)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!localFilters.includeLiveScraping}
                onChange={(e) => setLocalFilters({ ...localFilters, includeLiveScraping: e.target.checked })}
              />
              Include Live Amazon/Flipkart (Slow)
            </label>
          </div>

          <div className="filter-group">
            <span className="filter-label">💰 Price Range (₹):</span>
            <input
              type="number"
              value={localFilters.minPrice}
              onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
              placeholder="Min"
              className="filter-input"
            />
            <span style={{ color: 'var(--text-dim)' }}>-</span>
            <input
              type="number"
              value={localFilters.maxPrice}
              onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
              placeholder="Max"
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">🛒 Shop From:</span>
            <div className="platform-checkboxes">
              {['Amazon', 'Flipkart', 'Meesho', 'Myntra'].map(p => (
                <label key={p} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.platforms?.includes(p) || false}
                    onChange={() => handlePlatformChange(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">⭐ Minimum Rating:</span>
            <input
              type="number"
              value={localFilters.minRating}
              onChange={(e) => setLocalFilters({ ...localFilters, minRating: e.target.value })}
              placeholder="0.0"
              min="0"
              max="5"
              step="0.1"
              className="filter-input"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const cleared = {
                minPrice: '',
                maxPrice: '',
                platforms: [],
                minRating: '',
                fastMode: true,
                includeLiveScraping: false
              };
              setLocalFilters(cleared);
              onClearFilters();
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;

