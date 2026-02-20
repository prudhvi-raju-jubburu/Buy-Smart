import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///products.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Scraping configuration
    SCRAPING_INTERVAL_HOURS = int(os.environ.get('SCRAPING_INTERVAL_HOURS', 6))
    REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 30))
    USER_AGENT = os.environ.get('USER_AGENT') or 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    # Real-time search behavior
    ENABLE_SELENIUM = os.environ.get('ENABLE_SELENIUM', '0') == '1'  # default off for speed/stability
    REALTIME_PLATFORM_TIMEOUT_SEC = int(os.environ.get('REALTIME_PLATFORM_TIMEOUT_SEC', 6))
    REALTIME_OVERALL_TIMEOUT_SEC = int(os.environ.get('REALTIME_OVERALL_TIMEOUT_SEC', 10))
    
    # Recommendation configuration
    TFIDF_MAX_FEATURES = int(os.environ.get('TFIDF_MAX_FEATURES', 5000))
    SIMILARITY_THRESHOLD = float(os.environ.get('SIMILARITY_THRESHOLD', 0.1))
    MAX_RECOMMENDATIONS = int(os.environ.get('MAX_RECOMMENDATIONS', 50))
    
    # Scoring weights
    PRICE_WEIGHT = float(os.environ.get('PRICE_WEIGHT', 0.3))
    RATING_WEIGHT = float(os.environ.get('RATING_WEIGHT', 0.3))
    PLATFORM_TRUST_WEIGHT = float(os.environ.get('PLATFORM_TRUST_WEIGHT', 0.2))
    REVIEW_COUNT_WEIGHT = float(os.environ.get('REVIEW_COUNT_WEIGHT', 0.2))





