import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interactionAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    interactionAPI.getWishlist()
      .then((d) => setWishlist(d.wishlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="page"><div className="container">
      <div className="empty-state">
        <div className="icon">♡</div>
        <h3>Login to view your wishlist</h3>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Login</Link>
      </div>
    </div></div>
  );

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: '-0.5px' }}>
          Your Wishlist
        </h1>
        {loading ? <div className="spinner" /> :
          wishlist.length === 0 ? (
            <div className="empty-state">
              <div className="icon">♡</div>
              <h3>Your wishlist is empty</h3>
              <p>Save products you love to your wishlist.</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
            </div>
          ) : (
            <div className="product-grid">
              {wishlist.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
