"""
Script to add sample product data for testing
"""
from app import app, db
from models import Product
from datetime import datetime

def add_sample_products():
    """Add sample products to the database"""
    with app.app_context():
        # Clear existing products (optional)
        # Product.query.delete()
        # db.session.commit()
        
        sample_products = [
            {
                'name': 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
                'description': 'Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, co-developed with Sony Music Studios Tokyo. Up to 30-hour battery life with quick charge. Touch Sensor controls to pause/play/skip tracks, control volume, activate your voice assistant, and answer phone calls. Speak-to-chat technology automatically reduces volume during conversations.',
                'price': 279.99,
                'original_price': 349.99,
                'rating': 4.6,
                'review_count': 45230,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B0863TXGM3',
                'image_url': 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Sony',
                'availability': 'In Stock'
            },
            {
                'name': 'Bose QuietComfort 45 Wireless Bluetooth Headphones',
                'description': 'The perfect balance of quiet, comfort, and sound. Bose uses tiny mics to measure, compare, and react to outside noise, then cancels it with opposite signals. Premium comfort with plush ear cushions and lightweight design. Up to 24 hours of battery life.',
                'price': 329.00,
                'original_price': 329.00,
                'rating': 4.5,
                'review_count': 28950,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B098FKXT8L',
                'image_url': 'https://m.media-amazon.com/images/I/51+bk+9kq+L._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Bose',
                'availability': 'In Stock'
            },
            {
                'name': 'Apple AirPods Pro (2nd Generation)',
                'description': 'Active Noise Cancellation blocks outside noise, so you can immerse yourself in music. Adaptive Transparency lets outside sounds in while filtering loud environmental noise. Spatial Audio with dynamic head tracking places sound all around you.',
                'price': 249.00,
                'original_price': 249.00,
                'rating': 4.7,
                'review_count': 67890,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B0BDHB9Y8H',
                'image_url': 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Apple',
                'availability': 'In Stock'
            },
            {
                'name': 'Sennheiser HD 660S Open Back Professional Headphone',
                'description': 'Premium open-back headphones for audiophiles. Exceptional sound quality with detailed, natural sound reproduction. Comfortable design for long listening sessions.',
                'price': 399.95,
                'original_price': 499.95,
                'rating': 4.8,
                'review_count': 12340,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B076B3GQCV',
                'image_url': 'https://m.media-amazon.com/images/I/61WqJXNjFDL._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Sennheiser',
                'availability': 'In Stock'
            },
            {
                'name': 'JBL Tune 750BTNC Wireless On-Ear Headphones',
                'description': 'Wireless Bluetooth headphones with active noise cancellation. Up to 15 hours of battery life. Comfortable on-ear design with JBL Pure Bass sound.',
                'price': 79.95,
                'original_price': 99.95,
                'rating': 4.3,
                'review_count': 15670,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B07XJ8C8F5',
                'image_url': 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'JBL',
                'availability': 'In Stock'
            },
            {
                'name': 'Sony WH-1000XM4 Noise Cancelling Headphones',
                'description': 'Premium wireless headphones with industry-leading noise cancellation. Long battery life and superior sound quality.',
                'price': 299.99,
                'original_price': 349.99,
                'rating': 4.6,
                'review_count': 23450,
                'platform': 'Flipkart',
                'product_url': 'https://www.flipkart.com/sony-wh-1000xm4',
                'image_url': 'https://rukminim2.flipkart.com/image/416x416/headphone/sony-wh-1000xm4.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Sony',
                'availability': 'In Stock'
            },
            {
                'name': 'Boat Rockerz 450 Bluetooth Headphone',
                'description': 'Wireless on-ear headphones with 40mm drivers. Up to 15 hours of battery life. Lightweight and comfortable design.',
                'price': 1299.00,
                'original_price': 1999.00,
                'rating': 4.2,
                'review_count': 45670,
                'platform': 'Flipkart',
                'product_url': 'https://www.flipkart.com/boat-rockerz-450',
                'image_url': 'https://rukminim2.flipkart.com/image/416x416/headphone/boat-rockerz-450.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Boat',
                'availability': 'In Stock'
            },
            {
                'name': 'Sennheiser HD 599 Open Back Headphone',
                'description': 'Premium open-back headphones with exceptional sound quality. Comfortable design for extended listening sessions.',
                'price': 199.95,
                'original_price': 249.95,
                'rating': 4.7,
                'review_count': 8900,
                'platform': 'Amazon',
                'product_url': 'https://www.amazon.com/dp/B01L1IIEKM',
                'image_url': 'https://m.media-amazon.com/images/I/61WqJXNjFDL._AC_SL1500_.jpg',
                'category': 'Electronics > Headphones',
                'brand': 'Sennheiser',
                'availability': 'In Stock'
            }
        ]
        
        added_count = 0
        for product_data in sample_products:
            # Check if product already exists
            existing = Product.query.filter_by(product_url=product_data['product_url']).first()
            if not existing:
                product = Product(**product_data)
                db.session.add(product)
                added_count += 1
        
        db.session.commit()
        print(f"Successfully added {added_count} sample products to the database!")
        
        # Update recommendation scores
        from recommender import ProductRecommender
        recommender = ProductRecommender()
        recommender.train()
        recommender.update_recommendation_scores()
        print("Recommendation model trained and scores updated!")

if __name__ == '__main__':
    add_sample_products()





