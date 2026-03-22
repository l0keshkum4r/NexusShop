import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import RecommendationList from '../components/RecommendationList';
import SearchHistory from '../components/SearchHistory';
import RecentlyViewed from '../components/RecentlyViewed';
import { productAPI, interactionAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import '../styles/Home.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports', 'Beauty', 'Toys'];

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: '',
    sort: '-createdAt',
    page: 1,
  });

  // Load products
  const fetchProducts = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = { page: f.page, limit: 12, sort: f.sort };
      if (f.search) params.search = f.search;
      if (f.category) params.category = f.category;
      const data = await productAPI.getAll(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending
  useEffect(() => {
    interactionAPI.getTrending(6)
      .then((d) => setTrending(d.trending || []))
      .catch(() => {});
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  // Sync search param from URL
  useEffect(() => {
    const s = searchParams.get('search') || '';
    setFilters((f) => ({ ...f, search: s, page: 1 }));
  }, [searchParams]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="hero">
          <div className="hero-content">
            <span className="hero-eyebrow">AI-Powered Shopping</span>
            <h1 className="hero-title">Discover Products<br />Made <span>For You</span></h1>
            <p className="hero-sub">Personalized recommendations powered by graph AI, collaborative filtering, and machine learning.</p>
          </div>
          <div className="hero-graphic">
            <div className="hero-orb" />
          </div>
        </div>

        {/* Search history for returning users */}
        {user && <SearchHistory />}

        {/* Trending section */}
        {trending.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">🔥 Trending Now</h2>
            </div>
            <div className="product-grid">
              {trending.map(({ product, trendingScore }) => (
                <ProductCard key={product._id} product={product} badge="Trending" />
              ))}
            </div>
          </section>
        )}

        {/* Personalized recommendations */}
        {user && <RecommendationList title="Recommended for You" limit={8} />}

        {/* Recently viewed */}
        {user && <RecentlyViewed />}

        {/* Filters + Products */}
        <section className="section">
          <div className="filters-bar">
            {/* Category pills */}
            <div className="category-pills">
              <button
                className={`pill ${!filters.category ? 'active' : ''}`}
                onClick={() => setFilter('category', '')}
              >All</button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`pill ${filters.category === cat ? 'active' : ''}`}
                  onClick={() => setFilter('category', cat)}
                >{cat}</button>
              ))}
            </div>

            {/* Sort */}
            <select
              className="sort-select form-input"
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
            >
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-stats.views">Most Popular</option>
              <option value="-stats.averageRating">Top Rated</option>
            </select>
          </div>

          {/* Search result info */}
          {filters.search && (
            <div className="search-info">
              <span>Results for "<strong>{filters.search}</strong>" — {pagination.total || 0} items</span>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setSearchParams({});
                setFilter('search', '');
              }}>Clear</button>
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 320 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >← Prev</button>
              <span className="page-info">Page {pagination.page} of {pagination.pages}</span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >Next →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
