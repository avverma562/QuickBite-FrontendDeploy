import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, MapPin, Info, Plus, Minus, ShoppingCart, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import './RestaurantDetails.css';

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurantData, setRestaurantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch Restaurant details
        const resResponse = await api.get(`/restaurants/${id}`);
        const r = resResponse.data;
        
        // Fetch Menu Items
        let menuItems = [];
        try {
          const menuResponse = await api.get(`/menu/${id}`);
          menuItems = menuResponse.data.map(item => ({
            id: item.itemId,
            category: item.tags || 'Recommended', // Fallback category
            name: item.name,
            description: item.description,
            price: item.price,
            isVeg: item.isVeg,
            image: item.imageUrl || `https://images.unsplash.com/photo-${item.itemId % 2 === 0 ? '1568901346375-23c9450c58cd' : '1576107232684-1279f390859f'}?auto=format&fit=crop&w=200&q=80`
          }));
        } catch (menuErr) {
          console.error("Error fetching menu:", menuErr);
        }

        // Extract unique categories from menu
        const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
        if (uniqueCategories.length === 0) uniqueCategories.push('Recommended');

        setRestaurantData({
          id: r.restaurantId,
          name: r.name,
          rating: r.avgRating > 0 ? r.avgRating.toFixed(1) : 'New',
          reviewCount: '1.2k',
          deliveryTime: `${r.estimatedDeliveryMin || 30} min`,
          location: r.city,
          tags: r.cuisine ? r.cuisine.split(', ') : ['Various'],
          image: `https://images.unsplash.com/photo-${r.restaurantId % 2 === 0 ? '1568901346375-23c9450c58cd' : '1504674900247-0877df9cc836'}?auto=format&fit=crop&w=1200&q=80`,
          description: r.description || 'Premium handcrafted food made with fresh ingredients. Voted best in town 3 years in a row.',
          categories: uniqueCategories,
          menu: menuItems
        });
        
        setActiveCategory(uniqueCategories[0]);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      const yOffset = -120; // offset for sticky navs
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const getItemQuantity = (itemId) => {
    const item = cart.items.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const totalCartItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  if (isLoading) return <div className="container" style={{paddingTop: '100px'}}><h2>Loading...</h2></div>;
  if (!restaurantData) return <div className="container" style={{paddingTop: '100px'}}><h2>Restaurant not found</h2></div>;

  return (
    <div className="restaurant-details-page">
      {/* Banner Section */}
      <div className="restaurant-banner">
        <img src={restaurantData.image} alt={restaurantData.name} className="banner-img" />
        <div className="banner-overlay"></div>
      </div>

      <div className="container">
        {/* Restaurant Info Card */}
        <div className="restaurant-info-card glass-card">
          <div className="info-header">
            <h1 className="restaurant-name-large">{restaurantData.name}</h1>
            <div className="restaurant-rating-large">
              <Star fill="#fff" size={18} />
              <span>{restaurantData.rating}</span>
              <span className="review-count">({restaurantData.reviewCount} reviews)</span>
            </div>
          </div>
          
          <div className="tags-container">
            {restaurantData.tags.map(tag => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
          
          <div className="info-meta">
            <div className="meta-item">
              <Clock size={18} className="text-primary" />
              <span>{restaurantData.deliveryTime} Delivery</span>
            </div>
            <div className="meta-item">
              <MapPin size={18} className="text-primary" />
              <span>{restaurantData.location}</span>
            </div>
          </div>
          
          <div className="info-description">
            <Info size={18} className="text-muted flex-shrink-0" />
            <p>{restaurantData.description}</p>
          </div>
        </div>

        <div className="menu-layout">
          {/* Menu Categories Sidebar */}
          <div className="menu-sidebar hidden-mobile">
            <div className="sticky-sidebar">
              <h3>Menu</h3>
              <ul className="category-list">
                {restaurantData.categories.map(category => (
                  <li 
                    key={category}
                    className={activeCategory === category ? 'active' : ''}
                    onClick={() => scrollToCategory(category)}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Menu Categories Mobile Nav */}
          <div className={`mobile-category-nav visible-mobile ${isScrolled ? 'scrolled' : ''}`}>
            {restaurantData.categories.map(category => (
              <button 
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => scrollToCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Items List */}
          <div className="menu-items-container">
            {restaurantData.categories.map(category => {
              const categoryItems = restaurantData.menu.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category} id={`category-${category}`} className="menu-category-section">
                  <h2 className="category-title">{category}</h2>
                  
                  <div className="menu-grid">
                    {categoryItems.map(item => {
                      const quantity = getItemQuantity(item.id);
                      
                      return (
                        <motion.div 
                          key={item.id} 
                          className="menu-item-card"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                        >
                          <div className="item-details">
                            <div className="item-header">
                              <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}></div>
                              <h3 className="item-name">{item.name}</h3>
                            </div>
                            <p className="item-price">₹{item.price.toFixed(2)}</p>
                            <p className="item-desc">{item.description}</p>
                          </div>
                          
                          <div className="item-image-action">
                            <img src={item.image} alt={item.name} loading="lazy" />
                            
                            <div className="action-button-container">
                              {quantity === 0 ? (
                                <button 
                                  className="add-btn shadow-btn"
                                  onClick={() => addToCart({ ...item, restaurantId: restaurantData.id, restaurantName: restaurantData.name })}
                                >
                                  ADD
                                </button>
                              ) : (
                                <div className="quantity-controls shadow-btn">
                                  <button onClick={() => removeFromCart(item.id, item.price)}>
                                    <Minus size={16} />
                                  </button>
                                  <span>{quantity}</span>
                                  <button onClick={() => addToCart({ ...item, restaurantId: restaurantData.id, restaurantName: restaurantData.name })}>
                                    <Plus size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Cart Panel */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.div 
            className="sticky-cart-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="container">
              <div className="cart-panel-content">
                <div className="cart-info">
                  <div className="cart-icon-pulse">
                    <ShoppingCart size={24} color="#fff" />
                    <span className="pulse-ring"></span>
                  </div>
                  <div>
                    <span className="cart-items-count">{totalCartItems} items in cart</span>
                    <span className="cart-total">Total: ₹{cart.total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Link to="/cart" className="view-cart-btn">
                  View Cart <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetails;
