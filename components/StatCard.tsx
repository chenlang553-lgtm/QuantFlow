import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, subLabel, trend, icon }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {icon && <div className="text-slate-500 bg-slate-700/50 p-2 rounded-lg">{icon}</div>}
      </div>
      <div className="flex items-baseline space-x-2">
        <h2 className="text-2xl font-bold text-white">{value}</h2>
      </div>
      {(subValue || subLabel) && (
        <div className="mt-2 flex items-center text-sm">
          {trend === 'up' && <span className="text-green-400 mr-2">↑ {subValue}</span>}
          {trend === 'down' && <span className="text-red-400 mr-2">↓ {subValue}</span>}
          {trend === 'neutral' && <span className="text-slate-400 mr-2">{subValue}</span>}
          <span className="text-slate-500">{subLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;