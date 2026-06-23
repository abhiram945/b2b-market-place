import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className={`rounded-lg p-6 flex items-center border border-gray-100 dark:border-zinc-800 shadow-sm transition-all ${colorClass || 'bg-white dark:bg-zinc-900'}`}>
      <div className={`p-3 rounded-lg bg-brand-red text-white mr-4 shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest text-gray-300 dark:text-zinc-100`}>{title}</p>
        <p className={`text-2xl font-black tracking-tighter text-gray-100 dark:text-zinc-100`}>{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
