"""
Utility functions for the ML recommendation service.
"""
import re
from typing import List, Dict, Any


# All known categories (must match backend)
CATEGORIES = [
    "Electronics", "Clothing", "Books", "Home & Kitchen",
    "Sports", "Beauty", "Toys", "Automotive", "Food", "Other"
]

# Vocabulary of all common tags (extended at runtime from product data)
BASE_TAG_VOCAB = [
    "wireless", "bluetooth", "portable", "noise-canceling", "audio", "headphones",
    "laptop", "tablet", "phone", "smart", "4k", "oled", "camera", "drone",
    "running", "shoes", "sneakers", "casual", "outdoor", "winter", "jacket",
    "self-help", "fiction", "sci-fi", "programming", "technical", "bestseller",
    "kitchen", "cooking", "storage", "furniture", "minimalist", "cleaning",
    "fitness", "yoga", "cycling", "cardio", "hydration", "exercise",
    "skincare", "hair", "luxury", "beauty", "anti-aging",
    "gaming", "toys", "kids", "educational",
    "apple", "samsung", "sony", "nike", "adidas", "dyson"
]


def build_feature_vector(product: Dict[str, Any], tag_vocab: List[str]) -> List[float]:
    """
    Convert product features into a numeric vector for cosine similarity.
    
    Features:
    - One-hot encoded category (len = num_categories)
    - TF-IDF-like tag presence (len = len(tag_vocab))
    - Normalized price (1 float)
    """
    vector = []

    # 1. Category one-hot encoding
    cat_vec = [0.0] * len(CATEGORIES)
    category = product.get("category", "Other")
    if category in CATEGORIES:
        cat_vec[CATEGORIES.index(category)] = 1.0
    vector.extend(cat_vec)

    # 2. Tag presence (binary)
    tags = [t.lower().strip() for t in product.get("tags", [])]
    tag_vec = [1.0 if tag in tags else 0.0 for tag in tag_vocab]
    vector.extend(tag_vec)

    # 3. Normalized price (log scale, then normalize to ~[0,1])
    import math
    price = float(product.get("price", 0))
    # log1p normalization (assumes max price ~10000)
    normalized_price = math.log1p(price) / math.log1p(10000)
    vector.append(normalized_price)

    return vector


def build_tag_vocabulary(products: List[Dict[str, Any]]) -> List[str]:
    """Build a unified tag vocabulary from all products."""
    all_tags = set(BASE_TAG_VOCAB)
    for product in products:
        for tag in product.get("tags", []):
            all_tags.add(tag.lower().strip())
    return sorted(list(all_tags))


def clean_text(text: str) -> str:
    """Normalize text for processing."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return text
