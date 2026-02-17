# Project Structure

```
Buy Smart/
│
├── app.py                 # Main Flask application with API endpoints
├── config.py              # Configuration settings
├── models.py              # Database models (Product, ScrapingLog)
├── scraper.py             # Web scraping module for e-commerce platforms
├── recommender.py         # ML-based recommendation engine
├── run.py                 # Simple script to run the application
│
├── requirements.txt       # Python dependencies
├── README.md              # Comprehensive documentation
├── QUICKSTART.md          # Quick start guide
├── PROJECT_STRUCTURE.md   # This file
│
├── static/                # Frontend files
│   ├── index.html        # Main web interface
│   ├── style.css         # Styling
│   └── script.js         # Frontend JavaScript
│
└── Project summary.docx   # Original project description
```

## Key Components

### Backend (Python/Flask)

1. **app.py** - Main application
   - RESTful API endpoints
   - Scheduled scraping background task
   - Request handling and response formatting

2. **models.py** - Database models
   - `Product`: Stores product information
   - `ScrapingLog`: Tracks scraping operations

3. **scraper.py** - Web scraping
   - `BaseScraper`: Base class with common functionality
   - `AmazonScraper`: Amazon-specific scraper
   - `FlipkartScraper`: Flipkart-specific scraper
   - `ScraperManager`: Coordinates multiple scrapers

4. **recommender.py** - Recommendation engine
   - TF-IDF vectorization
   - Cosine similarity calculation
   - Rule-based scoring
   - Hybrid ranking system

5. **config.py** - Configuration
   - Application settings
   - Scraping parameters
   - Recommendation parameters
   - Scoring weights

### Frontend (HTML/CSS/JavaScript)

1. **static/index.html** - Main interface
   - Search functionality
   - Filter options
   - Product display
   - Statistics dashboard

2. **static/style.css** - Styling
   - Modern, responsive design
   - Gradient themes
   - Card-based layout

3. **static/script.js** - Frontend logic
   - API communication
   - Search functionality
   - Result rendering
   - Filter management

## Data Flow

```
User Search Query
    ↓
API Endpoint (/api/search)
    ↓
Recommender.find_similar_products()
    ↓
TF-IDF Vectorization + Cosine Similarity
    ↓
Rule-based Scoring (Price, Rating, Platform, Reviews)
    ↓
Hybrid Ranking
    ↓
Return Ranked Results
    ↓
Frontend Display
```

## Scheduled Operations

```
Background Scheduler (every 6 hours)
    ↓
Scrape Trending Products
    ↓
Update Database
    ↓
Retrain Recommendation Model
```

## API Endpoints

- `GET /` - Frontend interface
- `GET /api` - API information
- `POST /api/search` - Search and recommend products
- `GET /api/products` - Get all products with filters
- `GET /api/products/<id>` - Get specific product
- `POST /api/scrape` - Trigger manual scraping
- `GET /api/stats` - Get system statistics
- `GET /api/scraping-logs` - Get scraping logs
- `POST /api/recommendations/update-scores` - Update recommendation scores

## Database Schema

### Products Table
- id, name, description, price, original_price
- rating, review_count, platform, product_url
- image_url, category, brand, availability
- recommendation_score, last_updated, created_at

### Scraping Logs Table
- id, platform, status, products_scraped
- errors, started_at, completed_at, duration_seconds



