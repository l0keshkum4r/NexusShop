import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { interactionAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function RecommendationList({ title = 'Recommended for You', limit = 8 }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    interactionAPI.getRecommendations(user.id, limit)
      .then((d) => setItems(d.recommendations || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, limit]);

  if (!user) return null;
  if (loading) return (
    <section style={{ marginBottom: 48 }}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="product-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 320 }} />
        ))}
      </div>
    </section>
  );
  if (items.length === 0) return null;

  return (
    <section style={{ marginBottom: 48 }}>
      <div className="section-header">
        <h2 className="section-title">✦ {title}</h2>
        <span className="badge badge-accent">AI-Powered</span>
      </div>
      <div className="product-grid">
        {items.map(({ product, explanation, score }) => (
          <ProductCard
            key={product._id}
            product={product}
            explanation={explanation}
            badge={score > 0.6 ? 'Top Pick' : null}
          />
        ))}
      </div>
    </section>
  );
}
