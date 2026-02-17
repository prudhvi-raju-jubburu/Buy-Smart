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
        <button type="submit" className="search-btn">Search</button>
      </form>

      <div className="filters">
        <div className="filter-group">
          <label style={{ fontSize: '1.1em', fontWeight: 'bold' }}>💰 Price Range (₹):</label>
          <input
            type="number"
            value={localFilters.minPrice}
            onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
            placeholder="Min"
            step="0.01"
            className="filter-input"
          />
          <span>-</span>
          <input
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
            placeholder="Max"
            step="0.01"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '1.1em', fontWeight: 'bold' }}>🛒 Shop From:</label>
          <div className="platform-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={localFilters.platforms?.includes('Amazon') || false}
                onChange={() => handlePlatformChange('Amazon')}
              />
              Amazon
            </label>
            <label>
              <input
                type="checkbox"
                checked={localFilters.platforms?.includes('Flipkart') || false}
                onChange={() => handlePlatformChange('Flipkart')}
              />
              Flipkart
            </label>
            <label>
              <input
                type="checkbox"
                checked={localFilters.platforms?.includes('Meesho') || false}
                onChange={() => handlePlatformChange('Meesho')}
              />
              Meesho
            </label>
            <label>
              <input
                type="checkbox"
                checked={localFilters.platforms?.includes('Myntra') || false}
                onChange={() => handlePlatformChange('Myntra')}
              />
              Myntra
            </label>
          </div>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '1.1em', fontWeight: 'bold' }}>⭐ Minimum Rating:</label>
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
          onClick={() => {
            const cleared = {
              minPrice: '',
              maxPrice: '',
              platforms: [],
              minRating: ''
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
  );
};

export default SearchSection;

