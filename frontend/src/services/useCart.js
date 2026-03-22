import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { interactionAPI } from './api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart([]); return; }
    setLoading(true);
    try {
      const data = await interactionAPI.getCart();
      setCart(data.cart || []);
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Add a new product (or increment if exists)
  const addToCart = useCallback(async (productId, quantity = 1) => {
    await interactionAPI.addToCart({ productId, quantity });
    await fetchCart();
  }, [fetchCart]);

  // Set absolute quantity for an existing item
  const setQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) {
      await interactionAPI.removeFromCart(productId);
    } else {
      await interactionAPI.setCartQty(productId, quantity);
    }
    await fetchCart();
  }, [fetchCart]);

  const removeFromCart = useCallback(async (productId) => {
    await interactionAPI.removeFromCart(productId);
    setCart((c) => c.filter((item) => {
      const id = item.productId?._id || item.productId;
      return id?.toString() !== productId.toString();
    }));
  }, []);

  const clearCart = useCallback(async () => {
    for (const item of cart) {
      const id = item.productId?._id || item.productId;
      if (id) await interactionAPI.removeFromCart(id).catch(() => {});
    }
    setCart([]);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const cartTotal = cart.reduce((sum, item) => {
    const p = item.productId;
    if (!p || typeof p !== 'object') return sum;
    const price = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
    return sum + price * (item.quantity || 1);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart, cartCount, cartTotal, loading,
      fetchCart, addToCart, setQuantity, removeFromCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
