// Central API service for all backend calls
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper: get stored token
const getToken = () => localStorage.getItem('token');

// Helper: build headers
const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

// Helper: fetch wrapper with error handling
const request = async (url, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: headers(options.headers),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed: ${res.status}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  profile: () => request('/auth/profile'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? '?' + qs : ''}`);
  },
  getById: (id) => request(`/products/${id}`),
  create: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  addReview: (id, body) => request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Interactions ─────────────────────────────────────────────────────────────
export const interactionAPI = {
  record: (body) => request('/interactions', { method: 'POST', body: JSON.stringify(body) }),
  getTrending: (limit = 12) => request(`/interactions/trending?limit=${limit}`),
  getRecommendations: (userId, limit = 12) =>
    request(`/interactions/recommendations/${userId}?limit=${limit}`),
  getCart: () => request('/interactions/cart'),
  addToCart: (body) => request('/interactions/cart', { method: 'POST', body: JSON.stringify(body) }),
  setCartQty: (productId, quantity) =>
    request(`/interactions/cart/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeFromCart: (productId) => request(`/interactions/cart/${productId}`, { method: 'DELETE' }),
  getWishlist: () => request('/interactions/wishlist'),
  toggleWishlist: (body) => request('/interactions/wishlist', { method: 'POST', body: JSON.stringify(body) }),
  getHistory: () => request('/interactions/history'),
  addSearchHistory: (query) =>
    request('/interactions/search-history', { method: 'POST', body: JSON.stringify({ query }) }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getInteractionStats: (days = 30) => request(`/admin/interactions/stats?days=${days}`),
  getUsers: (page = 1) => request(`/admin/users?page=${page}`),
  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};
