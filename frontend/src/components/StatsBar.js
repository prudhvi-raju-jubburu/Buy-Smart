import React from 'react';
import './StatsBar.css';

const StatsBar = ({ stats }) => {
  const formatINR = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  };

  if (!stats) {
    return (
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Loading...</span>
        </div>
      </div>
    );
  }

  // Removed Status/Sources/Mode section as requested
  return null;
};

export default StatsBar;


