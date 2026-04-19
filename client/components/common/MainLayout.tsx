
import React, { useState, ReactNode, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchUserSubscriptions } from '../../redux/slices/notificationSlice';
import { useAuth } from '../../hooks/useAuth';
import { fetchCart, syncCart } from '../../redux/slices/cartSlice';
import { apiBasePath } from '../../utils/runtimeConfig';
import { getAccessToken } from '../../utils/authToken';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, activeRole } = useAuth(); // Destructure activeRole
  const { items: cartItems, isDirty } = useSelector((state: RootState) => state.cart);
  const cartSnapshotRef = useRef(cartItems);
  const didHydrateCartRef = useRef(false);

  useEffect(() => {
    cartSnapshotRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserSubscriptions());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || user?.activeRole === 'admin') {
      didHydrateCartRef.current = false;
      return;
    }

    // If local cart changed (including removing all items), push local state to backend first.
    if (isDirty) {
      didHydrateCartRef.current = true;
      dispatch(syncCart(cartItems))
        .unwrap()
        .then(() => {
          dispatch(fetchCart());
        })
        .catch(() => {
          didHydrateCartRef.current = false;
        });
      return;
    }

    if (didHydrateCartRef.current) {
      return;
    }

    didHydrateCartRef.current = true;

    dispatch(fetchCart()).unwrap().catch(() => {
      didHydrateCartRef.current = false;
    });
  }, [dispatch, isAuthenticated, user?.activeRole, isDirty, cartItems]); // Added user.activeRole dependency

  useEffect(() => {
    if (!isAuthenticated || user?.activeRole === 'admin') { // Also check activeRole here for consistency
      return;
    }

    const flushCart = () => {
      if (!isDirty) return;

      const token = getAccessToken();
      if (!token) return;

      const payload = {
        items: cartSnapshotRef.current.map(item => ({
          product: item._id,
          quantity: item.quantity,
        })),
      };

      fetch(`${apiBasePath}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushCart();
      }
    };

    window.addEventListener('beforeunload', flushCart);
    window.addEventListener('blur', flushCart);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushCart);
      window.removeEventListener('blur', flushCart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, isDirty, user?.activeRole]); // Added user.activeRole dependency

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
