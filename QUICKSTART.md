# Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- Chrome browser

## Quick Setup

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Run backend server
python run.py
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

Frontend will run on `http://localhost:3000` and open automatically in your browser.

## First Steps

1. **Scrape some products** (via API):
   ```bash
   curl -X POST http://localhost:5000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"platform": "amazon", "query": "laptop", "max_results": 10}'
   ```

2. **Search for products** using the web interface:
   - Go to `http://localhost:3000`
   - Enter a search term (e.g., "laptop")
   - Click "Search"

3. **Use filters**:
   - Set price range
   - Select platforms
   - Set minimum rating

## Troubleshooting

**Backend won't start:**
- Make sure port 5000 is not in use
- Check that all dependencies are installed
- Verify Python version is 3.8+

**Frontend won't start:**
- Make sure Node.js is installed (`node --version`)
- Delete `node_modules` and run `npm install` again
- Check that port 3000 is not in use

**No products found:**
- Run manual scraping first using the `/api/scrape` endpoint
- Check backend logs for errors

**CORS errors:**
- Make sure backend is running on port 5000
- Check that CORS is enabled in `backend/app.py`

## Development Tips

- Backend auto-reloads on file changes (Flask debug mode)
- Frontend hot-reloads on file changes (React development mode)
- Backend logs are visible in the terminal
- Frontend errors appear in browser console

## Next Steps

- Customize scraping intervals in `backend/config.py`
- Add more e-commerce platforms in `backend/scraper.py`
- Adjust recommendation weights in `backend/config.py`
- Customize UI in `frontend/src/components/`
