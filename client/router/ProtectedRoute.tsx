
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'buyer' | 'vendor' | 'admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, isRehydrating } = useAuth();
  const location = useLocation();

  if (loading || isRehydrating) {
    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-zinc-50 font-black italic uppercase tracking-[0.2em] text-[10px] text-zinc-400">
            <div className="w-12 h-12 border-4 border-zinc-100 border-t-red-600 rounded-full animate-spin"></div>
            Synchronizing Vector Session...
        </div>
    );
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
