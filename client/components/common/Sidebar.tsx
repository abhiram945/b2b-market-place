import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { X as XIcon } from '../icons';
import { getNavLinks } from '../../utils/navigation';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { role } = useAuth();
  const location = useLocation();
  const links = getNavLinks(role);
    
  const getDashboardLink = () => {
    if (role === 'buyer') return '/buyer-dashboard';
    if (role === 'vendor') return '/vendor-dashboard';
    if (role === 'admin') return '/admin-dashboard';
    return '/';
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
           <Link to={getDashboardLink()} className="text-xl font-black text-gray-900 tracking-tight italic" onClick={() => setIsOpen(false)}>
            <span className="text-brand-red mr-1">B2B</span>MARKET
          </Link>
          <button className="text-gray-400 hover:text-brand-red transition-all" onClick={() => setIsOpen(false)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {links.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-lg shadow-red-600/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {link.text}
              </Link>
            );
          })}
        </nav>
        
        {/* Version Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Version 2.0.4 Release</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
