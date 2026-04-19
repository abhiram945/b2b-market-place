
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import BuyerDashboard from '../pages/dashboard/BuyerDashboard';
import VendorDashboard from '../pages/dashboard/VendorDashboard';
import ProductsList from '../pages/products/ProductsList';
import MyOrders from '../pages/orders/MyOrders';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/common/MainLayout';
import { useAuth } from '../hooks/useAuth';
import Cart from '../pages/Cart';
import ContactUs from '../pages/ContactUs';
import Maintenance from '../pages/Maintenance';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminProductList from '../pages/products/AdminProductList';
import { ROLES } from '../utils/constants';

const AppRouter = () => {
  const { activeRole } = useAuth();

  // Determine which dashboard route is appropriate based on activeRole
  const getDashboardElement = (role: string) => {
    switch (role) {
      case 'vendor': return <VendorDashboard />;
      case 'admin': return <AdminDashboard />;
      case 'buyer':
      default: return <BuyerDashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact-us" element={<ContactUs />} />
      
      {/* Publicly accessible product list */}
      <Route path="/products" element={<MainLayout><ProductsList /></MainLayout>} />

      {/* Role-specific dashboards */}
      {/* Using a single dynamic route for dashboards based on activeRole */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.BUYER, ROLES.VENDOR, ROLES.ADMIN]}><MainLayout>{getDashboardElement(activeRole as string)}</MainLayout></ProtectedRoute>} />
      <Route path="/buyer-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/vendor-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
      
      {/* Orders page is accessible to all authenticated users */}
      <Route path="/orders" element={<ProtectedRoute allowedRoles={[ROLES.BUYER, ROLES.VENDOR, ROLES.ADMIN]}><MainLayout><MyOrders /></MainLayout></ProtectedRoute>} />
      
      {/* Cart is only for buyers */}
      <Route path="/cart" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><MainLayout><Cart /></MainLayout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><MainLayout><AdminProductList /></MainLayout></ProtectedRoute>} />
      {/* Redirect any unmatched routes to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
