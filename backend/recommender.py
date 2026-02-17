"""
Recommendation system using TF-IDF vectorization and cosine similarity
with rule-based scoring mechanism
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from models import Product, db
from config import Config
from scraper import ScraperManager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductRecommender:
    """Hybrid recommendation system combining ML and rule-based approaches"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=Config.TFIDF_MAX_FEATURES,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        self.scraper_manager = ScraperManager()
        self.product_vectors = None
        self.product_ids = None
        self.is_trained = False
    
    def prepare_text_features(self, products):
        """Prepare text features for TF-IDF vectorization"""
        texts = []
        for product in products:
            # Combine name, description, category, and brand
            text_parts = []
            if product.name:
                text_parts.append(product.name)
            if product.description:
                text_parts.append(product.description)
            if product.category:
                text_parts.append(product.category)
            if product.brand:
                text_parts.append(product.brand)
            texts.append(' '.join(text_parts))
        return texts
    
    def train(self):
        """Train the TF-IDF vectorizer on all products"""
        try:
            products = Product.query.filter(
                Product.name.isnot(None),
                Product.description.isnot(None)
            ).all()
            
            if len(products) < 2:
                logger.warning("Not enough products to train the model")
                self.is_trained = False
                return
            
            texts = self.prepare_text_features(products)
            self.product_vectors = self.vectorizer.fit_transform(texts)
            self.product_ids = [p.id for p in products]
            self.is_trained = True
            logger.info(f"Trained TF-IDF model on {len(products)} products")
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            self.is_trained = False
    
    def find_similar_products(self, query, top_n=None):
        """Find products similar to the search query using TF-IDF and cosine similarity"""
        if not self.is_trained:
            self.train()
        
        if not self.is_trained:
            # Fallback to simple text search
            return self._fallback_search(query, top_n)
        
        try:
            # Vectorize the query
            query_vector = self.vectorizer.transform([query])
            
            # Calculate cosine similarity
            similarities = cosine_similarity(query_vector, self.product_vectors).flatten()
            
            # Filter by threshold
            threshold = Config.SIMILARITY_THRESHOLD
            similar_indices = np.where(similarities >= threshold)[0]
            
            # Get products with their similarity scores
            results = []
            for idx in similar_indices:
                product_id = self.product_ids[idx]
                product = Product.query.get(product_id)
                if product:
                    results.append({
                        'product': product,
                        'similarity_score': float(similarities[idx])
                    })
            
            # Sort by similarity score
            results.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # Limit results
            if top_n:
                results = results[:top_n]
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar products: {str(e)}")
            return self._fallback_search(query, top_n)
    
    def _fallback_search(self, query, top_n=None):
        """Fallback search when ML model is not available"""
        query_lower = query.lower()
        products = Product.query.filter(
            db.or_(
                Product.name.ilike(f'%{query}%'),
                Product.description.ilike(f'%{query}%'),
                Product.category.ilike(f'%{query}%')
            )
        ).all()
        
        results = [{'product': p, 'similarity_score': 0.5} for p in products]
        if top_n:
            results = results[:top_n]
        return results
    
    def calculate_recommendation_score(self, product, min_price=None, max_price=None):
        """Calculate recommendation score using rule-based approach"""
        score = 0.0
        
        # Normalize price score (lower price = higher score)
        if product.price and min_price and max_price:
            if max_price > min_price:
                price_score = 1.0 - ((product.price - min_price) / (max_price - min_price))
            else:
                price_score = 1.0
        else:
            # If no price range, use inverse of price (normalized)
            all_prices = [p.price for p in Product.query.filter(Product.price.isnot(None)).all() if p.price]
            if all_prices and product.price:
                max_price_all = max(all_prices)
                min_price_all = min(all_prices)
                if max_price_all > min_price_all:
                    price_score = 1.0 - ((product.price - min_price_all) / (max_price_all - min_price_all))
                else:
                    price_score = 1.0
            else:
                price_score = 0.5
        
        score += Config.PRICE_WEIGHT * price_score
        
        # Rating score (normalized to 0-1)
        if product.rating:
            rating_score = product.rating / 5.0
        else:
            rating_score = 0.0
        score += Config.RATING_WEIGHT * rating_score
        
        # Platform trust score
        platform_trust = self.scraper_manager.get_platform_trust_score(product.platform)
        score += Config.PLATFORM_TRUST_WEIGHT * platform_trust
        
        # Review count score (normalized)
        if product.review_count:
            all_review_counts = [p.review_count for p in Product.query.filter(Product.review_count.isnot(None)).all() if p.review_count]
            if all_review_counts:
                max_reviews = max(all_review_counts)
                if max_reviews > 0:
                    review_score = min(1.0, product.review_count / max_reviews)
                else:
                    review_score = 0.0
            else:
                review_score = 0.5
        else:
            review_score = 0.0
        score += Config.REVIEW_COUNT_WEIGHT * review_score
        
        return score
    
    def rank_products_realtime(self, query, products_list, filters=None):
        """Rank products in real-time (works with dict products, not DB models)"""
        if not products_list:
            return []
        
        # Prepare text for TF-IDF
        query_lower = query.lower()
        
        # Calculate similarity scores using simple text matching (fast, no training needed)
        products_with_scores = []
        for p in products_list:
            # Simple similarity: check if query words appear in product name/description
            name = (p.get('name') or '').lower()
            desc = (p.get('description') or '').lower()
            category = (p.get('category') or '').lower()
            text = f"{name} {desc} {category}"
            
            query_words = query_lower.split()
            matches = sum(1 for word in query_words if word in text)
            similarity_score = min(1.0, matches / max(1, len(query_words)))
            
            # Calculate recommendation score (price, rating, etc.)
            price = p.get('price', 0) or 0
            rating = p.get('rating', 0) or 0
            review_count = p.get('review_count', 0) or 0
            platform = p.get('platform', '')
            
            # Price score (lower is better)
            prices = [pr.get('price', 0) for pr in products_list if pr.get('price')]
            if prices and price:
                min_p = min(prices)
                max_p = max(prices)
                if max_p > min_p:
                    price_score = 1.0 - ((price - min_p) / (max_p - min_p))
                else:
                    price_score = 1.0
            else:
                price_score = 0.5
            
            # Rating score
            rating_score = (rating / 5.0) if rating else 0.0
            
            # Platform trust
            platform_trust = self.scraper_manager.get_platform_trust_score(platform)
            
            # Review count score (normalized)
            review_counts = [rc.get('review_count', 0) for rc in products_list if rc.get('review_count')]
            if review_counts and review_count:
                max_reviews = max(review_counts)
                review_score = min(1.0, review_count / max_reviews) if max_reviews > 0 else 0.5
            else:
                review_score = 0.0
            
            # IMPROVED RANKING: Prioritize Trust + Rating + Price
            # Platform Trust: 40% (most important - trusted sites)
            # Rating: 30% (quality indicator)
            # Price: 20% (value for money)
            # Reviews: 10% (popularity)
            recommendation_score = (
                0.40 * platform_trust +      # Platform trust is most important
                0.30 * rating_score +      # High rating = good quality
                0.20 * price_score +       # Lower price = better value
                0.10 * review_score        # More reviews = trusted
            )
            
            # Final score: 70% recommendation (trust+rating+price) + 30% similarity (query match)
            combined_score = (0.7 * recommendation_score) + (0.3 * similarity_score)
            
            products_with_scores.append({
                **p,
                'similarity_score': similarity_score,
                'recommendation_score': recommendation_score,
                'combined_score': combined_score
            })
        
        # Sort by combined score
        products_with_scores.sort(key=lambda x: x['combined_score'], reverse=True)
        
        return products_with_scores
    
    def rank_products(self, products_with_similarity, min_price=None, max_price=None):
        """Rank products by combining similarity and recommendation scores"""
        ranked_products = []
        
        for item in products_with_similarity:
            product = item['product']
            similarity_score = item['similarity_score']
            
            # Calculate recommendation score
            recommendation_score = self.calculate_recommendation_score(
                product, min_price, max_price
            )
            
            # Combined score (weighted average)
            combined_score = (0.6 * similarity_score) + (0.4 * recommendation_score)
            
            # Update product's recommendation score
            product.recommendation_score = combined_score
            
            ranked_products.append({
                'product': product,
                'similarity_score': similarity_score,
                'recommendation_score': recommendation_score,
                'combined_score': combined_score
            })
        
        # Sort by combined score
        ranked_products.sort(key=lambda x: x['combined_score'], reverse=True)
        
        return ranked_products
    
    def recommend(self, query, filters=None, top_n=None):
        """Main recommendation method"""
        if top_n is None:
            top_n = Config.MAX_RECOMMENDATIONS
        
        # Find similar products
        similar_products = self.find_similar_products(query, top_n * 2)  # Get more for filtering
        
        # Apply filters
        if filters:
            filtered = []
            min_price = filters.get('min_price')
            max_price = filters.get('max_price')
            platforms = filters.get('platforms')
            min_rating = filters.get('min_rating')
            
            for item in similar_products:
                product = item['product']
                
                if min_price and product.price and product.price < min_price:
                    continue
                if max_price and product.price and product.price > max_price:
                    continue
                if platforms and product.platform not in platforms:
                    continue
                if min_rating and (not product.rating or product.rating < min_rating):
                    continue
                
                filtered.append(item)
            
            similar_products = filtered
        
        # Calculate price range for scoring
        prices = [item['product'].price for item in similar_products if item['product'].price]
        min_price = min(prices) if prices else None
        max_price = max(prices) if prices else None
        
        # Rank products
        ranked = self.rank_products(similar_products, min_price, max_price)
        
        # Limit results
        return ranked[:top_n]
    
    def update_recommendation_scores(self):
        """Update recommendation scores for all products"""
        products = Product.query.all()
        prices = [p.price for p in products if p.price]
        min_price = min(prices) if prices else None
        max_price = max(prices) if prices else None
        
        for product in products:
            score = self.calculate_recommendation_score(product, min_price, max_price)
            product.recommendation_score = score
        
        db.session.commit()
        logger.info(f"Updated recommendation scores for {len(products)} products")



