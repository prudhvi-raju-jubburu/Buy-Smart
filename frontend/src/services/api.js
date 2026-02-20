import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('buysmart_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const searchProducts = async (query, filters = {}) => {
  const requestData = {
    query: query,
    filters: {
      min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      platforms: filters.platforms && filters.platforms.length > 0 ? filters.platforms : undefined,
      min_rating: filters.minRating ? parseFloat(filters.minRating) : undefined,
    },
    top_n: 50,
    fast_mode: filters.fastMode !== false,
    include_live_scraping: !!filters.includeLiveScraping,
  };

  // Remove undefined values
  Object.keys(requestData.filters).forEach(
    (key) => requestData.filters[key] === undefined && delete requestData.filters[key]
  );

  const response = await api.post('/search', requestData);
  return response.data;
};

export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export const getProductPriceHistory = async (productId) => {
  const response = await api.get(`/products/${productId}/price-history`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const triggerScraping = async (data = {}) => {
  const response = await api.post('/scrape', data);
  return response.data;
};

export const getScrapingLogs = async (params = {}) => {
  const response = await api.get('/scraping-logs', { params });
  return response.data;
};

// Auth
export const registerUser = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Trending + redirect + wishlist + purchases
export const getTrendingProducts = async (params = {}) => {
  const response = await api.get('/trending/products', { params });
  return response.data;
};

export const createRedirect = async ({ product_id, source, search_query, product_data }) => {
  const response = await api.post('/redirect/create', { product_id, source, search_query, product_data });
  return response.data;
};

export const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data;
};

export const addToWishlist = async (product_id, options = {}) => {
  const response = await api.post('/wishlist', { product_id, ...options });
  return response.data;
};

export const removeFromWishlist = async (product_id) => {
  const response = await api.delete(`/wishlist/${product_id}`);
  return response.data;
};

export const getPurchases = async () => {
  const response = await api.get('/purchases');
  return response.data;
};

export const confirmPurchase = async ({ product_id, platform, status, product_data }) => {
  const response = await api.post('/purchases/confirm', { product_id, platform, status, product_data });
  return response.data;
};

export const getSearchHistory = async (params = {}) => {
  const response = await api.get('/history/search', { params });
  return response.data;
};

// Analytics
export const getAnalyticsOverview = async (days = 30) => {
  const response = await api.get('/analytics/overview', { params: { days } });
  return response.data;
};

export default api;


