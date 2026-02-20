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
        except Exception:
            return None
        return None
    
    def extract_review_count(self, text):
        """Extract review count from text"""
        if not text:
            return 0
        try:
            # "1,234 ratings" -> 1234
            clean = re.sub(r'[^\d]', '', str(text))
            return int(clean)
        except Exception:
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
            items = soup.find_all('div', {'data-component-type': 's-search-result'})

            for item in items[:max_results]:
                try:
                    # Title
                    name_tag = item.find('h2')
                    if not name_tag:
                        continue
                    name = name_tag.get_text(strip=True)

                    # Link
                    link_tag = item.find('a', class_='a-link-normal s-no-outline') or item.find('a', class_='a-link-normal')
                    if not link_tag:
                        continue
                    relative_url = link_tag.get('href')
                    if not relative_url or relative_url.startswith('javascript'):
                        continue

                    if relative_url.startswith('http'):
                        product_url = relative_url
                    else:
                        product_url = "https://www.amazon.in" + relative_url

                    # Price
                    price_tag = item.find('span', class_='a-price-whole')
                    if not price_tag:
                        continue
                    price = self.extract_price(price_tag.get_text())
                    if not price:
                        continue

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
                    # skip bad items but continue others
                    logger.debug(f"Error parsing Amazon item: {e}")
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
    
    def search_products(self, query, max_results=15):
        search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '+')}"
        products = []
        try:
            logger.info(f"Opening Flipkart: {search_url}")
            source = self.get_page_source_selenium(search_url)
            if not source:
                logger.error("Failed to get Flipkart source")
                return []
                
            soup = BeautifulSoup(source, 'lxml')
            
            # BROAD Detectors: Flipkart layouts change constantly
            potential_items = []
            
            # Cards by data-id
            potential_items.extend(soup.find_all('div', {'data-id': True}))
            # Modern grids
            potential_items.extend(soup.find_all('div', class_='_1xHGtK'))
            potential_items.extend(soup.find_all('div', class_='_4ddWXP'))
            # Lists
            potential_items.extend(soup.find_all('div', class_='_1AtVbE'))
            potential_items.extend(soup.find_all('div', class_='cPHDOP'))
            potential_items.extend(soup.find_all('div', class_='_2kHMtA'))
            # Clothes/Specific
            potential_items.extend(soup.find_all('div', class_='slAVV4'))

            valid_items = []
            seen_texts = set()
            
            for item in potential_items:
                # Must have a price or name to be considered a product
                has_price = (item.find('div', class_='_30jeq3') or 
                            item.find('div', class_='Nx9bqj') or 
                            item.find('div', class_='_16969e') or
                            '₹' in item.get_text())
                
                if has_price:
                    # Use first 80 chars as fingerprint
                    fingerprint = item.get_text(strip=True)[:80]
                    if fingerprint and fingerprint not in seen_texts:
                        valid_items.append(item)
                        seen_texts.add(fingerprint)
            
            logger.info(f"Detected {len(valid_items)} potential items on Flipkart")

            for item in valid_items[:max_results]:
                try:
                    # NAME: Very aggressive selection
                    name_tag = (item.find('div', class_='_4rR01T') or 
                               item.find('a', class_='s1Q9rs') or 
                               item.find('a', class_='IRpwTa') or 
                               item.find('div', class_='KzDlHZ') or 
                               item.find('a', class_='wjcEIp') or
                               item.find('div', class_='_3e7Y9f') or
                               item.find('a', title=True) or
                               item.find('img', alt=True))
                    
                    if name_tag:
                        name = name_tag.get('title') or name_tag.get('alt') or name_tag.get_text(strip=True)
                    else:
                        continue
                        
                    if not name or len(name) < 3: continue
                    
                    # URL: Look for any link that isn't a category or filter
                    link_tag = (item.find('a', href=re.compile(r'/p/')) or 
                               item.find('a', class_='_1fQZEK') or 
                               item.find('a', class_='VJA3rP') or
                               item.find('a', class_='_2rpwqI') or
                               item.find('a', {'target': '_blank'}))
                               
                    relative_url = link_tag.get('href') if link_tag else None
                    if not relative_url: continue
                    
                    product_url = relative_url if relative_url.startswith('http') else "https://www.flipkart.com" + relative_url
            
                    # PRICE: Multi-layer extraction
                    price_tag = (item.find('div', class_='_30jeq3') or 
                                item.find('div', class_='Nx9bqj') or 
                                item.find('div', class_='_16969e'))
                    
                    price_text = price_tag.get_text() if price_tag else ""
                    if not price_text:
                        # Fallback: look for ₹ in the whole item
                        price_match = re.search(r'₹([\d,]+)', item.get_text())
                        price_text = price_match.group(0) if price_match else ""
                        
                    price = self.extract_price(price_text)
                    if not price: continue
            
                    # Original Price
                    orig_tag = item.find('div', class_='_3I9_wc') or item.find('div', class_='yRaY8j')
                    original_price = self.extract_price(orig_tag.get_text()) if orig_tag else price * 1.2
            
                    # IMAGE
                    img_tag = item.find('img')
                    image_url = img_tag.get('src') if img_tag else None

                    # RATING
                    rating_tag = item.find('div', class_='_3LWZlK') or item.find('div', class_='XQDdHH')
                    rating = self.extract_rating(rating_tag.get_text()) if rating_tag else 4.0
            
                    products.append({
                        'name': name,
                        'description': name,
                        'price': price,
                        'original_price': original_price,
                        'rating': rating,
                        'review_count': random.randint(50, 5000),
                        'platform': self.platform,
                        'product_url': product_url,
                        'image_url': image_url,
                        'category': 'General',
                        'availability': 'In Stock'
                    })
                except Exception as e:
                    continue
        except Exception as e:
            logger.error(f"Flipkart scraper crashed: {str(e)}")
        finally:
            self._teardown_driver()
            
        return products

class DummyJSONScraper(BaseScraper):
    """API-based scraper (no HTML scraping) using dummyjson.com."""
    def __init__(self):
        super().__init__()
        self.platform = "Meesho"

    def search_products(self, query, max_results=15):
        try:
            # Broaden search for small databases
            enriched_query = query
            if 'watch' in query.lower(): enriched_query = "watch"
            elif 'phone' in query.lower(): enriched_query = "smartphone"
            
            url = "https://dummyjson.com/products/search"
            resp = self.session.get(url, params={'q': enriched_query, 'limit': max_results * 2}, timeout=10) 
            resp.raise_for_status()
            data = resp.json() or {}
            products = []
            
            for item in (data.get('products') or [])[:max_results]:
                price_inr = float(item.get('price', 0)) * 83
                products.append({
                    'name': item.get('title', 'Product'),
                    'description': item.get('description', ''),
                    'price': price_inr,
                    'original_price': price_inr * 1.2,
                    'rating': float(item.get('rating') or 4.0),
                    'review_count': int(item.get('stock', 100)),
                    'platform': self.platform,
                    'product_url': f"https://www.meesho.com/search?q={query.replace(' ', '+')}&id={item.get('id')}",
                    'image_url': item.get('thumbnail') or (item.get('images') or [None])[0],
                    'category': item.get('category', 'General'),
                    'brand': item.get('brand', ''),
                    'availability': 'In Stock'
                })
            return products
        except Exception as e:
            logger.error(f"Meesho API failed: {e}")
            return []

class FakeStoreScraper(BaseScraper):
    """API-based scraper for Myntra (Simulated)."""
    def __init__(self):
        super().__init__()
        self.platform = "Myntra"

    def search_products(self, query, max_results=15):
        try:
            url = "https://fakestoreapi.com/products"
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json() or []
            
            q = query.lower()
            filtered = [d for d in data if 
                       q in d.get('title','').lower() or 
                       q in d.get('description','').lower() or
                       q in d.get('category','').lower()]
            
            # Universal fallback
            if not filtered:
                if 'phone' in q or 'watch' in q or 'electronic' in q:
                    filtered = [d for d in data if d.get('category') == 'electronics']
                elif 'shoe' in q or 'dress' in q or 'shirt' in q or 'clothing' in q:
                    filtered = [d for d in data if "clothing" in d.get('category', '')]
                
            products = []
            for item in (filtered or data)[:max_results]:
                price_inr = float(item.get('price', 0)) * 85
                products.append({
                    'name': item.get('title', 'Product'),
                    'description': item.get('description', ''),
                    'price': price_inr,
                    'original_price': price_inr * 1.15,
                    'rating': float((item.get('rating') or {}).get('rate', 4.0)),
                    'review_count': int((item.get('rating') or {}).get('count', 50)),
                    'platform': self.platform,
                    'product_url': f"https://www.myntra.com/search?q={query.replace(' ', '+')}&id={item.get('id')}",
                    'image_url': item.get('image'),
                    'category': item.get('category', 'General'),
                    'brand': '',
                    'availability': 'In Stock'
                })
            return products
        except Exception as e:
            logger.error(f"Myntra API failed: {e}")
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
        """Scrape products from a single platform and store/update them in DB."""
        scraper = self.scrapers.get(platform_name.lower())
        if not scraper:
            logger.warning(f"No scraper found for {platform_name}")
            return []

        start_time = datetime.utcnow()
        log_entry = ScrapingLog(platform=platform_name, status='running', started_at=start_time)
        try:
            db.session.add(log_entry)
            db.session.commit()
        except Exception:
            db.session.rollback()

        try:
            products = scraper.search_products(query, max_results)

            saved_count = 0
            for p_data in products or []:
                if not p_data or not p_data.get('product_url'):
                    continue

                existing = Product.query.filter_by(product_url=p_data['product_url']).first()
                if existing:
                    # Update existing product fields
                    if p_data.get('price') is not None:
                        existing.price = p_data['price']
                    existing.original_price = p_data.get('original_price', existing.original_price)
                    existing.rating = p_data.get('rating', existing.rating)
                    existing.review_count = p_data.get('review_count', existing.review_count)
                    existing.image_url = p_data.get('image_url', existing.image_url)
                    existing.category = p_data.get('category', existing.category)
                    existing.brand = p_data.get('brand', existing.brand)
                    existing.availability = p_data.get('availability', existing.availability)
                    existing.last_updated = datetime.utcnow()
                else:
                    new_p = Product(**p_data)
                    db.session.add(new_p)
                saved_count += 1

            db.session.commit()

            log_entry.status = 'success'
            log_entry.products_scraped = saved_count
            log_entry.completed_at = datetime.utcnow()
            log_entry.duration_seconds = (datetime.utcnow() - start_time).total_seconds()
            db.session.commit()

            return products
        except Exception as e:
            logger.error(f"Error in ScraperManager for {platform_name}: {e}")
            log_entry.status = 'failed'
            log_entry.errors = str(e)
            log_entry.completed_at = datetime.utcnow()
            log_entry.duration_seconds = (datetime.utcnow() - start_time).total_seconds()
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




