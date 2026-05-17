import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Home.css';

// Mock data
const categories = [
  { id: 1, name: 'Pizza', image: '🍕' },
  { id: 2, name: 'Burger', image: '🍔' },
  { id: 3, name: 'Sushi', image: '🍣' },
  { id: 4, name: 'Healthy', image: '🥗' },
  { id: 5, name: 'Dessert', image: '🍰' },
  { id: 6, name: 'Coffee', image: '☕' },
  { id: 7, name: 'Asian', image: '🍜' },
  { id: 8, name: 'Mexican', image: '🌮' },
];

const Home = () => {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        // Get the first 3 restaurants as "featured"
        const topRestaurants = response.data.slice(0, 3).map(r => ({
          id: r.restaurantId,
          name: r.name,
          rating: r.avgRating > 0 ? r.avgRating.toFixed(1) : 'New',
          deliveryTime: `${r.estimatedDeliveryMin || 30} mins`,
          tags: r.cuisine ? r.cuisine.split(', ') : ['Various'],
          image: `https://images.unsplash.com/photo-${r.restaurantId % 2 === 0 ? '1552566626-52f8b828add9' : '1504674900247-0877df9cc836'}?auto=format&fit=crop&q=80&w=800`,
          price: '₹₹'
        }));
        setFeaturedRestaurants(topRestaurants);
      } catch (error) {
        console.error('Error fetching featured restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);
  // Animation variants
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="hero-title">
              Delicious food, <br />
              <span className="gradient-text">delivered fast.</span>
            </h1>
            <p className="hero-subtitle">
              Craving something amazing? Get the best food from top restaurants delivered straight to your door in minutes.
            </p>

            <div className="hero-actions">
              <Link to="/restaurants" className="btn-primary btn-lg">
                Explore Restaurants <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="hero-image-wrapper"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <div className="hero-image-blob">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                alt="Delicious food platter"
                className="hero-img"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>What are you craving?</h2>
          </div>

          <motion.div
            className="categories-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                className="category-card"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="category-icon">{category.image}</div>
                <span className="category-name">{category.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Restaurants</h2>
            <Link to="/restaurants" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <motion.div
            className="restaurant-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredRestaurants.map((restaurant) => (
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
        </div>
      </section>
    </div>
  );
};

export default Home;
