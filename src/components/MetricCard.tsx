import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  colorClass: 'green' | 'red' | 'blue' | 'amber';
  sparklineData: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  colorClass,
  sparklineData,
}) => {
  const getColorClasses = () => {
    switch (colorClass) {
      case 'green':
        return {
          hoverBorder: 'hover:border-green-500/30',
          text: 'text-green-500',
          border: 'border-green-500/10',
          bg: 'bg-green-500/5',
          stroke: '#10b981',
          fill: 'rgba(16, 185, 129, 0.03)',
        };
      case 'red':
        return {
          hoverBorder: 'hover:border-red-500/30',
          text: 'text-red-500',
          border: 'border-red-500/10',
          bg: 'bg-red-500/5',
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.03)',
        };
      case 'amber':
        return {
          hoverBorder: 'hover:border-amber-500/30',
          text: 'text-amber-500',
          border: 'border-amber-500/10',
          bg: 'bg-amber-500/5',
          stroke: '#f59e0b',
          fill: 'rgba(245, 158, 11, 0.03)',
        };
      case 'blue':
      default:
        return {
          hoverBorder: 'hover:border-blue-500/30',
          text: 'text-blue-500',
          border: 'border-blue-500/10',
          bg: 'bg-blue-500/5',
          stroke: '#3b82f6',
          fill: 'rgba(59, 130, 246, 0.03)',
        };
    }
  };

  const colors = getColorClasses();

  // Generate SVG path for the sparkline
  const width = 120;
  const height = 36;
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = sparklineData.map((val, index) => {
    const x = (index / (sparklineData.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  const path = `M ${points}`;
  const fillPath = `${path} L ${width},${height} L 0,${height} Z`;

  return (
    <div className={`glass-panel p-5 rounded-lg border border-zinc-800 transition-all duration-300 relative group overflow-hidden ${colors.hoverBorder}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{title}</span>
          <h3 className="text-2xl font-bold text-white mt-1 select-all font-sans">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg border ${colors.border} ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4">
        {/* Metric Sparkline */}
        <div className="w-28 h-9 overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            <path
              d={fillPath}
              fill={colors.fill}
              stroke="none"
            />
            <path
              d={path}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Change Indicators */}
        <div className="text-right text-[10px]">
          <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change}
          </span>
          <p className="text-[8px] text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">This Week</p>
        </div>
      </div>
    </div>
  );
};
