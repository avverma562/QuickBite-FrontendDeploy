import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);



  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, unreadRes] = await Promise.all([
        api.get(`/notifications/${user.id}`),
        api.get(`/notifications/unread/${user.id}`)
      ]);
      setNotifications(notifRes.data.reverse()); // Show newest first
      setUnreadCount(unreadRes.data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      fetchNotifications();
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read/all/${user.id}`);
      fetchNotifications();
    } catch (e) {}
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark');
  };

  const totalCartItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  const getHomeRoute = () => {
    if (!user) return '/';
    switch(user.role?.toUpperCase()) {
      case 'ADMIN': return '/admin-dashboard';
      case 'OWNER':
      case 'PARTNER': return '/owner-dashboard';
      case 'DELIVERY':
      case 'AGENT': return '/agent-dashboard';
      default: return '/';
    }
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    switch(user.role?.toUpperCase()) {
      case 'ADMIN': return '/admin-dashboard';
      case 'OWNER':
      case 'PARTNER': return '/owner-dashboard';
      case 'DELIVERY':
      case 'AGENT': return '/agent-dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'glass scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to={getHomeRoute()} className="navbar-logo">
          <span className="gradient-text">Quick</span>Bite
        </Link>

        <div className="navbar-search hidden-mobile">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for restaurant, cuisine or a dish" 
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && navSearch.trim() !== '') {
                  navigate('/restaurants', { state: { searchTerm: navSearch.trim() } });
                  setNavSearch('');
                }
              }}
            />
          </div>
        </div>

        <div className="navbar-actions hidden-mobile">
          <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle dark mode">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {user && (
            <div className="nav-item cart-icon-wrapper" ref={notifRef}>
              <button className="icon-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="cart-badge">{unreadCount}</span>
                )}
              </button>
              
              {isNotifOpen && (
                <div className="notifications-dropdown glass-card shadow-lg">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="text-xs text-primary" onClick={markAllAsRead}>Mark all as read</button>
                    )}
                  </div>
                  <div className="notif-body">
                    {notifications.length === 0 ? (
                      <div className="empty-notifs">No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.notificationId} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => !n.isRead && markAsRead(n.notificationId)}>
                          <div className="notif-icon">
                            {n.type === 'ORDER' ? '🍔' : n.type === 'DELIVERY' ? '🛵' : n.type === 'PAYMENT' ? '💳' : '🔔'}
                          </div>
                          <div className="notif-content">
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                          </div>
                          {!n.isRead && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/cart" className="nav-item cart-icon-wrapper">
            <ShoppingCart size={24} />
            {totalCartItems > 0 && (
              <span className="cart-badge">{totalCartItems}</span>
            )}
          </Link>

          {user ? (
            <div className="user-menu">
              <Link to={getDashboardRoute()} className="nav-item flex-center gap-sm">
                <User size={20} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </div>
          )}
        </div>

        <button 
          className="mobile-menu-btn visible-mobile"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu glass">
          <div className="search-bar mobile">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search..." />
          </div>
          
          <div className="mobile-actions">
            <Link to="/cart" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <ShoppingCart size={20} />
              <span>Cart ({totalCartItems})</span>
            </Link>
            
            <button onClick={toggleDarkMode} className="mobile-nav-item">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {user ? (
              <>
                <Link to={getDashboardRoute()} className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={20} />
                  <span>Dashboard</span>
                </Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="mobile-nav-item text-red">
                  Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn-secondary w-full" style={{textAlign: 'center'}} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary w-full" style={{textAlign: 'center'}} onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
