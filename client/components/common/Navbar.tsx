
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../redux/slices/userSlice';
import { Menu as MenuIcon, ShoppingCart as ShoppingCartIcon, LogOut as LogOutIcon } from '../icons';
import { RootState, AppDispatch } from '../../redux/store';
import { getNavLinks } from '../../utils/navigation';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = getNavLinks(user?.role as any || null);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="text-gray-500 focus:outline-none lg:hidden mr-4">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <Link to="/" className="text-2xl font-black text-gray-900 tracking-tight">
                    <span className="text-brand-red">B2B</span>MARKET
                </Link>
                
                <nav className="hidden lg:ml-10 lg:flex items-center space-x-6">
                    {navLinks.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`text-sm font-bold uppercase tracking-wide transition-colors ${
                        location.pathname === link.to
                            ? 'text-brand-red'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {link.text}
                    </Link>
                    ))}
                </nav>
            </div>
            
            <div className="flex items-center space-x-4">
                {isAuthenticated && user?.role === 'buyer' && (
                <Link to="/cart" className="relative p-2 text-gray-500 hover:text-brand-red transition-colors">
                    <ShoppingCartIcon className="h-6 w-6" />
                    {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {cartItems.length}
                    </span>
                    )}
                </Link>
                )}

                {isAuthenticated ? (
                    <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-bold text-gray-900 leading-none">{user?.fullName}</p>
                            <p className="text-[10px] font-bold text-brand-red uppercase tracking-wider">{user?.role}</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-brand-red transition-colors" title="Logout">
                            <LogOutIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-brand-red">LOGIN</Link>
                        <Link to="/register" className="btn-red px-5 py-2 rounded text-sm">SIGN UP</Link>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
