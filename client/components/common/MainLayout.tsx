import React, { useState, ReactNode, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchUserSubscriptions } from '../../redux/slices/notificationSlice';
import { useAuth } from '../../hooks/useAuth';
import { fetchCart, syncCart } from '../../redux/slices/cartSlice';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useAuth();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserSubscriptions());
      // Only fetch cart if the user is not an admin
      if (user?.role !== 'admin') {
        dispatch(fetchCart());
      }
    }
  }, [dispatch, isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && !isInitialMount.current) {
      const timer = setTimeout(() => {
        dispatch(syncCart(cartItems));
      }, 1000); // Debounce sync
      return () => clearTimeout(timer);
    }
    if (isAuthenticated && isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [dispatch, isAuthenticated, cartItems]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 pt-16">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
