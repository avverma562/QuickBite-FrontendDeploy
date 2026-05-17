import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT token payload (middle part of the token)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const savedName = localStorage.getItem('profileName');
        setUser({ 
          email: payload.sub, 
          role: payload.role || 'USER', 
          id: payload.userId,
          isApproved: payload.isApproved,
          name: savedName || payload.name || payload.sub.split('@')[0]
        });
      } catch (e) {
        console.error("Failed to parse token", e);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data; // The backend returns a String (JWT)
      
      localStorage.setItem('token', token);
      localStorage.removeItem('profileName');
      
      // Decode token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userPayload = { 
        email: payload.sub, 
        role: payload.role || 'USER',
        id: payload.userId,
        isApproved: payload.isApproved,
        name: payload.name || email.split('@')[0]
      };
      setUser(userPayload);
      return userPayload;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Failed to register. Please try again.');
    }
  };

  const updateProfile = (newName) => {
    setUser(prev => ({ ...prev, name: newName }));
    localStorage.setItem('profileName', newName);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
