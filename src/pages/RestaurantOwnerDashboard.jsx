import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, TrendingUp, Settings, Plus, Edit2, Trash2, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './OwnerDashboard.css';



const RestaurantOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  // Registration Form State
  const [regData, setRegData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: '',
    phone: ''
  });

  // State for Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Main',
    price: '',
    description: '',
    isVeg: false
  });

  const fetchData = async () => {
    if (!user || !user.email) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      // Uses JWT email on backend — no user ID needed!
      const ownerRes = await api.get('/restaurants/mine');
      const restaurantList = ownerRes.data;
      console.log("My restaurants:", restaurantList);

      if (restaurantList && restaurantList.length > 0) {
        const myRestaurant = restaurantList[0];
        setRestaurant(myRestaurant);

        const isAppr = myRestaurant.isApproved === true || myRestaurant.approved === true;
        if (isAppr) {
          const menuData = await api.get(`/menu/${myRestaurant.restaurantId}`);
          setMenuItems(menuData.data);
          const orderData = await api.get(`/orders/restaurant/${myRestaurant.restaurantId}`);
          setOrders(orderData.data.reverse());
        }
      } else {
        setRestaurant(null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      // ownerId and ownerEmail are set automatically by the backend from the JWT token
      const payload = {
        ...regData,
        latitude: 28.6139,
        longitude: 77.2090,
        deliveryRadius: 5.0,
        minOrderAmount: 200.0,
        estimatedDeliveryMin: 30,
        avgRating: 0.0,
        isOpen: true,
        isApproved: false
      };
      await api.post('/restaurants', payload);
      alert("Restaurant registered successfully! Please wait for Admin approval.");
      fetchData();
    } catch (error) {
      console.error("Registration failed", error);
      const msg = error.response?.data?.message || error.response?.data || error.message;
      alert("Registration failed: " + msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await api.put(`/menu/toggle/${itemId}`);
      // Optimistic update
      setMenuItems(menuItems.map(item =>
        item.itemId === itemId ? { ...item, available: !item.available } : item
      ));
    } catch (error) {
      console.error("Failed to toggle availability", error);
      fetchData(); // Revert on failure
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/menu/${itemId}`);
      setMenuItems(menuItems.filter(item => item.itemId !== itemId));
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        restaurantId: restaurant.restaurantId,
        categoryId: 1, // Default category
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        discountedPrice: parseFloat(newItem.price), // Default to price
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", // Placeholder
        isVeg: newItem.isVeg,
        isAvailable: true,
        rating: 0.0,
        calories: 0,
        tags: newItem.category
      };

      await api.post('/menu', payload);
      setShowAddModal(false);
      setNewItem({ name: '', category: 'Main', price: '', description: '', isVeg: false });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to add item", error);
      alert("Error adding item: " + JSON.stringify(error.response?.data || error.message));
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/status?id=${orderId}&status=${status}`);
      fetchData();
    } catch (error) {
      console.error(`Failed to update status to ${status}`, error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const todayRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
  const todayOrders = orders.length;

  if (isLoading) return (
    <div className="admin-layout flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
      <h2>Loading your dashboard...</h2>
      <p style={{ opacity: 0.6 }}>Please wait...</p>
    </div>
  );

  if (!restaurant) {
    return (
      <div className="admin-layout flex-center" style={{ padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <motion.div 
          className="glass-card" 
          style={{ maxWidth: '650px', width: '100%', padding: '3.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏪</div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Partner with QuickBite</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Join our network and start growing your business today!</p>
          </div>
          
          <form onSubmit={handleRegisterRestaurant} className="add-item-form">
            <div className="form-group">
              <label style={{ color: 'var(--primary)', fontWeight: '700' }}>RESTAURANT NAME</label>
              <input 
                type="text" 
                required 
                style={{ fontSize: '1.1rem', padding: '1rem' }}
                placeholder="What's your restaurant called?"
                value={regData.name}
                onChange={e => setRegData({...regData, name: e.target.value})}
              />
            </div>
            
            <div className="form-row" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>CITY</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Location"
                  value={regData.city}
                  onChange={e => setRegData({...regData, city: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>CONTACT PHONE</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Mobile Number"
                  value={regData.phone}
                  onChange={e => setRegData({...regData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>CUISINE TYPE</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Italian, Sushi, North Indian"
                value={regData.cuisine}
                onChange={e => setRegData({...regData, cuisine: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>FULL ADDRESS</label>
              <textarea 
                rows="2" 
                required 
                placeholder="Street, Area, Landmark..."
                value={regData.address}
                onChange={e => setRegData({...regData, address: e.target.value})}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>ABOUT YOUR RESTAURANT</label>
              <textarea 
                rows="2" 
                required 
                placeholder="A short tagline or description for your customers..."
                value={regData.description}
                onChange={e => setRegData({...regData, description: e.target.value})}
              ></textarea>
            </div>
            
            <div style={{ marginTop: '3rem' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '700', borderRadius: '12px' }}
                disabled={isRegistering}
              >
                {isRegistering ? '🚀 Setting up your shop...' : 'Launch My Restaurant'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ width: '100%', marginTop: '1rem', border: 'none', background: 'transparent', opacity: 0.6 }}
                onClick={logout}
              >
                Go back to login
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!restaurant || !(restaurant.isApproved || restaurant.approved)) {
    return (
      <div className="admin-layout flex-center" style={{ padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <motion.div 
          className="glass-card" 
          style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 15px rgba(234, 179, 8, 0.2))' }}>⌛</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Registration Pending</h2>
          <div style={{ height: '4px', width: '60px', background: 'var(--primary)', margin: '1.5rem auto', borderRadius: '2px' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Thanks for registering <strong>{restaurant?.name}</strong>!<br/><br/>
            Our team is currently reviewing your application. 
            You'll receive full access to your orders and menu management once approved.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '1rem' }}
              onClick={fetchData}
            >
              🔄 Check Status Again
            </button>
            <button 
              className="btn-secondary" 
              style={{ border: 'none', background: 'transparent' }}
              onClick={() => { logout(); navigate('/'); }}
            >
              Logout & Exit
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isStoreOpen = restaurant.isOpen || restaurant.open;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar glass-card">
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <TrendingUp size={20} /> Orders
          </button>
          <button className={`admin-nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            <Package size={20} /> Menu Management
          </button>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', paddingTop: '1rem' }}>
            <button 
              className="admin-nav-item" 
              style={{ color: 'var(--error, #ef4444)', width: '100%' }}
              onClick={() => { logout(); navigate('/'); }}
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </nav>
      </aside>

      <main className="admin-main">
        {activeTab === 'overview' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="admin-header">
              <h1>{restaurant ? restaurant.name : 'Restaurant'} Dashboard</h1>
              <div className={`store-status ${isStoreOpen ? 'online' : 'offline'}`}>
                {isStoreOpen ? 'Taking Orders' : 'Currently Closed'}
              </div>
            </div>

            <div className="stats-cards">
              <div className="stat-card glass-card">
                <h3>Today's Orders</h3>
                <div className="stat-value">{todayOrders}</div>
                <p className="stat-trend positive">Live updates</p>
              </div>
              <div className="stat-card glass-card">
                <h3>Today's Revenue</h3>
                <div className="stat-value">₹{todayRevenue.toFixed(2)}</div>
                <p className="stat-trend positive">Live updates</p>
              </div>
              <div className="stat-card glass-card">
                <h3>Active Menu Items</h3>
                <div className="stat-value">{menuItems.filter(m => m.available).length}</div>
                <p className="stat-trend neutral">Total Items: {menuItems.length}</p>
              </div>
            </div>

            <div className="recent-orders-section glass-card">
              <div className="section-header">
                <h2>Live Orders</h2>
                <button className="btn-secondary btn-sm" onClick={() => setActiveTab('orders')}>View All</button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.orderId}>
                        <td><strong>ORD-{order.orderId}</strong></td>
                        <td>{new Date(order.orderDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>{order.items?.length || 0} items</td>
                        <td>₹{(order.finalAmount || order.totalAmount || 0).toFixed(2)}</td>
                        <td><span className={`status-pill ${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></td>
                        <td>
                          {order.orderStatus === 'PLACED' || order.orderStatus === 'PAID' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn-small" onClick={() => handleUpdateStatus(order.orderId, 'PREPARING')}>Accept</button>
                              <button className="action-btn-small" style={{ backgroundColor: '#ef4444' }} onClick={() => handleUpdateStatus(order.orderId, 'CANCELLED')}>Reject</button>
                            </div>
                          ) : order.orderStatus === 'PREPARING' ? (
                            <button className="action-btn-small" onClick={() => handleUpdateStatus(order.orderId, 'READY')}>Mark Ready</button>
                          ) : order.orderStatus === 'READY' ? (
                            <span className="text-muted">Waiting for pickup</span>
                          ) : (
                            <span className="text-muted">{order.orderStatus}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '1rem'}}>No live orders right now.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="admin-header">
              <h1>All Orders</h1>
            </div>
            <div className="glass-card menu-management-card">
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.orderId}>
                        <td><strong>ORD-{order.orderId}</strong></td>
                        <td>{new Date(order.orderDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>{order.items?.length || 0} items</td>
                        <td>₹{(order.finalAmount || order.totalAmount || 0).toFixed(2)}</td>
                        <td><span className={`status-pill ${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></td>
                        <td>
                          {order.orderStatus === 'PLACED' || order.orderStatus === 'PAID' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn-small" onClick={() => handleUpdateStatus(order.orderId, 'PREPARING')}>Accept</button>
                              <button className="action-btn-small" style={{ backgroundColor: '#ef4444' }} onClick={() => handleUpdateStatus(order.orderId, 'CANCELLED')}>Reject</button>
                            </div>
                          ) : order.orderStatus === 'PREPARING' ? (
                            <button className="action-btn-small" onClick={() => handleUpdateStatus(order.orderId, 'READY')}>Mark Ready</button>
                          ) : order.orderStatus === 'READY' ? (
                            <span className="text-muted">Waiting for pickup</span>
                          ) : (
                            <span className="text-muted">{order.orderStatus}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="admin-header">
              <h1>Menu Management</h1>
              <button className="btn-primary flex-center gap-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> Add New Item
              </button>
            </div>

            <div className="glass-card menu-management-card">
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Type</th>
                      <th>Availability</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => (
                      <tr key={item.itemId}>
                        <td><strong>{item.name}</strong></td>
                        <td>{item.tags || 'General'}</td>
                        <td>₹{item.price?.toFixed(2)}</td>
                        <td>
                          <span style={{ color: item.veg ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                            {item.veg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={item.available}
                              onChange={() => handleToggleAvailability(item.itemId)}
                            />
                            <span className="slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn danger" title="Delete" onClick={() => handleDeleteItem(item.itemId)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {menuItems.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No menu items found. Add one above!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Menu Item Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-card">
              <div className="modal-header">
                <h2>Add New Menu Item</h2>
                <button className="icon-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddItem} className="add-item-form">
                <div className="form-group">
                  <label>Item Name</label>
                  <input type="text" required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Margherita Pizza" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} placeholder="9.99" />
                  </div>
                  <div className="form-group">
                    <label>Category / Tags</label>
                    <input type="text" required value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} placeholder="e.g. Pizza, Italian" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows="3" required value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Delicious item description..."></textarea>
                </div>
                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="isVeg" checked={newItem.isVeg} onChange={e => setNewItem({ ...newItem, isVeg: e.target.checked })} />
                  <label htmlFor="isVeg" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>This item is Pure Veg</label>
                </div>
                <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantOwnerDashboard;
