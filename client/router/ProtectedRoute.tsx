
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'buyer' | 'vendor' | 'admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to the user's specific dashboard if unauthorized for this route
    let redirectPath = '/'; // Default to landing page

    if (user.role === 'buyer') {
        redirectPath = '/buyer-dashboard';
    } else if (user.role === 'vendor') {
        redirectPath = '/vendor-dashboard';
    } else if (user.role === 'admin') {
        redirectPath = '/admin-dashboard';
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
