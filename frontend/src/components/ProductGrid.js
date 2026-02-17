import React from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.css';

const ProductGrid = ({ products, searchQuery, user, selectedProducts, onToggleSelect }) => {
  if (products.length === 0 && searchQuery) {
    return (
      <div className="no-results" style={{ textAlign: 'center', padding: '40px', fontSize: '1.2em' }}>
        <p style={{ color: '#6c757d', marginBottom: 10 }}>😔 No products found</p>
        <p style={{ color: '#495057' }}>Try searching with different words or remove some filters</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-results" style={{ textAlign: 'center', padding: '40px', fontSize: '1.2em' }}>
        <p style={{ color: '#6c757d' }}>👆 Type what you want to buy in the search box above</p>
      </div>
    );
  }

  return (
    <div className="product-grid-container">
      <div className="results-count" style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: 20, color: '#2563eb' }}>
        ✅ Showing Top {products.length} Best Products for You
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
