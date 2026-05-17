import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Clock, Filter, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './RestaurantListing.css';

const categories = ['All', 'Pizza', 'Burger', 'Sushi', 'Healthy', 'Italian', 'Indian', 'Mexican'];

const RestaurantListing = () => {
  const [restaurantsData, setRestaurantsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterVeg, setFilterVeg] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        const mappedData = response.data.map(r => ({
          id: r.restaurantId,
          name: r.name,
          rating: r.avgRating > 0 ? r.avgRating.toFixed(1) : 'New',
          deliveryTime: `${r.estimatedDeliveryMin || 30} mins`,
          tags: r.cuisine ? r.cuisine.split(',') : ['Various'],
          image: `https://images.unsplash.com/photo-${r.restaurantId % 2 === 0 ? '1568901346375-23c9450c58cd' : '1504674900247-0877df9cc836'}?auto=format&fit=crop&q=80&w=800`,
          price: '₹₹',
          isVeg: r.cuisine ? r.cuisine.toLowerCase().includes('veg') || r.cuisine.toLowerCase().includes('salad') : false
        }));
        setRestaurantsData(mappedData);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // Filter logic
  const filteredRestaurants = restaurantsData.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          restaurant.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || restaurant.tags.some(tag => tag.trim().toLowerCase() === selectedCategory.toLowerCase());
    const matchesVeg = !filterVeg || restaurant.isVeg;
    
    return matchesSearch && matchesCategory && matchesVeg;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="listing-page">
      {/* Header / Search Section */}
      <section className="listing-header">
        <div className="container">
          <div className="header-content">
            <div className="location-selector">
              <MapPin size={20} className="text-primary" />
              <span>Delivering to <strong>New York, NY</strong></span>
            </div>
            
            <div className="search-filter-container">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search for restaurants or cuisines..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Categories / Filters */}
          <div className="filters-container">
            <div className="categories-scroll">
              {categories.map(category => (
                <button 
                  key={category}
                  className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="advanced-filters">
              <button 
                className={`filter-btn ${filterVeg ? 'active-veg' : ''}`}
                onClick={() => setFilterVeg(!filterVeg)}
              >
                <div className={`veg-icon ${filterVeg ? 'active' : ''}`}></div>
                Pure Veg
              </button>
              
              <button className="filter-btn" onClick={() => alert("Advanced filters coming soon!")}>
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="container">
          <div className="results-header">
            <h2>{filteredRestaurants.length} restaurants to explore</h2>
          </div>

          {filteredRestaurants.length > 0 ? (
            <motion.div 
              className="restaurant-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRestaurants.map((restaurant) => (
                <motion.div 
                  key={restaurant.id} 
                  className="glass-card restaurant-card"
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                >
                  <Link to={`/restaurants/${restaurant.id}`}>
                    <div className="restaurant-image-wrapper">
                      <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" loading="lazy" />
                      <div className="delivery-time-badge">
                        <Clock size={14} /> {restaurant.deliveryTime}
                      </div>
                    </div>
                    <div className="restaurant-info">
                      <div className="restaurant-header">
                        <h3 className="restaurant-name">{restaurant.name}</h3>
                        <div className="restaurant-rating">
                          <Star size={16} fill="var(--primary)" color="var(--primary)" />
                          <span>{restaurant.rating}</span>
                        </div>
                      </div>
                      <div className="restaurant-tags">
                        {restaurant.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                        <span className="tag-price">{restaurant.price}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="no-results">
              <div className="empty-state-icon">🍽️</div>
              <h3>No restaurants found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button 
                className="btn-primary" 
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setFilterVeg(false); }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RestaurantListing;
