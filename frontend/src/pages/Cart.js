import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useCart } from '../services/useCart';
import { useToast } from '../services/ToastContext';
import '../styles/Cart.css';

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, removeFromCart, setQuantity, clearCart } = useCart();
  const toast = useToast();
  const [removing, setRemoving] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [ordered, setOrdered] = useState(false);

  if (!user) return (
    <div className="page"><div className="container">
      <div className="empty-state">
        <div className="icon">🛒</div>
        <h3>Please log in</h3>
        <p>You need to be logged in to view your cart.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Login</Link>
      </div>
    </div></div>
  );

  const handleRemove = async (productId, name) => {
    setRemoving(productId);
    try {
      await removeFromCart(productId);
      toast.success(`${name?.slice(0, 24)}… removed`);
    } catch { toast.error('Could not remove item'); }
    finally { setRemoving(null); }
  };

  const handleUpdateQty = async (productId, newQty) => {
    if (newQty < 1) { handleRemove(productId); return; }
    try {
      await setQuantity(productId, newQty);
    } catch { toast.error('Could not update quantity'); }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate
    await clearCart();
    setOrdered(true);
    toast.success('Order placed successfully! 🎉');
    setCheckingOut(false);
  };

  const subtotal = cart.reduce((sum, item) => {
    const p = item.productId;
    if (!p || typeof p !== 'object') return sum;
    const price = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
    return sum + price * 83 * (item.quantity || 1);
  }, 0);

  const shipping = subtotal > 50000 ? 0 : 499;
  const gst = subtotal * 0.18;
  const total = subtotal + shipping + gst;

  if (ordered) return (
    <div className="page"><div className="container">
      <div className="order-success">
        <div className="success-icon">✓</div>
        <h2>Order Placed!</h2>
        <p>Thank you for your order. You'll receive a confirmation soon.</p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>
          Continue Shopping
        </Link>
      </div>
    </div></div>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="cart-heading-row">
          <h1 className="cart-heading">Your Cart</h1>
          {cart.length > 0 && (
            <span className="cart-item-count">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : cart.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Browse products and add some items to get started.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items list */}
            <div className="cart-items">
              {cart.map((item) => {
                const p = item.productId;
                if (!p || typeof p !== 'object') return null;
                const pid = p._id?.toString();
                const effectivePrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
                const lineTotal = (effectivePrice * 83 * (item.quantity || 1))
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 });

                return (
                  <div key={pid} className="cart-item">
                    <Link to={`/products/${pid}`} className="cart-item-img">
                      <img
                        src={p.thumbnail || `https://picsum.photos/seed/${pid}/120/120`}
                        alt={p.name}
                      />
                    </Link>

                    <div className="cart-item-info">
                      <Link to={`/products/${pid}`} className="cart-item-name">{p.name}</Link>
                      <span className="cart-item-cat">{p.category}</span>
                      {p.discount > 0 && (
                        <span className="badge badge-danger">-{p.discount}%</span>
                      )}
                      <span className="cart-unit-price">
                        ₹{(effectivePrice * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })} each
                      </span>
                    </div>

                    <div className="cart-item-qty">
                      <button onClick={() => handleUpdateQty(pid, (item.quantity || 1) - 1)}>−</button>
                      <span>{item.quantity || 1}</span>
                      <button onClick={() => handleUpdateQty(pid, (item.quantity || 1) + 1)}>+</button>
                    </div>

                    <div className="cart-item-price">₹{lineTotal}</div>

                    <button
                      className="cart-remove"
                      onClick={() => handleRemove(pid, p.name)}
                      disabled={removing === pid}
                      title="Remove"
                    >✕</button>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="cart-summary">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'free-shipping' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping === 0 && (
                  <div className="free-ship-note">
                    ✓ You qualify for free shipping!
                  </div>
                )}
                <div className="summary-row">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 20 }}
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Placing Order…' : 'Place Order'}
              </button>
              <Link to="/" className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
