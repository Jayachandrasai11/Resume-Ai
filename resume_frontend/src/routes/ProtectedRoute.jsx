import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admins can access all pages
  if (user?.role === 'admin') {
    return <Outlet />;
  }

  // Recruiters can access all pages after onboarding is completed
  // The job session is created automatically during onboarding
  return <Outlet />;
};

export default ProtectedRoute;
