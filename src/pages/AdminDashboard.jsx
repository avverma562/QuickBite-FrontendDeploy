import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Bike, PieChart, AlertCircle, CheckCircle, XCircle, Search, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './OwnerDashboard.css'; // Reusing similar sidebar styles


const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await api.get('/orders/all');
      setAllOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/auth/user/all');
      setUsers(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchAllOrders();
    fetchAllUsers();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchAllUsers();
      fetchAllOrders();
      fetchRestaurants();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refetch users when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab]);

  // Filter users on search
  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers(users);
    } else {
      const q = userSearch.toLowerCase();
      setFilteredUsers(users.filter(u =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      ));
    }
  }, [userSearch, users]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/restaurants/approve/${id}`);
      fetchRestaurants();
    } catch (error) {
      console.error('Failed to approve restaurant:', error);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      await api.put(`/auth/user/ban/${userId}`);
      fetchAllUsers();
    } catch (error) {
      console.error('Failed to toggle ban:', error);
      alert('Could not update user status. Make sure authService is running.');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.put(`/auth/user/approve/${userId}`);
      fetchAllUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Could not approve user.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const pendingCount = restaurants.filter(r => !r.approved).length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar glass-card">
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <PieChart size={20} /> Platform Overview
          </button>
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={20} /> Users & Agents
          </button>
          <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={20} /> All Orders
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
              <h1>Platform Overview</h1>
            </div>

            <div className="stats-cards">
              <div className="stat-card glass-card">
                <h3>Total Revenue</h3>
                <div className="stat-value">₹{allOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0).toFixed(0)}</div>
                <p className="stat-trend positive">Total processed sales</p>
              </div>
              <div className="stat-card glass-card">
                <h3>Total Registered Users</h3>
                <div className="stat-value">{users.length}</div>
                <p className="stat-trend positive">Customers, Agents & Owners</p>
              </div>
              <div className="stat-card glass-card">
                <h3>Total Restaurants</h3>
                <div className="stat-value">{restaurants.length}</div>
                <p className="stat-trend positive">Onboarded on platform</p>
              </div>
            </div>

            <div className="recent-orders-section glass-card">
              <div className="section-header">
                <h2>Pending Approvals</h2>
                <span className="badge" style={{backgroundColor: '#eab308'}}>{pendingCount} Action Needed</span>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Restaurant Name</th>
                      <th>City</th>
                      <th>Owner ID</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.filter(r => !r.approved).map(r => (
                      <tr key={r.restaurantId}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.city}</td>
                        <td>#{r.ownerId}</td>
                        <td><span className="status-pill pending" style={{background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04'}}>Pending</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn" style={{color: '#16a34a'}} title="Approve" onClick={() => handleApprove(r.restaurantId)}>
                              <CheckCircle size={20} />
                            </button>
                            <button className="icon-btn danger" title="Reject"><XCircle size={20} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingCount === 0 && (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No pending restaurants!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="recent-orders-section glass-card" style={{marginTop: '2rem'}}>
              <div className="section-header">
                <h2>Approved Restaurants</h2>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Restaurant Name</th>
                      <th>City</th>
                      <th>Owner ID</th>
                      <th>Rating</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.filter(r => r.approved).map(r => (
                      <tr key={r.restaurantId}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.city}</td>
                        <td>#{r.ownerId}</td>
                        <td>{r.avgRating || 'New'}</td>
                        <td><span className="status-pill delivered" style={{background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a'}}>Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="admin-header">
              <div>
                <h1>Users & Agents</h1>
                {lastUpdated && (
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.2rem' }}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="search-bar" style={{width: '250px'}}>
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by name, email, role..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <button 
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                  onClick={fetchAllUsers}
                  disabled={usersLoading}
                >
                  🔄 {usersLoading ? 'Refreshing...' : 'Refresh Now'}
                </button>
              </div>
            </div>
            <div className="glass-card menu-management-card">
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', opacity: 0.6}}>🔄 Loading users...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', opacity: 0.6}}>No data found</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', opacity: 0.6}}>No users match your search</td></tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.fullName || 'N/A'}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="status-pill"
                              style={u.active
                                ? {background:'rgba(34,197,94,0.1)', color:'#16a34a'}
                                : {background:'rgba(239,68,68,0.1)', color:'#dc2626'}}>
                              {u.active ? 'Active' : 'Banned'}
                            </span>
                            {!u.approved && (
                              <span className="status-pill" style={{background:'rgba(234,179,8,0.1)', color:'#ca8a04', fontSize: '0.7rem'}}>
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            {!u.approved && (
                              <button 
                                className="btn-primary btn-sm"
                                onClick={() => handleApproveUser(u.id)}
                                style={{ padding: '0.4rem 0.8rem' }}
                              >
                                Approve
                              </button>
                            )}
                            <button
                              className="btn-secondary btn-sm"
                              style={u.active
                                ? {color:'#dc2626', borderColor:'#dc2626'}
                                : {color:'#16a34a', borderColor:'#16a34a'}}
                              onClick={() => handleToggleBan(u.id)}
                            >
                              {u.active ? 'Ban' : 'Unban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'orders' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="admin-header">
              <h1>All Active Orders</h1>
            </div>
            <div className="glass-card menu-management-card">
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Restaurant</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No active orders found</td></tr>
                    ) : allOrders.map(o => (
                      <tr key={o.orderId}>
                        <td><strong>ORD-{o.orderId}</strong></td>
                        <td>Customer #{o.customerId}</td>
                        <td>Restaurant #{o.restaurantId}</td>
                        <td>₹{(o.finalAmount || o.totalAmount || 0).toFixed(2)}</td>
                        <td><span className="status-pill">{o.orderStatus}</span></td>
                        <td>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
