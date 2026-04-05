
import React, { useMemo } from 'react';
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
import AdminDashboard from '../pages/dashboard/AdminDashboard'; // Import AdminDashboard
import AdminProductList from '../pages/products/AdminProductList'; // Import AdminProductList

const AppRouter = () => {
    const { isAuthenticated, role } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/products" element={<MainLayout><ProductsList /></MainLayout>} />

            <Route
                path="/buyer-dashboard"
                element={useMemo(() => (
                    <ProtectedRoute allowedRoles={['buyer']}>
                        <MainLayout><BuyerDashboard /></MainLayout>
                    </ProtectedRoute>
                ), [isAuthenticated, role])}
            />
            <Route
                path="/vendor-dashboard"
                element={useMemo(() => (
                    <ProtectedRoute allowedRoles={['vendor']}>
                        <MainLayout><VendorDashboard /></MainLayout>
                    </ProtectedRoute>
                ), [isAuthenticated, role])}
            />
            <Route
                path="/admin-dashboard"
                element={useMemo(() => (
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminDashboard /></MainLayout>
                    </ProtectedRoute>
                ), [isAuthenticated, role])}
            />
            {/* Admin Product Management Route */}
            <Route
                path="/admin-products"
                element={useMemo(() => (
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminProductList /></MainLayout>
                    </ProtectedRoute>
                ), [isAuthenticated, role])}
            />
            <Route path="/products" element={<MainLayout><ProductsList /></MainLayout>} />

            <Route path="/orders" element={useMemo(() => (
                <ProtectedRoute allowedRoles={['buyer', 'vendor', 'admin']}>
                    <MainLayout><MyOrders /></MainLayout>
                </ProtectedRoute>
            ), [isAuthenticated, role])} />

            <Route path="/cart" element={useMemo(() => (
                <ProtectedRoute allowedRoles={['buyer']}>
                    <MainLayout><Cart /></MainLayout>
                </ProtectedRoute>
            ), [isAuthenticated, role])} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRouter;