from app import app
from scraper import ScraperManager
import logging
import sys

# Configure logging to stdout
logging.basicConfig(stream=sys.stdout, level=logging.INFO)

def test_scraping():
    with app.app_context():
        sm = ScraperManager()
        
        print("\n--- Testing Amazon Scraper ---")
        try:
            amazon_products = sm.scrape_platform('amazon', 'laptop', max_results=2)
            print(f"Amazon Products Found: {len(amazon_products)}")
            for p in amazon_products:
                print(f" - {p.get('name')[:50]}... : {p.get('price')}")
        except Exception as e:
            print(f"Amazon Scraping Failed: {e}")

        print("\n--- Testing Flipkart Scraper ---")
        try:
            flipkart_products = sm.scrape_platform('flipkart', 'laptop', max_results=2)
            print(f"Flipkart Products Found: {len(flipkart_products)}")
            for p in flipkart_products:
                print(f" - {p.get('name')[:50]}... : {p.get('price')}")
        except Exception as e:
            print(f"Flipkart Scraping Failed: {e}")

        print("\n--- Testing Meesho Scraper (DummyJSON) ---")
        try:
            meesho_products = sm.scrape_platform('meesho', 'laptop', max_results=2)
            print(f"Meesho Products Found: {len(meesho_products)}")
            for p in meesho_products:
                print(f" - {p.get('name')[:50]}... : {p.get('price')}")
        except Exception as e:
            print(f"Meesho Scraping Failed: {e}")

        print("\n--- Testing Myntra Scraper (FakeStore) ---")
        try:
            myntra_products = sm.scrape_platform('myntra', 'clothing', max_results=2)
            print(f"Myntra Products Found: {len(myntra_products)}")
            for p in myntra_products:
                print(f" - {p.get('name')[:50]}... : {p.get('price')}")
        except Exception as e:
            print(f"Myntra Scraping Failed: {e}")

if __name__ == "__main__":
    test_scraping()
