import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, CheckCircle2, XCircle, Edit2, X, Save, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './DeliveryAgentDashboard.css';

const DeliveryAgentDashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState('');

  const getTodayStr = () => new Date().toLocaleDateString();
  const [dailyStats, setDailyStats] = useState(() => {
    if (!user || !user.id) return { date: getTodayStr(), earnings: 0, deliveries: 0 };
    const saved = localStorage.getItem(`agent_daily_stats_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === getTodayStr()) return parsed;
    }
    return { date: getTodayStr(), earnings: 0, deliveries: 0 };
  });

  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(`agent_daily_stats_${user.id}`, JSON.stringify(dailyStats));
    }
  }, [dailyStats, user]);

  const fetchActiveOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/orders/active');
      // Filter out DELIVERED just in case
      const active = response.data.filter(o => o.orderStatus !== 'DELIVERED');
      
      const detailedOrders = await Promise.all(active.map(async o => {
        let restaurantName = `Restaurant #${o.restaurantId}`;
        let restaurantAddress = 'Address not available';
        let customerName = `Customer #${o.customerId}`;
        
        try {
          const restRes = await api.get(`/restaurants/${o.restaurantId}`);
          if (restRes.data) {
            restaurantName = restRes.data.name || restaurantName;
            restaurantAddress = restRes.data.address || restaurantAddress;
          }
        } catch (e) {
          console.error(`Failed to fetch restaurant ${o.restaurantId}`);
        }
        
        try {
          const userRes = await api.get(`/auth/user/${o.customerId}`);
          if (userRes.data) {
            customerName = userRes.data.fullName || userRes.data.name || customerName;
          }
        } catch (e) {
          console.error(`Failed to fetch customer ${o.customerId}`);
        }
        
        return {
          id: `ORD-${o.orderId}`,
          rawId: o.orderId,
          restaurant: restaurantName,
          restaurantAddress: restaurantAddress,
          customer: customerName,
          customerAddress: o.deliveryAddress || 'Address not provided',
          amount: o.finalAmount || 0,
          status: o.orderStatus || 'ASSIGNED', 
          distance: '2.4 km'
        };
      }));
      
      setOrders(detailedOrders);
    } catch (error) {
      console.error("Failed to fetch active orders", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchActiveOrders();
      // Polling could be set up here
      const interval = setInterval(fetchActiveOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const handleUpdateStatus = async (order) => {
    const id = order.rawId;
    const currentStatus = order.status;
    let nextStatus = '';
    
    if (['ASSIGNED', 'PREPARING', 'READY', 'PLACED', 'PAID'].includes(currentStatus)) {
      nextStatus = 'PICKED_UP';
    } else if (currentStatus === 'PICKED_UP') {
      nextStatus = 'DELIVERED';
    } else {
      nextStatus = 'DELIVERED'; // Fallback
    }

    try {
      await api.put(`/orders/status?id=${id}&status=${nextStatus}`);
      if (nextStatus === 'PICKED_UP') {
        const estEarning = order.amount * 0.1;
        setDailyStats(prev => ({
          ...prev,
          earnings: prev.earnings + estEarning,
          deliveries: prev.deliveries + 1
        }));
      } else if (nextStatus === 'DELIVERED') {
        alert(`Order ORD-${id} delivered successfully!`);
      }
      fetchActiveOrders(); // Refresh
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Could not update order status");
    }
  };

  const handleProfileSave = () => {
    if (!profileName || profileName.trim() === '') {
      alert('Name cannot be empty');
      return;
    }
    updateProfile(profileName);
    setIsEditingProfile(false);
    alert('Profile updated successfully!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (user && user.isApproved === false) {
    return (
      <div className="admin-layout flex-center" style={{ padding: '2rem', textAlign: 'center' }}>
        <motion.div className="glass-card" style={{ maxWidth: '500px', padding: '3rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ marginBottom: '1rem' }}>Approval Pending</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Welcome, <strong>{user.name}</strong>! Your delivery agent account has been created successfully. 
            However, it is currently <strong>pending admin approval</strong>. 
            <br/><br/>
            Please check back later or contact support if this takes more than 24 hours.
          </p>
          <button className="btn-secondary mt-4" onClick={handleLogout}>Logout</button>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="agent-dashboard">
      <main className="container agent-main">
        <div className="agent-controls glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div className="agent-profile-mini">
            <div className="avatar-small">{profileName ? profileName[0].toUpperCase() : 'D'}</div>
            <div>
              <h3>{profileName || 'Delivery Partner'}</h3>
              <p>Active Status</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setIsEditingProfile(true)}
            >
              <Edit2 size={15} /> Edit Profile
            </button>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--error, #ef4444)' }}
              onClick={handleLogout}
            >
              <LogOut size={15} /> Logout
            </button>
            <div className="status-toggle">
              <span className={isOnline ? 'text-green' : 'text-muted'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isOnline} 
                  onChange={() => setIsOnline(!isOnline)} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        {isEditingProfile && (
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="icon-btn"><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.7 }}>Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', opacity: 0.7 }}>Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="form-input"
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleProfileSave}>
                <Save size={16} /> Save Changes
              </button>
              <button className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="earnings-banner glass-card">
          <div>
            <p>Today's Earnings</p>
            <h2>₹{dailyStats.earnings.toFixed(2)}</h2>
            <small style={{opacity: 0.7}}>Live updates from today</small>
          </div>
          <div className="earnings-stats">
            <div className="stat">
              <span>Deliveries</span>
              <strong>{dailyStats.deliveries}</strong>
            </div>
            <div className="stat">
              <span>Online Time</span>
              <strong>4h 30m</strong>
            </div>
          </div>
        </div>

        <div className="orders-section">
          <h2 className="section-title">Current Assignments</h2>
          
          {!isOnline ? (
            <div className="offline-state glass-card">
              <div className="offline-icon">😴</div>
              <h3>You are offline</h3>
              <p>Go online to start receiving delivery requests.</p>
              <button className="btn-primary mt-4" onClick={() => setIsOnline(true)}>Go Online</button>
            </div>
          ) : isLoading && orders.length === 0 ? (
            <div className="flex-center" style={{padding: '3rem'}}>
              <h3>Loading orders...</h3>
            </div>
          ) : orders.length > 0 ? (
            <div className="assigned-orders-list">
              {orders.map(order => (
                <motion.div 
                  key={order.id} 
                  className="delivery-order-card glass-card"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="order-card-header">
                    <span className="order-id">{order.id}</span>
                    <span className="order-distance">{order.distance} total</span>
                  </div>

                  <div className="delivery-route">
                    <div className="route-point pickup">
                      <div className="point-icon"><MapPin size={16} /></div>
                      <div className="point-details">
                        <span className="point-label">Pickup</span>
                        <h4>{order.restaurant}</h4>
                        <p>{order.restaurantAddress}</p>
                      </div>
                    </div>
                    
                    <div className="route-line"></div>
                    
                    <div className="route-point dropoff">
                      <div className="point-icon"><Navigation size={16} /></div>
                      <div className="point-details">
                        <span className="point-label">Drop-off</span>
                        <h4>{order.customer}</h4>
                        <p>{order.customerAddress}</p>
                      </div>
                      <button className="icon-btn-circle"><Phone size={16} /></button>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <div className="earning-estimate">
                      Est. Earning: <strong>₹{(order.amount * 0.1).toFixed(2)}</strong>
                    </div>
                    
                    <div className="action-buttons">
                      {order.status !== 'PICKED_UP' ? (
                        <button 
                          className="btn-primary w-full flex-center gap-sm"
                          onClick={() => handleUpdateStatus(order)}
                        >
                          <CheckCircle2 size={18} /> Confirm Pickup
                        </button>
                      ) : (
                        <button 
                          className="btn-success w-full flex-center gap-sm"
                          onClick={() => handleUpdateStatus(order)}
                        >
                          <CheckCircle2 size={18} /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state glass-card">
              <div className="radar-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h3>Looking for orders...</h3>
              <p>Stay near popular restaurants to get orders faster.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DeliveryAgentDashboard;
