import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, discount, addToCart, removeFromCart, clearCart, applyPromo } = useCart();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');

  const deliveryFee = cart.total > 0 ? 3.99 : 0;
  const taxes = cart.total * 0.08; // 8% tax
  const discountAmount = cart.total * discount;
  const finalTotal = cart.total - discountAmount + deliveryFee + taxes;

  const handlePromoApply = () => {
    if (applyPromo(promoInput)) {
      alert("Promo code applied successfully!");
    } else {
      alert("Invalid promo code. Try SAVE10 or QUICK20.");
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-page empty-cart-page">
        <div className="container">
          <motion.div 
            className="empty-cart-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/restaurants" className="btn-primary mt-4">
              Browse Restaurants
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <Link to="/restaurants" className="back-link">
            <ArrowLeft size={20} /> Back to Menu
          </Link>
          <h1>Your Cart</h1>
        </div>

        <div className="cart-layout">
          {/* Cart Items List */}
          <div className="cart-items-section">
            <div className="glass-card p-4">
              <div className="cart-items-header">
                <h3>Order Items</h3>
                <button className="clear-cart-btn" onClick={clearCart}>
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>

              <div className="cart-items-list">
                {cart.items.map((item) => (
                  <motion.div 
                    key={item.id} 
                    className="cart-item"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    
                    <div className="cart-item-details">
                      <div className="cart-item-title-row">
                        <div className="cart-item-name">
                          <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}></div>
                          <h4>{item.name}</h4>
                        </div>
                        <p className="cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      
                      <p className="cart-item-restaurant">{item.restaurantName}</p>
                      
                      <div className="cart-item-actions">
                        <div className="quantity-controls shadow-btn cart-qty-btn">
                          <button onClick={() => removeFromCart(item.id, item.price)}>
                            {item.quantity === 1 ? <Trash2 size={16} color="var(--secondary)" /> : <Minus size={16} />}
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addToCart(item)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary Panel */}
          <div className="cart-summary-section">
            <div className="glass-card summary-card">
              <h3>Bill Details</h3>
              
              <div className="bill-breakdown">
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{cart.total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="bill-row" style={{ color: 'var(--primary)' }}>
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>Taxes & Charges</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>
                
                <div className="bill-divider"></div>
                
                <div className="bill-row bill-total">
                  <span>To Pay</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="promo-code-section">
                <input 
                  type="text" 
                  placeholder="Enter Promo Code" 
                  className="promo-input" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button className="btn-secondary apply-btn" onClick={handlePromoApply}>Apply</button>
              </div>

              <button 
                className="btn-primary checkout-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
