
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { logout, switchActiveRole, requestNewRole } from '../../redux/slices/userSlice';
import { Menu as MenuIcon, ShoppingCart as ShoppingCartIcon, LogOut as LogOutIcon, User as UserIcon, PlusCircle, X, ChevronDown, Sun, Moon } from '../icons';
import { RootState, AppDispatch } from '../../redux/store';
import { getNavLinks } from '../../utils/navigation';
import api from '../../api';
import logoDark from "../../assets/navbar-logo-dark.png";
import logoLight from "../../assets/navbar-logo-light.png";
import { ROLES } from '../../utils/constants.js';
import { useAlert } from '../../contexts/AlertContext';


interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, activeRole, roles, roleRequest } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { items: cartItems } = useSelector((state: RootState) => state.cart);
    const { showAlert } = useAlert(); // Use showAlert from context

    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const userMenuRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            dispatch(logout());
            navigate('/login');
        }
    };

    const navLinks = getNavLinks(user?.activeRole as any || null);

    // Conditional rendering logic for role switching and requests
    const hasMultipleRoles = user?.roles && user.roles.length > 1;
    // Check if the user has the role already before requesting it
    const canRequestVendor = !user?.roles.includes(ROLES.VENDOR);
    const canRequestBuyer = !user?.roles.includes(ROLES.BUYER);
    const hasPendingRequest = user?.roleRequest?.status === 'pending';

    const handleSwitchRole = async (newRole: 'buyer' | 'vendor' | 'admin') => {
        try {
            await dispatch(switchActiveRole(newRole as any)).unwrap();
            navigate('/dashboard');
        } catch (err: any) {
            showAlert({ variant: 'error', title: 'role switch failed', message: err || 'Could not switch role.' });
        } finally {
            setIsUserMenuOpen(false);
        }
    };

    const handleRoleRequest = async (roleToRequest: 'buyer' | 'vendor') => {
        try {
            await dispatch(requestNewRole(roleToRequest)).unwrap();
            showAlert({ variant: 'success', title: 'Role request submitted', message: `Your request to access the ${roleToRequest} portal has been submitted.` });
        } catch (err: any) {
            showAlert({ variant: 'error', title: 'Request failed', message: err || 'Could not submit role request.' });
        }
        setIsUserMenuOpen(false);
    };

    return (
        <header className="fixed inset-x-0 top-0 bg-white dark:bg-[#000000] border-b border-gray-200 dark:border-zinc-800 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <button onClick={onMenuClick} className="text-gray-500 dark:text-zinc-400 focus:outline-none lg:hidden mr-4">
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <Link to="/" className="flex items-center text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                        <div className='w-64 h-16 overflow-hidden'>
                            <img src={logoLight} alt='market mea' className='w-full h-full object-cover logo-adaptive block dark:hidden' />
                            <img src={logoDark} alt='market mea' className='w-full h-full object-cover logo-adaptive hidden dark:block' />
                        </div>
                        </Link>

                        <nav className="hidden lg:ml-10 lg:flex items-center space-x-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-sm font-bold uppercase tracking-wide ${location.pathname === link.to
                                            ? 'text-brand-red'
                                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
                                        }`}
                                >
                                    {link.text}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-zinc-400 hover:text-brand-red dark:hover:text-brand-red cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>

                        {isAuthenticated && activeRole === ROLES.BUYER && (
                            <Link to="/cart" className="relative p-2 text-gray-500 dark:text-zinc-400 hover:text-brand-red transition-colors">
                                <ShoppingCartIcon className="h-6 w-6" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 pl-6 border-l border-gray-200 dark:border-zinc-800">
                                <div className="relative" ref={userMenuRef}>
                                    <button onClick={() => setIsUserMenuOpen((prev) => !prev)} className="flex items-center focus:outline-none cursor-pointer">
                                        <UserIcon className="h-6 w-6 text-gray-500 dark:text-zinc-400 mr-2" />
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-none capitalize">{user?.fullName}</p>
                                            <p className="text-[10px] font-bold text-brand-red uppercase tracking-wider">{activeRole}</p>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-500 ml-1" />
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white dark:bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-zinc-800 focus:outline-none border dark:border-zinc-800" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                                            <div className="py-1 px-2" role="none">
                                                {/* Role Switching */}
                                                {hasMultipleRoles && (
                                                    <div className="block px-4 py-2 text-sm text-gray-700 dark:text-zinc-300">
                                                        <p className="text-xs font-black text-brand-red uppercase tracking-widest mb-1">Switch Role</p>
                                                        {roles?.map(role => (
                                                            <button
                                                                key={role}
                                                                onClick={() => handleSwitchRole(role as any)}
                                                                disabled={activeRole === role}
                                                                className="w-full text-left py-1 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:text-brand-red disabled:font-bold rounded-md cursor-pointer"
                                                            >
                                                                {role.charAt(0).toUpperCase() + role.slice(1)} {activeRole === role ? '(Active)' : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Role Request Options */}
                                                {!hasPendingRequest && (
                                                    <>
                                                        {canRequestVendor && (
                                                            <button onClick={() => handleRoleRequest(ROLES.VENDOR)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                                Request Vendor Access
                                                            </button>
                                                        )}
                                                        {canRequestBuyer && (
                                                            <button onClick={() => handleRoleRequest(ROLES.BUYER)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                                Request Buyer Access
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {hasPendingRequest && (
                                                    <p className="block px-4 py-2 text-sm text-yellow-600">Pending Request</p>
                                                )}

                                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md" role="menuitem">
                                                    <div className="flex items-center">
                                                        <LogOutIcon className="h-4 w-4 mr-2" />
                                                        Logout
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-sm font-bold text-gray-500 dark:text-zinc-400 hover:text-brand-red transition-colors">LOGIN</Link>
                                <Link to="/register" className="btn-red px-5 py-2 rounded text-sm tracking-widest">SIGN UP</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
