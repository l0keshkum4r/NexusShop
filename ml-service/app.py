"""
ML Recommendation Microservice
FastAPI app exposing cosine-similarity-based product recommendations.
"""
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
from dotenv import load_dotenv
import threading
import time

from recommender import ContentRecommender, recommender

load_dotenv()

app = FastAPI(
    title="E-Commerce ML Recommendation Service",
    description="Cosine similarity based product recommendations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB connection (optional – for loading product data) ──────────────────
_mongo_client = None
_products_cache: List[dict] = []
_cache_lock = threading.Lock()
_last_mongo_fetch: float = 0
MONGO_CACHE_TTL = 600  # Refresh products every 10 minutes


def get_mongo_products() -> List[dict]:
    """Fetch product features from MongoDB."""
    global _mongo_client, _products_cache, _last_mongo_fetch

    now = time.time()
    with _cache_lock:
        if now - _last_mongo_fetch < MONGO_CACHE_TTL and _products_cache:
            return _products_cache

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        return []

    try:
        if _mongo_client is None:
            _mongo_client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)

        db = _mongo_client.get_default_database()
        # Only fetch fields needed for feature vector
        products = list(
            db.products.find(
                {"isActive": True},
                {"_id": 1, "name": 1, "category": 1, "tags": 1, "price": 1}
            )
        )
        # Convert ObjectId to string
        for p in products:
            p["_id"] = str(p["_id"])

        with _cache_lock:
            _products_cache = products
            _last_mongo_fetch = time.time()

        return products
    except Exception as e:
        print(f"MongoDB fetch error: {e}")
        return _products_cache  # Return stale cache on error


# ─── Request/Response Models ───────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    product_ids: List[str]              # Seed product IDs (user recently viewed)
    exclude_ids: Optional[List[str]] = []  # Products user already interacted with
    top_n: Optional[int] = 10
    # Optional: caller can pass products directly (avoids MongoDB round-trip)
    products: Optional[List[dict]] = None


class RecommendationItem(BaseModel):
    product_id: str
    similarity_score: float
    product_name: str
    category: str


class RecommendResponse(BaseModel):
    recommendations: List[RecommendationItem]
    model: str = "cosine-similarity"
    seed_count: int
    total_candidates: int


class SimilarityRequest(BaseModel):
    product: dict          # Single product to find similarities for
    candidates: List[dict] # Pool of candidate products
    top_n: Optional[int] = 10


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "cosine-similarity",
        "products_loaded": len(_products_cache),
    }


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """
    Get product recommendations based on seed product IDs.
    Uses cosine similarity on (category + tags + price) feature vectors.
    """
    if not req.product_ids:
        raise HTTPException(status_code=400, detail="product_ids cannot be empty")

    top_n = min(req.top_n or 10, 50)  # Cap at 50

    # Get products from request payload or MongoDB
    if req.products:
        products = req.products
    else:
        products = get_mongo_products()

    if not products:
        return RecommendResponse(
            recommendations=[],
            seed_count=len(req.product_ids),
            total_candidates=0,
        )

    results = recommender.recommend(
        seed_product_ids=req.product_ids,
        exclude_ids=req.exclude_ids or [],
        top_n=top_n,
        products=products,
    )

    return RecommendResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        seed_count=len(req.product_ids),
        total_candidates=len(products),
    )


@app.post("/similarity")
def compute_similarity(req: SimilarityRequest):
    """
    Compute similarity between one product and a pool of candidates.
    Useful for 'similar products' on a product detail page.
    """
    if not req.product or not req.candidates:
        raise HTTPException(status_code=400, detail="product and candidates required")

    # Temporarily fit on the provided candidates
    local_recommender = ContentRecommender()
    all_products = [req.product] + req.candidates
    local_recommender.fit(all_products)

    seed_id = str(req.product.get("_id") or req.product.get("id", "seed"))
    req.product["_id"] = seed_id  # Ensure ID is set

    results = local_recommender.recommend(
        seed_product_ids=[seed_id],
        exclude_ids=[seed_id],
        top_n=req.top_n or 10,
    )

    return {"similar_products": results}


@app.post("/batch-vectorize")
def batch_vectorize(products: List[dict]):
    """
    Compute and return feature vectors for a list of products.
    Useful for storing vectors in MongoDB.
    """
    from utils import build_feature_vector, build_tag_vocabulary
    vocab = build_tag_vocabulary(products)
    result = []
    for p in products:
        vector = build_feature_vector(p, vocab)
        result.append({
            "id": str(p.get("_id") or p.get("id", "")),
            "vector": vector,
            "vector_dim": len(vector),
        })
    return {"vectors": result, "vocab_size": len(vocab)}


# ─── Background: Pre-warm model on startup ────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Pre-load products from MongoDB and warm up the model."""
    products = get_mongo_products()
    if products:
        recommender.fit(products)
        print(f"✅ ML model warmed up with {len(products)} products")
    else:
        print("⚠️  No products loaded on startup (MongoDB not configured?)")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
