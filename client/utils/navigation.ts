import { Home, Package, Truck, ShoppingCart } from '../components/icons';

interface NavLink {
  to: string;
  icon: React.FC<{className?: string}>;
  text: string;
}

export const getNavLinks = (role: 'admin' | 'vendor' | 'buyer' | null): NavLink[] => {
  const buyerLinks: NavLink[] = [
    { to: '/buyer-dashboard', icon: Home, text: 'Dashboard' },
    { to: '/products', icon: Package, text: 'Products' },
    { to: '/orders', icon: Truck, text: 'My Orders' },
    { to: '/cart', icon: ShoppingCart, text: 'My Cart'},
  ];

  const vendorLinks: NavLink[] = [
    { to: '/vendor-dashboard', icon: Home, text: 'Dashboard' },
    { to: '/products', icon: Package, text: 'My Products' },
  ];

  const adminLinks: NavLink[] = [
    { to: '/admin-dashboard', icon: Home, text: 'Dashboard' },
    { to: '/admin-products', icon: Package, text: 'Manage Products' },
    { to: '/orders', icon: Truck, text: 'Manage Orders' },
  ];

  if (role === 'buyer') return buyerLinks;
  if (role === 'vendor') return vendorLinks;
  if (role === 'admin') return adminLinks;
  
  // Guest links
  return [
    { to: '/', icon: Home, text: 'Home' },
    { to: '/products', icon: Package, text: 'Products' },
    { to: '/cart', icon: ShoppingCart, text: 'Cart' },
  ];
};
