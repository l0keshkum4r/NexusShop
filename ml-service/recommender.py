"""
Core ML recommendation engine using cosine similarity.
Stateless: re-computes on each request (or uses in-memory cache).
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional
import threading
import time

from utils import build_feature_vector, build_tag_vocabulary


class ContentRecommender:
    """
    Content-based recommender using cosine similarity on product feature vectors.
    
    Flow:
    1. Accept list of products with their features
    2. Build a feature matrix
    3. Compute pairwise cosine similarity
    4. For given seed products, return most similar ones
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._products: List[Dict] = []
        self._feature_matrix: Optional[np.ndarray] = None
        self._product_index: Dict[str, int] = {}  # product_id -> row index
        self._tag_vocab: List[str] = []
        self._last_updated: float = 0
        self._cache_ttl = 300  # Rebuild matrix every 5 minutes

    def _needs_rebuild(self) -> bool:
        return (
            self._feature_matrix is None
            or (time.time() - self._last_updated) > self._cache_ttl
        )

    def fit(self, products: List[Dict[str, Any]]):
        """
        Build feature matrix from product list.
        Each product must have: id, category, tags, price
        """
        with self._lock:
            if not products:
                return

            self._products = products
            self._tag_vocab = build_tag_vocabulary(products)

            # Build feature matrix: rows = products, cols = features
            matrix = []
            index = {}
            for i, product in enumerate(products):
                pid = str(product.get("_id") or product.get("id", ""))
                index[pid] = i
                vector = build_feature_vector(product, self._tag_vocab)
                matrix.append(vector)

            self._feature_matrix = np.array(matrix, dtype=np.float32)
            self._product_index = index
            self._last_updated = time.time()

    def recommend(
        self,
        seed_product_ids: List[str],
        exclude_ids: List[str],
        top_n: int = 10,
        products: Optional[List[Dict]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get top-N similar products for a list of seed product IDs.
        
        Args:
            seed_product_ids: Products the user has interacted with
            exclude_ids: Products to exclude (already seen)
            top_n: How many recommendations to return
            products: Optional fresh product data (triggers re-fit)
        
        Returns:
            List of {product_id, similarity_score}
        """
        # Re-fit if new data provided or cache stale
        if products is not None:
            self.fit(products)
        elif self._needs_rebuild():
            return []  # No data available

        if self._feature_matrix is None or len(self._products) == 0:
            return []

        with self._lock:
            # Find indices of seed products
            seed_indices = [
                self._product_index[pid]
                for pid in seed_product_ids
                if pid in self._product_index
            ]

            if not seed_indices:
                return []

            # Aggregate: average feature vector of seed products
            seed_vectors = self._feature_matrix[seed_indices]
            avg_seed_vector = np.mean(seed_vectors, axis=0, keepdims=True)

            # Compute cosine similarity against all products
            similarities = cosine_similarity(avg_seed_vector, self._feature_matrix)[0]

            # Build exclude set
            exclude_set = set(exclude_ids) | set(seed_product_ids)

            # Collect recommendations sorted by similarity
            results = []
            for i, score in enumerate(similarities):
                product = self._products[i]
                pid = str(product.get("_id") or product.get("id", ""))
                if pid in exclude_set:
                    continue
                results.append({
                    "product_id": pid,
                    "similarity_score": float(round(score, 4)),
                    "product_name": product.get("name", ""),
                    "category": product.get("category", ""),
                })

            # Sort by score descending
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return results[:top_n]


# Singleton instance reused across requests
recommender = ContentRecommender()
