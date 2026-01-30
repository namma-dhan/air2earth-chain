import React from 'react';

interface FeatureCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  description?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  description,
}) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            {icon}
          </div>
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm font-bold ${
              trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-2">
          {title}
        </h3>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            {value}
          </span>
          <span className="text-lg font-bold text-slate-500">{unit}</span>
        </div>
        
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default FeatureCard;
