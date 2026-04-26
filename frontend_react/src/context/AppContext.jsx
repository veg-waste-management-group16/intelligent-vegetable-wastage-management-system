import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  // Shared listings — admin changes instantly visible in Market
  const [sharedListings, setSharedListings] = useState(null);

  // Read user from sessionStorage (v4 pattern) — reactive via state
  const [_userBump, setUserBump] = useState(0);
  const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');

  const setUser = useCallback((u) => {
    if (u) {
      sessionStorage.setItem('loggedUser', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('loggedUser');
    }
    setUserBump(b => b + 1);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exists = prev.find(i => i.listing_id === product.listing_id);
      if (exists) {
        return prev.map(i => i.listing_id === product.listing_id
          ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.title} added to cart! 🛒`);
  }, [showToast]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.listing_id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.listing_id === id ? { ...i, qty } : i));
  }, [removeFromCart]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price_per_kg * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <AppContext.Provider value={{
      user, setUser,
      cart, cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQty,
      cartTotal, cartCount,
      toast, showToast,
      sharedListings, setSharedListings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
