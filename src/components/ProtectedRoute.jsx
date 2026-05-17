import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role?.toUpperCase())) {
    // If user is logged in but doesn't have the right role, redirect to their dashboard or home
    switch(user.role?.toUpperCase()) {
      case 'ADMIN': return <Navigate to="/admin-dashboard" replace />;
      case 'OWNER':
      case 'PARTNER': return <Navigate to="/owner-dashboard" replace />;
      case 'DELIVERY':
      case 'AGENT': return <Navigate to="/agent-dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
