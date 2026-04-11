import React from 'react';
import { Building } from '../components/icons';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-6 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-600 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="inline-flex items-center justify-center p-6 bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-3xl mb-12 shadow-2xl animate-in fade-in zoom-in duration-700">
            <Building className="w-16 h-16 text-red-600 animate-pulse" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            System <span className="text-red-600">Off-Line</span>
        </h1>

        <div className="h-1 w-24 bg-red-600 mx-auto mb-8 rounded-full animate-in zoom-in duration-1000 delay-300"></div>

        <p className="text-zinc-400 text-lg md:text-xl font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            MARKET MEA CORE IS CURRENTLY UNDERGOING <span className="text-white">CRITICAL INFRASTRUCTURE OPTIMIZATION</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Protocol</span>
                <span className="text-white font-bold text-xs">MAINTENANCE</span>
            </div>
            <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Estimated Sync</span>
                <span className="text-white font-bold text-xs">RE-ESTABLISHING...</span>
            </div>
            <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Network Status</span>
                <span className="text-red-600 font-bold text-xs animate-pulse">RESTRICTED ACCESS</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000 delay-700">
            <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                Monitoring Secondary Uplink
            </div>
            
            <button 
                onClick={() => window.location.href="/"}
                className="px-10 py-4 bg-white hover:bg-red-600 text-zinc-900 hover:text-white font-black text-xs uppercase tracking-[0.2em] rounded-none transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] cursor-pointer"
            >
                Refresh page
            </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
