import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>🔍 Finding the best deals for you...</p>
      <span style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
        Scanning multiple platforms. This might take a few seconds.
      </span>
    </div>
  );
};

export default LoadingSpinner;





