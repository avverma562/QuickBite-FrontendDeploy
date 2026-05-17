import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, ShoppingBag, Star, LogOut, Edit2, ChevronRight, Clock, Save, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './UserDashboard.css';

const TAB_PROFILE = 'profile';
const TAB_ORDERS = 'orders';
const TAB_ADDRESSES = 'addresses';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState(TAB_PROFILE);
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 000-1234');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('user_addresses');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, type: 'Home', address: '123 Main Street, Apt 4B, New York, NY 10001', icon: '🏠' },
      { id: 2, type: 'Work', address: '456 Business Blvd, Floor 12, New York, NY 10002', icon: '🏢' },
    ];
  });
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [editAddrText, setEditAddrText] = useState('');
  const [editAddrType, setEditAddrType] = useState('');

  // Rating State
  const [orderRatings, setOrderRatings] = useState(() => {
    const saved = localStorage.getItem('order_ratings');
    return saved ? JSON.parse(saved) : {};
  });

  const CUSTOMER_ID = user?.id || 1;

  // Effects
  useEffect(() => {
    localStorage.setItem('user_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem('order_ratings', JSON.stringify(orderRatings));
  }, [orderRatings]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/orders/customer/${CUSTOMER_ID}`);
        const mappedOrders = response.data.map(o => ({
          id: `ORD-${o.orderId}`,
          rawId: o.orderId,
          restaurant: `Restaurant #${o.restaurantId}`, 
          items: o.items ? o.items.map(item => `${item.name} x${item.quantity}`) : [],
          total: o.finalAmount || o.totalAmount || 0,
          status: o.orderStatus,
          date: new Date(o.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }));
        setOrders(mappedOrders.reverse()); 
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (activeTab === TAB_ORDERS || activeTab === TAB_PROFILE) {
      fetchOrders();
    }
  }, [activeTab]);

  // Handlers
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReorder = async (orderId) => {
    try {
      await api.post(`/orders/reorder/${orderId}`);
      alert("Reordered successfully! Check your new orders.");
      setActiveTab(TAB_ORDERS);
    } catch (error) {
      console.error('Failed to reorder', error);
      alert("Could not reorder. Please try again.");
    }
  };

  const handleProfileSave = async () => {
    if (!profileName || profileName.trim() === '') {
      alert("Empty name is not allowed");
      return;
    }
    
    setIsSavingProfile(true);
    try {
      await api.put('/auth/user/profile', { name: profileName, phone: profilePhone });
      updateProfile(profileName);
      alert("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (e) {
      updateProfile(profileName);
      alert("Profile saved locally! (Backend update requires real token).");
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRateOrder = (orderId, rating) => {
    setOrderRatings(prev => ({ ...prev, [orderId]: rating }));
  };

  const handleEditAddressStart = (addr) => {
    setEditingAddrId(addr.id);
    setEditAddrText(addr.address);
    setEditAddrType(addr.type);
  };

  const handleSaveAddress = () => {
    if (editingAddrId === 'new') {
      const newAddr = {
        id: Date.now(),
        type: editAddrType || 'Other',
        address: editAddrText,
        icon: editAddrType.toLowerCase() === 'home' ? '🏠' : editAddrType.toLowerCase() === 'work' ? '🏢' : '📍'
      };
      setAddresses([...addresses, newAddr]);
    } else {
      setAddresses(addresses.map(a => 
        a.id === editingAddrId 
          ? { ...a, type: editAddrType, address: editAddrText, icon: editAddrType.toLowerCase() === 'home' ? '🏠' : editAddrType.toLowerCase() === 'work' ? '🏢' : '📍' } 
          : a
      ));
    }
    setEditingAddrId(null);
  };

  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const tabs = [
    { id: TAB_PROFILE, label: 'Profile', icon: <User size={18} /> }
  ];

  if (!user?.role || user?.role?.toUpperCase() === 'CUSTOMER' || user?.role?.toUpperCase() === 'USER') {
    tabs.push({ id: TAB_ORDERS, label: 'Order History', icon: <ShoppingBag size={18} /> });
    tabs.push({ id: TAB_ADDRESSES, label: 'Saved Addresses', icon: <MapPin size={18} /> });
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="dashboard-page">
      <div className="container dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="user-profile-card glass-card">
            <div className="avatar-wrapper">
              <div className="avatar">
                {profileName?.[0] || 'U'}
              </div>
            </div>
            <h2 className="user-name">{profileName}</h2>
            <p className="user-email">{profileEmail}</p>
          </div>

          <nav className="dashboard-nav glass-card">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <ChevronRight size={16} className="tab-arrow" />
              </button>
            ))}

            <div className="nav-divider" />

            <button className="nav-tab logout-tab" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Profile Tab */}
          {activeTab === TAB_PROFILE && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <div className="section-heading">
                <h2>My Profile</h2>
                {!isEditingProfile && (
                  <button className="edit-btn btn-secondary" onClick={() => setIsEditingProfile(true)}>
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>

              <div className="glass-card profile-form-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      disabled={!isEditingProfile}
                      className="form-input" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      disabled={true} // Email should not be changeable easily
                      className="form-input" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)}
                      disabled={!isEditingProfile}
                      className="form-input" 
                    />
                  </div>
                </div>
                {isEditingProfile && (
                  <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                    <button className="btn-primary save-btn" onClick={handleProfileSave} disabled={isSavingProfile}>
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-secondary" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <ShoppingBag size={28} className="stat-icon" />
                  <div>
                    <h3>{orders.length}</h3>
                    <p>Total Orders</p>
                  </div>
                </div>
                <div className="stat-card glass-card">
                  <Star size={28} className="stat-icon" fill="var(--primary)" />
                  <div>
                    <h3>{Object.keys(orderRatings).length > 0 ? (Object.values(orderRatings).reduce((a,b)=>a+b,0)/Object.keys(orderRatings).length).toFixed(1) : '0.0'}</h3>
                    <p>Avg. Rating Given</p>
                  </div>
                </div>
                <div className="stat-card glass-card">
                  <Clock size={28} className="stat-icon" />
                  <div>
                    <h3>₹{totalSpent.toFixed(2)}</h3>
                    <p>Total Spent</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === TAB_ORDERS && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <div className="section-heading">
                <h2>Order History</h2>
              </div>

              {isLoading ? (
                <div className="flex-center" style={{padding: '3rem'}}>
                  <h3>Loading orders...</h3>
                </div>
              ) : orders.length === 0 ? (
                <div className="glass-card flex-center" style={{padding: '3rem', flexDirection: 'column'}}>
                  <h3>No orders yet</h3>
                  <p className="text-muted">Looks like you haven't ordered anything!</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => {
                    const rating = orderRatings[order.rawId] || 0;
                    return (
                      <div key={order.id} className="order-card glass-card">
                        <div className="order-header">
                          <div>
                            <h3 className="order-restaurant">{order.restaurant}</h3>
                            <p className="order-meta">{order.date} · {order.id}</p>
                          </div>
                          <div className={`order-status-badge ${order.status?.toLowerCase() === 'delivered' ? 'delivered' : 'pending'}`}>
                            {order.status || 'PROCESSING'}
                          </div>
                        </div>

                        <div className="order-items">
                          {order.items.map((item, i) => (
                            <span key={i} className="order-item-tag">{item}</span>
                          ))}
                        </div>

                        <div className="order-footer">
                          <div className="order-total">Total: <strong>₹{order.total.toFixed(2)}</strong></div>
                          
                          <div className="order-rating-interactive" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Rate: </span>
                            <div className="stars-container" style={{display: 'flex'}}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={18}
                                  className="clickable-star"
                                  fill={star <= rating ? '#f59e0b' : 'none'}
                                  color={star <= rating ? '#f59e0b' : 'var(--border)'}
                                  onClick={() => handleRateOrder(order.rawId, star)}
                                  style={{cursor: 'pointer'}}
                                />
                              ))}
                            </div>
                          </div>

                          <button className="btn-secondary reorder-btn" onClick={() => handleReorder(order.rawId)}>
                            Reorder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === TAB_ADDRESSES && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <div className="section-heading">
                <h2>Saved Addresses</h2>
              </div>

              <div className="addresses-list">
                {addresses.map(addr => (
                  <div key={addr.id} className="address-card glass-card">
                    {editingAddrId === addr.id ? (
                      <div className="edit-address-form" style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <input type="text" value={editAddrType} onChange={e => setEditAddrType(e.target.value)} placeholder="Type (Home, Work, etc)" className="form-input" />
                        <textarea value={editAddrText} onChange={e => setEditAddrText(e.target.value)} className="form-input" rows="2" />
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button className="btn-primary" onClick={handleSaveAddress} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Save</button>
                          <button className="btn-secondary" onClick={() => setEditingAddrId(null)} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Cancel</button>
                          <button className="btn-secondary" onClick={() => handleDeleteAddress(addr.id)} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--secondary)'}}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="address-icon">{addr.icon}</div>
                        <div className="address-details">
                          <h3>{addr.type}</h3>
                          <p>{addr.address}</p>
                        </div>
                        <div className="address-actions">
                          <button className="icon-action-btn" onClick={() => handleEditAddressStart(addr)}><Edit2 size={16} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {editingAddrId === 'new' ? (
                  <div className="address-card glass-card">
                    <div className="edit-address-form" style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <input type="text" value={editAddrType} onChange={e => setEditAddrType(e.target.value)} placeholder="Type (Home, Work, etc)" className="form-input" />
                      <textarea value={editAddrText} onChange={e => setEditAddrText(e.target.value)} placeholder="Full Address" className="form-input" rows="2" />
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn-primary" onClick={handleSaveAddress} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Save</button>
                        <button className="btn-secondary" onClick={() => setEditingAddrId(null)} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="add-address-card" onClick={() => { setEditingAddrId('new'); setEditAddrType(''); setEditAddrText(''); }}>
                    <span className="plus-icon">+</span>
                    <span>Add New Address</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
