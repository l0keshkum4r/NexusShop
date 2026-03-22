import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, interactionAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { useCart } from '../services/useCart';
import { useToast } from '../services/ToastContext';
import ProductCard from '../components/ProductCard';
import '../styles/ProductDetail.css';

const StarRating = ({ rating = 0, interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= (hover || rating) ? 'filled' : ''} ${interactive ? 'clickable' : ''}`}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
        >★</span>
      ))}
      {!interactive && rating > 0 && <span className="rating-label">{rating.toFixed(1)}</span>}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct]         = useState(null);
  const [similar, setSimilar]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [qty, setQty]                 = useState(1);
  const [wishlisted, setWishlisted]   = useState(false);
  const [activeImg, setActiveImg]     = useState(0);
  const [addingCart, setAddingCart]   = useState(false);
  const [reviewRating, setReviewRating]     = useState(0);
  const [reviewComment, setReviewComment]   = useState('');
  const [reviewLoading, setReviewLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    productAPI.getById(id)
      .then((d) => { setProduct(d.product); setActiveImg(0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    if (user) interactionAPI.record({ productId: id, action: 'view' }).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (!user || !product) return;
    interactionAPI.getRecommendations(user.id, 4)
      .then((d) => setSimilar((d.recommendations || []).slice(0, 4)))
      .catch(() => {});
  }, [product, user]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please log in to add to cart'); return; }
    setAddingCart(true);
    try {
      await addToCart(id, qty);
      toast.success(`Added ${qty}× to cart!`);
    } catch { toast.error('Could not add to cart'); }
    finally { setAddingCart(false); }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please log in to save items'); return; }
    try {
      const res = await interactionAPI.toggleWishlist({ productId: id });
      setWishlisted(res.wishlisted);
      toast.success(res.wishlisted ? 'Added to wishlist ♥' : 'Removed from wishlist');
    } catch { toast.error('Could not update wishlist'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) { toast.warning('Please select a rating'); return; }
    setReviewLoading(true);
    try {
      const data = await productAPI.addReview(id, { rating: reviewRating, comment: reviewComment });
      setProduct(data.product);
      setReviewRating(0);
      setReviewComment('');
      toast.success('Review submitted — thanks!');
    } catch (e) { toast.error(e.message); }
    finally { setReviewLoading(false); }
  };

  if (loading) return (
    <div className="page"><div className="container">
      <div className="skeleton" style={{ height: 500, borderRadius: 18, marginTop: 24 }} />
    </div></div>
  );
  if (error) return (
    <div className="page"><div className="container">
      <div className="alert alert-error" style={{ marginTop: 32 }}>{error}</div>
    </div></div>
  );
  if (!product) return null;

  const effectivePrice = product.discount > 0
    ? product.price * (1 - product.discount / 100) : product.price;
  const inr = (p) => (p * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const images = product.images?.length
    ? product.images
    : [product.thumbnail || `https://picsum.photos/seed/${product._id}/800/600`];
  const stockStatus =
    product.stock > 10 ? { label: '✓ In Stock', cls: 'in-stock' }
    : product.stock > 0 ? { label: `⚠ Only ${product.stock} left`, cls: 'low-stock' }
    : { label: '✗ Out of Stock', cls: 'out-stock' };

  return (
    <div className="page">
      <div className="container">

        <nav className="breadcrumb">
          <Link to="/">Home</Link><span>/</span>
          <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span><span>{product.name}</span>
        </nav>

        <div className="product-detail-grid">
          {/* Images */}
          <div className="product-images">
            <div className="main-image">
              <img src={images[activeImg]} alt={product.name} />
              {product.discount > 0 && (
                <span className="detail-discount-badge">-{product.discount}% OFF</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="image-thumbs">
                {images.map((img, i) => (
                  <button key={i} className={`thumb ${activeImg === i ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <div className="detail-meta">
              <span className="detail-category">{product.category}</span>
              {product.brand && <span className="detail-brand">by {product.brand}</span>}
            </div>
            <h1 className="detail-name">{product.name}</h1>

            {product.stats?.reviewCount > 0 && (
              <div className="detail-rating">
                <StarRating rating={product.stats.averageRating} />
                <span className="rating-count">
                  {product.stats.averageRating.toFixed(1)} ({product.stats.reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="detail-price-block">
              <span className="detail-price">₹{inr(effectivePrice)}</span>
              {product.discount > 0 && (
                <>
                  <span className="detail-original">₹{inr(product.price)}</span>
                  <span className="detail-savings">Save ₹{inr(product.price - effectivePrice)}</span>
                </>
              )}
            </div>

            <span className={`stock-badge ${stockStatus.cls}`}>{stockStatus.label}</span>
            <p className="detail-description">{product.description}</p>

            {product.tags?.length > 0 && (
              <div className="detail-tags">
                {product.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
              </div>
            )}

            <div className="detail-stats">
              {[
                { num: product.stats?.views?.toLocaleString() || 0, label: 'views' },
                { num: product.stats?.purchases?.toLocaleString() || 0, label: 'sold' },
                { num: product.stats?.cartAdds?.toLocaleString() || 0, label: 'in carts' },
                ...(product.stats?.averageRating > 0
                  ? [{ num: product.stats.averageRating.toFixed(1), label: 'rating' }]
                  : []),
              ].map(({ num, label }) => (
                <div key={label} className="stat-item">
                  <span className="stat-num">{num}</span>
                  <span className="stat-label">{label}</span>
                </div>
              ))}
            </div>

            {user ? (
              <div className="detail-actions">
                <div className="qty-row">
                  <label className="form-label">Quantity</label>
                  <div className="qty-control">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}>+</button>
                  </div>
                </div>
                <div className="action-btns">
                  <button className="btn btn-primary btn-lg"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addingCart}>
                    {addingCart ? 'Adding…' : '🛒 Add to Cart'}
                  </button>
                  <button className={`btn btn-secondary btn-lg ${wishlisted ? 'wishlisted' : ''}`}
                    onClick={handleWishlist}>
                    {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="login-prompt">
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
                  Log in to purchase or save this item.
                </p>
                <Link to="/login" className="btn btn-primary btn-lg btn-full">Login to Continue</Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="reviews-section">
          <h2 className="section-title">Customer Reviews</h2>
          {(!product.reviews || product.reviews.length === 0) && (
            <p className="no-reviews">No reviews yet — be the first!</p>
          )}
          <div className="reviews-list">
            {(product.reviews || []).map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-header">
                  <span className="review-author">{r.userName || 'Anonymous'}</span>
                  <StarRating rating={r.rating} />
                  <span className="review-date">
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>

          {user && (
            <form className="review-form" onSubmit={handleReview}>
              <h3>Write a Review</h3>
              <div className="form-group">
                <label className="form-label">Your Rating *</label>
                <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="form-input" rows={3} value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product…"
                  style={{ resize: 'vertical' }} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={reviewLoading}>
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </section>

        {similar.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <div className="section-header">
              <h2 className="section-title">You Might Also Like</h2>
            </div>
            <div className="product-grid">
              {similar.map(({ product: p, explanation }) => (
                <ProductCard key={p._id} product={p} explanation={explanation} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
