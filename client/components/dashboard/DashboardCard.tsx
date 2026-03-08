import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass }) => {
  const isDarkBg = colorClass?.includes('bg-black') || colorClass?.includes('bg-brand-red');

  return (
    <div className={`rounded-lg p-6 flex items-center border border-gray-100 shadow-sm transition-shadow ${colorClass || 'bg-white'}`}>
      <div className={`p-3 rounded-lg ${isDarkBg ? 'bg-white/20' : 'bg-brand-red'} text-white mr-4 shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${isDarkBg ? 'text-white/70' : 'text-gray-400'}`}>{title}</p>
        <p className={`text-2xl font-black tracking-tighter ${isDarkBg ? 'text-white' : 'text-gray-100'}`}>{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
