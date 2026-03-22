import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useCart } from '../services/useCart';
import { useToast } from '../services/ToastContext';
import { interactionAPI } from '../services/api';
import '../styles/ProductCard.css';

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="stars">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span className="rating-num">{rating?.toFixed(1)}</span>
    </span>
  );
};

export default function ProductCard({ product, explanation, badge }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectivePrice = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price?.toFixed(2);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please log in to add to cart'); return; }
    if (loading) return;
    setLoading(true);
    try {
      await addToCart(product._id, 1);
      setAddedToCart(true);
      toast.success(`${product.name.slice(0, 30)} added to cart`);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please log in to save items'); return; }
    try {
      const res = await interactionAPI.toggleWishlist({ productId: product._id });
      setWishlisted(res.wishlisted);
      toast.success(res.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      {/* Image */}
      <div className="product-card-image">
        <img
          src={product.thumbnail || `https://picsum.photos/seed/${product._id}/400/300`}
          alt={product.name}
          loading="lazy"
        />
        {product.discount > 0 && (
          <span className="discount-badge">-{product.discount}%</span>
        )}
        {badge && <span className="rec-badge">{badge}</span>}
        <button
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      {/* Info */}
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>

        {product.stats?.averageRating > 0 && (
          <div className="product-rating">
            <StarRating rating={product.stats.averageRating} />
            <span className="review-count">({product.stats.reviewCount})</span>
          </div>
        )}

        <div className="product-price-row">
          <div className="product-price">
            <span className="price-current">₹{(effectivePrice * 83).toFixed(0)}</span>
            {product.discount > 0 && (
              <span className="price-original">₹{(product.price * 83).toFixed(0)}</span>
            )}
          </div>

          <button
            className={`add-cart-btn ${addedToCart ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={loading}
          >
            {addedToCart ? '✓' : '+'}
          </button>
        </div>

        {explanation && (
          <p className="rec-explanation">
            <span className="rec-icon">✦</span> {explanation}
          </p>
        )}
      </div>
    </Link>
  );
}
