"""
Web scraping module for collecting product data from multiple e-commerce platforms
"""
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
import random
from datetime import datetime
from models import Product, ScrapingLog, PriceHistory, db
from config import Config
from fake_useragent import UserAgent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseScraper:
    """Base class for all scrapers"""
    
    def __init__(self):
        self.session = requests.Session()
        self.ua = UserAgent()
        self.headers = {
            'User-Agent': self.ua.random,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        self.timeout = Config.REQUEST_TIMEOUT

    def get_soup(self, url):
        """Get BeautifulSoup object from URL using requests (fallback or API)"""
        try:
            self.headers['User-Agent'] = self.ua.random
            response = self.session.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'lxml')
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    def extract_price(self, text):
        """Extract price from text"""
        if not text:
            return None
        # Remove currency symbols and extract numbers
        # Matches numbers like 1,234.56 or 1234
        try:
            # simple cleanup
            clean = re.sub(r'[^\d.]', '', str(text).replace(',', ''))
            return float(clean)
        except:
            return None
    
    def extract_rating(self, text):
        """Extract rating from text"""
        if not text:
            return None
        try:
            # look for pattern like "4.5"
            match = re.search(r'(\d+(\.\d+)?)', str(text))
            if match:
                val = float(match.group(1))
                return min(5.0, max(0.0, val))
        except:
            pass
        return None
    
    def extract_review_count(self, text):
        """Extract review count from text"""
        if not text:
            return 0
        try:
            # "1,234 ratings" -> 1234
            clean = re.sub(r'[^\d]', '', str(text))
            return int(clean)
        except:
            return 0

class SeleniumScraper(BaseScraper):
    """Base for Selenium-based scraping"""
    
    def __init__(self):
        super().__init__()
        self.driver = None

    def _setup_driver(self):
        options = ChromeOptions()
        options.add_argument("--headless=new") 
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--start-maximized")
        options.add_argument(f"user-agent={self.ua.random}")
        # Mask automation
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        try:
            self.driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            self.driver = None

    def _teardown_driver(self):
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None

    def get_page_source_selenium(self, url):
        if not self.driver:
            self._setup_driver()
        if not self.driver:
            return None
        
        try:
            self.driver.get(url)
            # Wait for body to be present
            WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Scroll to trigger lazy loading
            self.driver.execute_script("window.scrollTo(0, 500);")
            time.sleep(2)
            self.driver.execute_script("window.scrollTo(0, 1000);")
            time.sleep(1)
            
            return self.driver.page_source
        except Exception as e:
            logger.error(f"Error getting page with Selenium {url}: {e}")
            self._teardown_driver()
            return None

class AmazonScraper(SeleniumScraper):
    """Scraper for Amazon products"""
    
    def __init__(self):
        super().__init__()
        self.platform = "Amazon"
    
    def search_products(self, query, max_results=10):
        """Search for products on Amazon using Selenium"""
        search_url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
        
        products = []
        try:
            source = self.get_page_source_selenium(search_url)
            if not source:
                return []
            
            soup = BeautifulSoup(source, 'lxml')
            
            # Expanded selectors for different layouts
            items = []
            items.extend(soup.find_all('div', {'data-component-type': 's-search-result'}))
            
            for item in items[:max_results]:
                try:
                    # Title
                    name_tag = item.find('h2')
                    if not name_tag: continue
                    name = name_tag.get_text(strip=True)
                    
                    # Link
                    link_tag = item.find('a', class_='a-link-normal s-no-outline') or item.find('a', class_='a-link-normal')
                    if not link_tag: continue
                    relative_url = link_tag.get('href')
                    if not relative_url or relative_url.startswith('javascript'): continue
                    
                    if relative_url.startswith('http'):
                        product_url = relative_url
                    else:
                        product_url = "https://www.amazon.in" + relative_url
                    
                    # Price
                    price_tag = item.find('span', class_='a-price-whole')
                    if not price_tag: continue
                    price = self.extract_price(price_tag.get_text())
                    if not price: continue
                    
                    # Image
                    img_tag = item.find('img', class_='s-image')
                    image_url = img_tag.get('src') if img_tag else None
                    
                    # Rating
                    rating_tag = item.find('span', class_='a-icon-alt')
                    rating = self.extract_rating(rating_tag.get_text()) if rating_tag else 0.0
                    
                    # Review Count
                    review_tag = item.find('span', class_='a-size-base s-underline-text')
                    review_count = self.extract_review_count(review_tag.get_text()) if review_tag else 0
                    
                    products.append({
                        'name': name,
                        'description': name,
                        'price': price,
                        'original_price': price * 1.2,
                        'rating': rating,
                        'review_count': review_count,
                        'platform': self.platform,
                        'product_url': product_url,
                        'image_url': image_url,
                        'category': 'General',
                        'availability': 'In Stock'
                    })
                except Exception as e:
                    # logger.warning(f"Error parsing Amazon item: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error searching Amazon: {str(e)}")
        finally:
            self._teardown_driver()
            
        return products

class FlipkartScraper(SeleniumScraper):
    """Scraper for Flipkart products"""
    
    def __init__(self):
        super().__init__()
        self.platform = "Flipkart"
    
    def search_products(self, query, max_results=10):
        search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '+')}"
        products = []
        try:
            source = self.get_page_source_selenium(search_url)
            if not source:
                return []
                
            soup = BeautifulSoup(source, 'lxml')
            
            potential_items = []
            # Class 1: Vertical List (common)
            potential_items.extend(soup.find_all('div', class_='_1AtVbE'))
            # Class 2: Grid/New Layout
            potential_items.extend(soup.find_all('div', class_='cPHDOP'))
            # Class 3: Older Horizontal
            potential_items.extend(soup.find_all('div', class_='_2kHMtA'))
            # Class 4: Generic card
            potential_items.extend(soup.find_all('div', class_='slAVV4'))

            valid_items = []
            seen_texts = set()
            
            for item in potential_items:
                # Must have a price to be valid
                if item.find('div', class_='_30jeq3') or item.find('div', class_='Nx9bqj'):
                    text = item.get_text(strip=True)[:50]
                    if text not in seen_texts:
                        valid_items.append(item)
                        seen_texts.add(text)
            
            for item in valid_items[:max_results]:
                try:
                    # Name (Try multiple selectors)
                    name_tag = item.find('div', class_='_4rR01T') or item.find('a', class_='s1Q9rs') or item.find('a', class_='IRpwTa') or item.find('div', class_='KzDlHZ') or item.find('a', class_='wjcEIp')
                    name = name_tag.get_text(strip=True) if name_tag else None
                    if not name: continue
                    
                    # URL
                    link_tag = item.find('a', class_='_1fQZEK') or item.find('a', class_='s1Q9rs') or item.find('a', class_='IRpwTa') or item.find('a', class_='CGtC98') or item.find('a', class_='VJA3rP')
                    relative_url = link_tag.get('href') if link_tag else None
                    if not relative_url: continue
                    
                    if relative_url.startswith('http'):
                        product_url = relative_url
                    else:
                        product_url = "https://www.flipkart.com" + relative_url
                    
                    # Price
                    price_tag = item.find('div', class_='_30jeq3') or item.find('div', class_='Nx9bqj')
                    price = self.extract_price(price_tag.get_text()) if price_tag else None
                    
                    # Original Price
                    orig_tag = item.find('div', class_='_3I9_wc') or item.find('div', class_='yRaY8j')
                    original_price = self.extract_price(orig_tag.get_text()) if orig_tag else None
                    
                    # Rating
                    rating_tag = item.find('div', class_='_3LWZlK') or item.find('div', class_='XQDdHH')
                    rating = self.extract_rating(rating_tag.get_text()) if rating_tag else 0.0
                    
                    # Reviews
                    review_tag = item.find('span', class_='_2_R_DZ') or item.find('span', class_='Wphh3N')
                    review_count = self.extract_review_count(review_tag.get_text()) if review_tag else 0
                    
                    # Image
                    img_tag = item.find('img', class_='_396cs4') or item.find('img', class_='DByuf4')
                    image_url = img_tag.get('src') if img_tag else None
                    
                    if price:
                        products.append({
                            'name': name,
                            'description': name,
                            'price': price,
                            'original_price': original_price or price,
                            'rating': rating,
                            'review_count': review_count,
                            'platform': self.platform,
                            'product_url': product_url,
                            'image_url': image_url,
                            'category': 'General',
                            'availability': 'In Stock'
                        })
                except Exception as e:
                    continue
                    
        except Exception as e:
            logger.error(f"Error searching Flipkart: {str(e)}")
        finally:
            self._teardown_driver()
            
        return products

class DummyJSONScraper(BaseScraper):
    """API-based scraper (no HTML scraping) using dummyjson.com."""
    def __init__(self):
        super().__init__()
        self.platform = "Meesho"

    def search_products(self, query, max_results=15):
        """Search all product categories - not just electronics"""
        try:
            # DummyJSON supports all categories: smartphones, laptops, fragrances, skincare, groceries, home-decoration, furniture, tops, womens-dresses, womens-shoes, mens-shirts, mens-shoes, mens-watches, womens-watches, womens-bags, womens-jewellery, sunglasses, automotive, motorcycle, lighting
            url = "https://dummyjson.com/products/search"
            resp = self.session.get(url, params={'q': query, 'limit': max_results * 2}, timeout=10) 
            resp.raise_for_status()
            data = resp.json() or {}
            products = []
            for item in (data.get('products') or [])[:max_results]:
                price = item.get('price')
                # Convert USD to INR (rough conversion)
                price_inr = float(price) * 83 if price else None
                # Use actual stock as review count (better than 0)
                review_count = int(item.get('stock') or item.get('rating', 0) * 1000 or 100)
                products.append({
                    'name': item.get('title', 'Product'),
                    'description': item.get('description', ''),
                    'price': price_inr,
                    'original_price': price_inr * 1.15 if price_inr else None,  # 15% markup
                    'rating': float(item.get('rating') or 4.0),
                    'review_count': review_count,
                    'platform': self.platform,
                    'product_url': f"https://www.meesho.com/search?q={query.replace(' ', '+')}&product_id={item.get('id')}",
                    'image_url': item.get('thumbnail') or item.get('images', [None])[0],
                    'category': item.get('category', 'General'),
                    'brand': item.get('brand', ''),
                    'availability': 'In Stock' if item.get('stock', 0) > 0 else 'Out of Stock'
                })
            return products
        except Exception as e:
            logger.error(f"Error searching DummyJSON (Meesho): {e}")
            return []

class FakeStoreScraper(BaseScraper):
    """API-based scraper for Myntra (Simulated)."""
    def __init__(self):
        super().__init__()
        self.platform = "Myntra"

    def search_products(self, query, max_results=15):
        """Search all product categories - fashion, electronics, jewelry, etc."""
        try:
            url = "https://fakestoreapi.com/products"
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json() or []
            
            q = query.lower()
            # Better matching: check title, description, and category
            filtered = [d for d in data if 
                       q in d.get('title','').lower() or 
                       q in d.get('description','').lower() or
                       q in d.get('category','').lower()]
            
            # If no direct match, return relevant items (not just random)
            if not filtered and data:
                # Try category matching
                category_map = {
                    'clothes': 'men\'s clothing',
                    'clothing': 'men\'s clothing',
                    'dress': 'women\'s clothing',
                    'jewelry': 'jewelery',
                    'electronics': 'electronics'
                }
                for key, cat in category_map.items():
                    if key in q:
                        filtered = [d for d in data if d.get('category') == cat]
                        break
                if not filtered:
                    filtered = data[:max_results]

            products = []
            for item in filtered[:max_results]:
                price = item.get('price')
                price_inr = float(price) * 85 if price else None
                rating_data = item.get('rating') or {}
                products.append({
                    'name': item.get('title', 'Product'),
                    'description': item.get('description', ''),
                    'price': price_inr,
                    'original_price': price_inr * 1.1 if price_inr else None,
                    'rating': float(rating_data.get('rate', 4.0)),
                    'review_count': int(rating_data.get('count', 100)),
                    'platform': self.platform,
                    'product_url': f"https://www.myntra.com/search?q={query.replace(' ', '+')}&product_id={item.get('id')}",
                    'image_url': item.get('image'),
                    'category': item.get('category', 'General'),
                    'brand': '',
                    'availability': 'In Stock'
                })
            return products
        except Exception as e:
            logger.error(f"Error searching FakeStore (Myntra): {e}")
            return []

class ScraperManager:
    """Manages multiple scrapers"""
    
    def __init__(self):
        self.scrapers = {
            'amazon': AmazonScraper(),
            'flipkart': FlipkartScraper(),
            'meesho': DummyJSONScraper(),
            'myntra': FakeStoreScraper()
        }
    
    def get_platform_trust_score(self, platform):
        """Platform trust scores - higher = more trusted"""
        scores = {
            'Amazon': 0.95,    # Most trusted
            'Flipkart': 0.90,  # Very trusted
            'Myntra': 0.85,    # Trusted
            'Meesho': 0.80     # Good
        }
        return scores.get(platform, 0.5)

    def scrape_platform(self, platform_name, query=None, max_results=10):
        scraper = self.scrapers.get(platform_name.lower())
        if not scraper:
            return []
            
        start_time = datetime.utcnow()
        log_entry = ScrapingLog(platform=platform_name, status='running', started_at=start_time)
        try:
            db.session.add(log_entry)
            db.session.commit()
        except:
            db.session.rollback()
            
        try:
            products = scraper.search_products(query, max_results)
            
            saved_count = 0
            for p_data in products:
                # Deduplicate by URL
                existing = Product.query.filter_by(product_url=p_data['product_url']).first()
                if existing:
                    # Update price
                    if p_data.get('price'):
                         existing.price = p_data['price']
                         existing.last_updated = datetime.utcnow()
                else:
                    new_p = Product(**p_data)
                    db.session.add(new_p)
                saved_count += 1
            
            db.session.commit()
            
            log_entry.status = 'success'
            log_entry.products_scraped = saved_count
            log_entry.completed_at = datetime.utcnow()
            db.session.commit()
            
            return products
        except Exception as e:
            logger.error(f"Error in ScraperManager: {e}")
            log_entry.status = 'failed'
            log_entry.errors = str(e)
            log_entry.completed_at = datetime.utcnow()
            db.session.commit()
            return []

    def scrape_all_platforms(self, query=None, max_results_per_platform=10):
        all_p = []
        # Run Amazon and Flipkart specifically for real-time
        # Use concurrent execution or sequential? Sequential is safer for now to avoid resource hogging
        # We prioritize Amazon/Flipkart
        platforms = ['amazon', 'flipkart', 'meesho', 'myntra']
        
        for p in platforms:
            try:
                products = self.scrape_platform(p, query, max_results_per_platform)
                all_p.extend(products)
            except Exception as e:
                logger.error(f"Failed to scrape {p}: {e}")
        
        return all_p

    def scrape_platform_realtime(self, platform_name, query=None, max_results=15):
        """Real-time scraping: Fetch products without saving to DB"""
        scraper = self.scrapers.get(platform_name.lower())
        if not scraper:
            logger.warning(f"No scraper found for {platform_name}")
            return []
        
        try:
            # Direct API/scraping call - no DB operations
            products = scraper.search_products(query, max_results)
            # Ensure all products have required fields
            for p in products:
                if 'id' not in p:
                    p['id'] = hash(p.get('product_url', '')) % 1000000  # Temporary ID
                if 'recommendation_score' not in p:
                    p['recommendation_score'] = 0.0
            return products
        except Exception as e:
            logger.error(f"Real-time scraping failed for {platform_name}: {e}")
            return []




