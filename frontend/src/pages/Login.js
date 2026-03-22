import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import '../styles/Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'user') setForm({ email: 'alice@example.com', password: 'password123' });
    else setForm({ email: 'admin@example.com', password: 'admin123' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">◈ NexusShop</Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your account to continue</p>
        </div>

        <div className="demo-btns">
          <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('user')}>Demo User</button>
          <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('admin')}>Demo Admin</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email" type="email" required
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password" type="password" required
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
