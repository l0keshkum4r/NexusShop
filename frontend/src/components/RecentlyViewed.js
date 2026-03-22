import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import '../styles/RecentlyViewed.css';

export default function RecentlyViewed() {
  const { user } = useAuth();
  const [viewed, setViewed] = useState([]);

  useEffect(() => {
    if (!user) return;
    authAPI.profile()
      .then((d) => {
        const vp = d.user?.viewedProducts || [];
        setViewed(vp.slice(0, 6));
      })
      .catch(() => {});
  }, [user]);

  if (!user || viewed.length === 0) return null;

  return (
    <section className="recently-viewed">
      <div className="section-header">
        <h2 className="section-title">Recently Viewed</h2>
      </div>
      <div className="rv-scroll">
        {viewed.map((item) => {
          const p = item.productId;
          if (!p || typeof p !== 'object') return null;
          return (
            <Link key={p._id} to={`/products/${p._id}`} className="rv-card">
              <div className="rv-img">
                <img
                  src={p.thumbnail || `https://picsum.photos/seed/${p._id}/120/120`}
                  alt={p.name}
                  loading="lazy"
                />
              </div>
              <div className="rv-info">
                <span className="rv-name">{p.name}</span>
                <span className="rv-price">
                  ₹{((p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price) * 83)
                    .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
