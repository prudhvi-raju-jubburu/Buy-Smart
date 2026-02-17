# BuySmart Project Review & Status

## ✅ Completed Features

### Backend (Flask + SQLite)
1. **User Authentication & Profile**
   - ✅ Register/Login/Logout endpoints
   - ✅ Token-based auth (Bearer tokens)
   - ✅ User profile management
   - ✅ Admin role support

2. **Product Search & Recommendations**
   - ✅ TF-IDF based content recommendation
   - ✅ Hybrid rule-based ranking (price, rating, platform trust, review count)
   - ✅ Product search with filters (price, platform, rating)
   - ✅ Auto-fetch from Meesho/Myntra APIs when DB is empty

3. **Data Sources**
   - ✅ Amazon scraper (simulated)
   - ✅ Flipkart scraper (simulated)
   - ✅ Meesho API integration (DummyJSON)
   - ✅ Myntra API integration (FakeStore)
   - ✅ Bootstrap data loading on startup

4. **User Features**
   - ✅ Wishlist management
   - ✅ Search history tracking
   - ✅ Simulated purchase tracking
   - ✅ Price drop alerts (simulated email)
   - ✅ Secure redirect with click analytics

5. **Analytics & Admin**
   - ✅ Public analytics endpoint (`/api/analytics/overview`)
   - ✅ Admin analytics endpoint (`/api/admin/analytics`)
   - ✅ Click analytics by platform/source
   - ✅ Recommendation effectiveness metrics
   - ✅ Conversion rate tracking
   - ✅ Trending products/searches

6. **Price Tracking**
   - ✅ Price history storage
   - ✅ Price drop alert system
   - ✅ Scheduled price checking

### Frontend (React)
1. **UI Components**
   - ✅ Responsive Navbar with logo
   - ✅ Login/Register modal
   - ✅ Search section with filters
   - ✅ Product cards with INR pricing
   - ✅ Trending products section
   - ✅ Platform cards (Amazon, Flipkart, Meesho, Myntra)
   - ✅ User profile panel (wishlist, purchases, history, logout)
   - ✅ **NEW: Analytics Dashboard** with charts

2. **Analytics Dashboard** (NEW)
   - ✅ KPI cards (Total Products, Users, Clicks, Purchases, Conversion Rate, Recommendation CTR)
   - ✅ Platform popularity chart (bar chart)
   - ✅ Click source distribution (pie chart)
   - ✅ Products by platform (bar chart)
   - ✅ Price comparison chart (mean vs median)
   - ✅ Recommendation effectiveness metrics
   - ✅ Time period selector (7/30/90 days)

3. **Features**
   - ✅ Product comparison (select up to 3 products)
   - ✅ Price history viewing
   - ✅ Secure redirect to seller sites
   - ✅ Wishlist management
   - ✅ Purchase confirmation

## 📊 Analytics Dashboard Features

The new Analytics Dashboard includes:

1. **Key Performance Indicators (KPIs)**
   - Total Products
   - Total Users
   - Total Clicks
   - Total Purchases
   - Conversion Rate
   - Recommendation CTR

2. **Visual Charts**
   - Platform Popularity (clicks by platform)
   - Click Source Distribution (search vs recommendation)
   - Products by Platform
   - Price Comparison (mean vs median prices)

3. **Recommendation System Analysis**
   - Recommendation clicks vs Search clicks
   - Recommendation CTR (Click-Through Rate)
   - Effectiveness metrics

4. **Additional Statistics**
   - Recent price drop alerts
   - Top categories
   - Last scraped timestamps per platform

## 🔧 Technical Stack

### Backend
- Flask 3.0+
- SQLAlchemy (SQLite)
- scikit-learn (TF-IDF)
- BeautifulSoup4 + Selenium (scraping)
- schedule (background tasks)

### Frontend
- React 18
- Recharts (charting library)
- Axios (API calls)
- CSS3 (responsive design)

## 🚀 How to Run

### Backend
```bash
cd backend
python run.py
```
Backend runs on `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install  # if first time
npm start
```
Frontend runs on `http://localhost:3000`

## 📝 API Endpoints

### Public Endpoints
- `GET /api/analytics/overview` - Analytics dashboard data
- `GET /api/stats` - Basic statistics
- `GET /api/products` - List products
- `GET /api/search` - Search products
- `GET /api/trending/products` - Trending products
- `GET /api/trending/searches` - Trending searches

### Auth Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (returns token)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### User Features (require auth)
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/<id>` - Remove from wishlist
- `GET /api/purchases` - Get purchases
- `POST /api/purchases/confirm` - Confirm purchase
- `GET /api/history/search` - Search history
- `GET /api/alerts/price-drop` - Price alerts
- `POST /api/alerts/price-drop` - Create price alert

### Admin Endpoints (require admin)
- `GET /api/admin/analytics` - Admin analytics

## ✅ Project Status: WORKING

### Verified Working:
1. ✅ Backend imports successfully
2. ✅ Database models are correct
3. ✅ All API endpoints defined
4. ✅ Frontend components exist
5. ✅ No linter errors
6. ✅ Analytics dashboard integrated
7. ✅ INR currency formatting
8. ✅ Logo support (fallback to text)

### Notes:
- Logo file should be placed at `frontend/public/buysmart-logo.png`
- Meesho/Myntra use public APIs (DummyJSON/FakeStore) for academic feasibility
- Price drop alerts are simulated (logged, not actually emailed)
- Purchases are simulated (manual confirmation)

## 🎯 Based on Paper (DOI: 10.17148/IARJSET.2025.12431)

This project extends the base paper's "Price Comparison Application" with:
1. **Product Recommendations** (TF-IDF + hybrid ranking)
2. **Analytics Dashboard** (comprehensive analysis UI)
3. **User Management** (login, profiles, wishlist)
4. **Click Analytics** (platform popularity, recommendation effectiveness)
5. **Price Tracking** (history, alerts)

All features are implemented at a **student/mini-project level** - lightweight, academically valid, and technically feasible.

