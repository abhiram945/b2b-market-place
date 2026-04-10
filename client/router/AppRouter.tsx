
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
import AdminDashboard from '../pages/dashboard/AdminDashboard'; // Import AdminDashboard
import AdminProductList from '../pages/products/AdminProductList'; // Import AdminProductList

const AppRouter = () => {
    useAuth();

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
                element={(
                    <ProtectedRoute allowedRoles={['buyer']}>
                        <MainLayout><BuyerDashboard /></MainLayout>
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/vendor-dashboard"
                element={(
                    <ProtectedRoute allowedRoles={['vendor']}>
                        <MainLayout><VendorDashboard /></MainLayout>
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/admin-dashboard"
                element={(
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminDashboard /></MainLayout>
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/admin-products"
                element={(
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminProductList /></MainLayout>
                    </ProtectedRoute>
                )}
            />

            <Route path="/orders" element={(
                <ProtectedRoute allowedRoles={['buyer', 'vendor', 'admin']}>
                    <MainLayout><MyOrders /></MainLayout>
                </ProtectedRoute>
            )} />

            <Route path="/cart" element={(
                <ProtectedRoute allowedRoles={['buyer']}>
                    <MainLayout><Cart /></MainLayout>
                </ProtectedRoute>
            )} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRouter;
