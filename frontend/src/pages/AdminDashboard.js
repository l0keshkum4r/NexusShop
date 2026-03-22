import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { adminAPI, productAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';
import '../styles/AdminDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const CHART_COLORS = ['#7c6af7','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#38bdf8','#4ade80'];

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#9898b0', font: { family: 'DM Sans', size: 12 } } },
    tooltip: {
      backgroundColor: '#18181f',
      borderColor: '#2e2e3e',
      borderWidth: 1,
      titleColor: '#f0f0f5',
      bodyColor: '#9898b0',
    },
  },
  scales: {
    x: { ticks: { color: '#5e5e78' }, grid: { color: '#2e2e3e' } },
    y: { ticks: { color: '#5e5e78' }, grid: { color: '#2e2e3e' } },
  },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [productStats, setProductStats] = useState(null);
  const [interactionStats, setInteractionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Product management state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', category: 'Electronics',
    price: '', stock: '', brand: '', tags: '', discount: 0,
  });
  const [formMsg, setFormMsg] = useState('');

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getInteractionStats(30)])
      .then(([ps, is]) => {
        setProductStats(ps.stats);
        setInteractionStats(is.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      setProdLoading(true);
      productAPI.getAll({ limit: 50 })
        .then((d) => setProducts(d.products || []))
        .catch(console.error)
        .finally(() => setProdLoading(false));
    }
  }, [activeTab]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const mostViewedChart = productStats ? {
    labels: productStats.mostViewed.map((p) => p.name.slice(0, 20) + (p.name.length > 20 ? '…' : '')),
    datasets: [{
      label: 'Views',
      data: productStats.mostViewed.map((p) => p.stats?.views || 0),
      backgroundColor: CHART_COLORS[0] + 'cc',
      borderColor: CHART_COLORS[0],
      borderWidth: 1,
      borderRadius: 6,
    }],
  } : null;

  const categoryChart = productStats ? {
    labels: productStats.totalByCategory.map((c) => c._id),
    datasets: [{
      data: productStats.totalByCategory.map((c) => c.count),
      backgroundColor: CHART_COLORS.map((c) => c + 'cc'),
      borderColor: CHART_COLORS,
      borderWidth: 2,
    }],
  } : null;

  const activityChart = interactionStats ? {
    labels: interactionStats.activityOverTime.map((d) => d._id.date),
    datasets: [{
      label: 'Interactions',
      data: interactionStats.activityOverTime.map((d) => d.count),
      fill: true,
      borderColor: CHART_COLORS[0],
      backgroundColor: CHART_COLORS[0] + '22',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: CHART_COLORS[0],
    }],
  } : null;

  const actionBreakdownChart = interactionStats ? {
    labels: interactionStats.actionBreakdown.map((a) => a._id),
    datasets: [{
      data: interactionStats.actionBreakdown.map((a) => a.count),
      backgroundColor: CHART_COLORS.slice(0, interactionStats.actionBreakdown.length).map((c) => c + 'cc'),
      borderColor: CHART_COLORS.slice(0, interactionStats.actionBreakdown.length),
      borderWidth: 2,
    }],
  } : null;

  // ── Product form ─────────────────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormMsg('');
    try {
      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        discount: parseInt(newProduct.discount) || 0,
        tags: newProduct.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      await productAPI.create(payload);
      setFormMsg('✓ Product created successfully!');
      setNewProduct({ name:'',description:'',category:'Electronics',price:'',stock:'',brand:'',tags:'',discount:0 });
      setShowAddForm(false);
      // refresh list
      const d = await productAPI.getAll({ limit: 50 });
      setProducts(d.products || []);
    } catch (e) { setFormMsg('Error: ' + e.message); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      setProducts((ps) => ps.filter((p) => p._id !== id));
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-sub">Manage your store and monitor performance</p>
          </div>
          <span className="badge badge-accent">Admin</span>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {['overview', 'products', 'users'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {loading ? <div className="spinner" /> : (
              <>
                {/* KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-icon">📦</span>
                    <div>
                      <div className="kpi-value">{productStats?.totalProducts || 0}</div>
                      <div className="kpi-label">Total Products</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-icon">👁</span>
                    <div>
                      <div className="kpi-value">
                        {productStats?.mostViewed?.reduce((s, p) => s + (p.stats?.views || 0), 0)?.toLocaleString() || 0}
                      </div>
                      <div className="kpi-label">Total Views (top 10)</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-icon">🛒</span>
                    <div>
                      <div className="kpi-value">
                        {interactionStats?.actionBreakdown?.find((a) => a._id === 'purchase')?.count?.toLocaleString() || 0}
                      </div>
                      <div className="kpi-label">Purchases (30d)</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-icon">📊</span>
                    <div>
                      <div className="kpi-value">
                        {interactionStats?.activityOverTime?.reduce((s, d) => s + d.count, 0)?.toLocaleString() || 0}
                      </div>
                      <div className="kpi-label">Total Interactions (30d)</div>
                    </div>
                  </div>
                </div>

                {/* Charts row 1 */}
                <div className="charts-grid-2">
                  <div className="chart-card">
                    <h3 className="chart-title">Most Viewed Products</h3>
                    {mostViewedChart && (
                      <Bar data={mostViewedChart} options={{
                        ...chartDefaults,
                        indexAxis: 'y',
                        plugins: { ...chartDefaults.plugins, legend: { display: false } },
                      }} />
                    )}
                  </div>
                  <div className="chart-card">
                    <h3 className="chart-title">Category Distribution</h3>
                    {categoryChart && (
                      <Pie data={categoryChart} options={{
                        ...chartDefaults,
                        scales: undefined,
                      }} />
                    )}
                  </div>
                </div>

                {/* Charts row 2 */}
                <div className="charts-grid-2">
                  <div className="chart-card">
                    <h3 className="chart-title">Activity Over Time (30d)</h3>
                    {activityChart && (
                      <Line data={activityChart} options={chartDefaults} />
                    )}
                  </div>
                  <div className="chart-card">
                    <h3 className="chart-title">Interaction Types</h3>
                    {actionBreakdownChart && (
                      <Pie data={actionBreakdownChart} options={{ ...chartDefaults, scales: undefined }} />
                    )}
                  </div>
                </div>

                {/* Top products table */}
                {interactionStats?.topProducts?.length > 0 && (
                  <div className="chart-card" style={{ marginTop: 24 }}>
                    <h3 className="chart-title">Top Products by Interactions (30d)</h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>#</th><th>Product</th><th>Category</th><th>Interactions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {interactionStats.topProducts.map((p, i) => (
                            <tr key={p._id || i}>
                              <td className="rank">{i + 1}</td>
                              <td className="prod-name">{p.name}</td>
                              <td><span className="badge badge-accent">{p.category}</span></td>
                              <td className="count">{p.count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Products Tab ────────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontSize:20, fontWeight:700 }}>Product Management</h2>
              <button className="btn btn-primary" onClick={() => setShowAddForm((s) => !s)}>
                {showAddForm ? 'Cancel' : '+ Add Product'}
              </button>
            </div>

            {/* Add product form */}
            {showAddForm && (
              <form className="add-product-form" onSubmit={handleAddProduct}>
                <h3>New Product</h3>
                <div className="form-2col">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" required value={newProduct.name}
                      onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={newProduct.brand}
                      onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-input" value={newProduct.category}
                      onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}>
                      {['Electronics','Clothing','Books','Home & Kitchen','Sports','Beauty','Toys','Automotive','Food','Other'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (USD) *</label>
                    <input className="form-input" type="number" required step="0.01" value={newProduct.price}
                      onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input className="form-input" type="number" required value={newProduct.stock}
                      onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount %</label>
                    <input className="form-input" type="number" min="0" max="100" value={newProduct.discount}
                      onChange={(e) => setNewProduct((p) => ({ ...p, discount: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Tags (comma-separated)</label>
                    <input className="form-input" placeholder="wireless, headphones, sony"
                      value={newProduct.tags}
                      onChange={(e) => setNewProduct((p) => ({ ...p, tags: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label className="form-label">Description *</label>
                    <textarea className="form-input" rows={3} required value={newProduct.description}
                      onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                      style={{ resize:'vertical' }} />
                  </div>
                </div>
                {formMsg && <div className={`alert ${formMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{formMsg}</div>}
                <button type="submit" className="btn btn-primary">Create Product</button>
              </form>
            )}

            {/* Products table */}
            {prodLoading ? <div className="spinner" /> : (
              <div className="chart-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Views</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p._id}>
                          <td className="prod-name">{p.name}</td>
                          <td><span className="badge badge-accent">{p.category}</span></td>
                          <td>₹{(p.price * 83).toLocaleString('en-IN', { maximumFractionDigits:0 })}</td>
                          <td>
                            <span className={`badge ${p.stock > 10 ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td>{p.stats?.views || 0}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUsers()
      .then((d) => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="chart-card">
      <h3 className="chart-title">All Users ({users.length})</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={{ fontWeight:600 }}>{u.name}</td>
                <td style={{ color:'var(--text-muted)' }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-accent'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ color:'var(--text-muted)', fontSize:13 }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
