import React from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.css';

const ProductGrid = ({ products, searchQuery, user, selectedProducts, onToggleSelect }) => {
  if (products.length === 0 && searchQuery) {
    return (
      <div className="no-results">
        <h2>😔 No products found</h2>
        <p>Try searching with different words or remove some filters</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-results" style={{ marginTop: '2rem' }}>
        <h2>👆 Ready to shop?</h2>
        <p>Type what you want to buy in the search box above to find the best deals.</p>
      </div>
    );
  }

  return (
    <div className="product-grid-container">
      <div className="results-count">
        ☀️ Showing Top {products.length} Best Products for You
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            user={user}
            source="search"
            searchQuery={searchQuery}
            isSelected={selectedProducts?.some(p => p.id === product.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
