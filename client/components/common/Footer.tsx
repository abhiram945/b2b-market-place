
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-white border-t border-zinc-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-24">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="text-2xl font-black tracking-tighter italic uppercase">
               <span className="text-red-600 mr-1">B2B</span>MARKET
            </Link>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
              The premier industrial-grade distribution platform. <br/> Connecting global enterprise assets since 2024.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase italic">Protocols</h3>
                <ul className="mt-6 space-y-4">
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">For Buyers</a></li>
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">For Vendors</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase italic">Support</h3>
                <ul className="mt-6 space-y-4">
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Pricing Hub</a></li>
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Documentation</a></li>
                  <li><Link to="/contact-us" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Direct Uplink</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase italic">Core</h3>
                <ul className="mt-6 space-y-4">
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">About System</a></li>
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Neural Blog</a></li>
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Careers</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-[10px] font-black text-red-600 tracking-[0.3em] uppercase italic">Legal</h3>
                <ul className="mt-6 space-y-4">
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">&copy; 2024 B2B MARKET VECTOR. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;