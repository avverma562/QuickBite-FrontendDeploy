import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], total: 0 };
  });

  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(i => i.id === item.id);
      let newItems = [...prevCart.items];
      
      if (existingItemIndex > -1) {
        newItems[existingItemIndex].quantity += 1;
      } else {
        newItems.push({ ...item, quantity: 1 });
      }
      
      return {
        items: newItems,
        total: prevCart.total + item.price
      };
    });
  };

  const removeFromCart = (itemId, price) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(i => i.id === itemId);
      if (existingItemIndex === -1) return prevCart;
      
      let newItems = [...prevCart.items];
      let newTotal = prevCart.total;
      
      if (newItems[existingItemIndex].quantity > 1) {
        newItems[existingItemIndex].quantity -= 1;
        newTotal -= price;
      } else {
        newItems = newItems.filter(i => i.id !== itemId);
        newTotal -= price;
      }
      
      return {
        items: newItems,
        total: Math.max(0, newTotal)
      };
    });
  };

  const applyPromo = (code) => {
    if (code.toUpperCase() === 'SAVE10') {
      setDiscount(0.10);
      return true;
    } else if (code.toUpperCase() === 'QUICK20') {
      setDiscount(0.20);
      return true;
    }
    return false;
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
    setDiscount(0);
  };

  return (
    <CartContext.Provider value={{ cart, discount, addToCart, removeFromCart, clearCart, applyPromo }}>
      {children}
    </CartContext.Provider>
  );
};
