import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Building2, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER'); // CUSTOMER, PARTNER, AGENT
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, logout } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name || !email || !password) {
        throw new Error('Please fill in all fields');
      }

      // 🧹 Clear any existing session first
      logout();

      // Call the backend registration API
      await register(name, email, password, role);
      
      // For AGENT and PARTNER, they need admin approval, so don't auto-login
      if (role === 'AGENT' || role === 'PARTNER') {
        alert("Registration Successful! Your account is pending admin approval. Please log in once approved.");
        navigate('/login');
        return;
      }

      // Automatically login after successful registration for Customers
      await login(email, password);
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-card glass-card register-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span className="gradient-text">Quick</span>Bite
            </Link>
            <h2>Create an Account</h2>
            <p>Join us and start enjoying delicious meals</p>
          </div>

          <div className="role-selector">
            <button 
              type="button"
              className={`role-btn ${role === 'CUSTOMER' ? 'active' : ''}`}
              onClick={() => setRole('CUSTOMER')}
            >
              <User size={18} /> Customer
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'PARTNER' ? 'active' : ''}`}
              onClick={() => setRole('PARTNER')}
            >
              <Building2 size={18} /> Restaurant
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'AGENT' ? 'active' : ''}`}
              onClick={() => setRole('AGENT')}
            >
              <Bike size={18} /> Delivery
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'ADMIN' ? 'active' : ''}`}
              onClick={() => setRole('ADMIN')}
            >
              <User size={18} /> Admin
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="text-primary font-bold">Sign in</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
