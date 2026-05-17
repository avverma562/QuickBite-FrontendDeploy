import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email', 'link', 'reset'
  const [resetToken, setResetToken] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!email || !password) throw new Error('Please fill in all fields');

      const loggedInUser = await login(email, password);
      const role = loggedInUser.role?.toUpperCase();
      if (role === 'ADMIN') navigate('/admin-dashboard');
      else if (role === 'OWNER' || role === 'PARTNER') navigate('/owner-dashboard');
      else if (role === 'DELIVERY' || role === 'AGENT') navigate('/agent-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setForgotStep('link');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset. Ensure the email is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token: resetToken, newPassword: password });
      setSuccessMsg(res.data || 'Password updated successfully!');
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotStep('email');
        setSuccessMsg('');
        setPassword('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div
          className="auth-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span className="gradient-text">Quick</span>Bite
            </Link>
            
            {isForgotPassword ? (
              <>
                <h2>Reset Password</h2>
                <p>
                  {forgotStep === 'email' && "Enter your email to receive a reset link"}
                  {forgotStep === 'link' && "Check your inbox (Simulated)"}
                  {forgotStep === 'reset' && "Enter your new password"}
                </p>
              </>
            ) : (
              <>
                <h2>Welcome Back</h2>
                <p>Login to your account to order delicious food</p>
              </>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-error" style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)'}}>{successMsg}</div>}

          {!isForgotPassword ? (
            // NORMAL LOGIN FORM
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <div className="label-row">
                  <label>Password</label>
                  <button type="button" className="forgot-password" style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}} onClick={() => setIsForgotPassword(true)}>Forgot password?</button>
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            // FORGOT PASSWORD FLOW
            <div className="auth-form">
              {forgotStep === 'email' && (
                <form onSubmit={handleForgotPassword}>
                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={20} />
                      <input type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={20} />
                  </button>
                </form>
              )}

              {forgotStep === 'link' && (
                <div style={{textAlign: 'center', padding: '1.5rem 0'}}>
                  <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📧</div>
                  <h3 style={{color: '#10b981', marginBottom: '0.75rem'}}>Email Sent!</h3>
                  <p style={{color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem'}}>
                    A password reset link has been sent to <strong style={{color: 'var(--text)'}}>{email}</strong>.
                  </p>
                  <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>
                    Please check your inbox (and spam folder) and click the link in the email to reset your password. The link expires in <strong>15 minutes</strong>.
                  </p>
                </div>
              )}

              <button type="button" onClick={() => { setIsForgotPassword(false); setForgotStep('email'); }} className="btn-secondary w-full mt-4 flex-center gap-sm">
                <ArrowLeft size={18} /> Back to Login
              </button>
            </div>
          )}

          {!isForgotPassword && (
            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register" className="text-primary font-bold">Sign up</Link></p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
