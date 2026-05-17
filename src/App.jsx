import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RestaurantListing from './pages/RestaurantListing';
import RestaurantDetails from './pages/RestaurantDetails';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import OrderTracking from './pages/OrderTracking';
import UserDashboard from './pages/UserDashboard';
import RestaurantOwnerDashboard from './pages/RestaurantOwnerDashboard';
import DeliveryAgentDashboard from './pages/DeliveryAgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/restaurants" element={<RestaurantListing />} />
                <Route path="/restaurants/:id" element={<RestaurantDetails />} />
                
                {/* Protected Customer Routes */}
                <Route path="/cart" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'USER']}><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'USER']}><Payment /></ProtectedRoute>} />
                <Route path="/track/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'USER']}><OrderTracking /></ProtectedRoute>} />
                
                {/* Profile Dashboard - Accessible to all logged-in users */}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'OWNER', 'DELIVERY', 'AGENT', 'USER']}><UserDashboard /></ProtectedRoute>} />
                
                {/* Protected Role-Specific Dashboards */}
                <Route path="/owner-dashboard" element={<ProtectedRoute allowedRoles={['OWNER', 'PARTNER']}><RestaurantOwnerDashboard /></ProtectedRoute>} />
                <Route path="/agent-dashboard" element={<ProtectedRoute allowedRoles={['DELIVERY', 'AGENT']}><DeliveryAgentDashboard /></ProtectedRoute>} />
                <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
