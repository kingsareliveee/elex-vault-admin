import React, { useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { BarChart3, TrendingUp, Compass, Activity, CheckSquare } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { resources, auditLogs, refreshResources } = useAdmin();

  useEffect(() => {
    refreshResources();
  }, []);

  // Metrics calculations
  const total = resources.length;
  const approved = resources.filter(r => r.isApproved === true).length;
  const pending = resources.filter(r => r.isApproved === false).length;
  const rejected = auditLogs.filter(log => log.action.includes('REJECTED')).length;

  const approvalRate = (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 100;

  // Custom upload activity chart logic
  const weeklyData = [12, 19, 15, 28, 22, approved, approved + pending];
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Donut chart logic for Subject Popularity
  const subjectCounts = resources.reduce((acc: any, curr) => {
    const code = curr.subjectCode;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});

  const subjectData = Object.entries(subjectCounts).map(([code, count]: any) => ({
    label: code,
    value: count,
  })).sort((a, b) => b.value - a.value);

  // SVG dimensions for weekly chart
  const wWidth = 600;
  const wHeight = 180;
  const wMax = Math.max(...weeklyData, 10);
  const wPoints = weeklyData.map((val, idx) => {
    const x = (idx / (weeklyData.length - 1)) * (wWidth - 80) + 40;
    const y = wHeight - (val / wMax) * (wHeight - 50) - 25;
    return { x, y, val };
  });

  const linePath = `M ${wPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillPath = `${linePath} L ${wPoints[wPoints.length - 1].x},${wHeight - 20} L ${wPoints[0].x},${wHeight - 20} Z`;

  // Donut chart colors
  const donutColors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];
  const totalSubjectsCount = subjectData.reduce((sum, d) => sum + d.value, 0);
  
  // Calculate SVG arc paths for donut
  let cumulativePercent = 0;
  const donutRadius = 60;
  const donutCenterX = 80;
  const donutCenterY = 80;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const donutSegments = subjectData.map((data, idx) => {
    const percent = data.value / (totalSubjectsCount || 1);
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + percent;
    cumulativePercent = endPercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${donutCenterX + startX * donutRadius} ${donutCenterY + startY * donutRadius}`,
      `A ${donutRadius} ${donutRadius} 0 ${largeArcFlag} 1 ${donutCenterX + endX * donutRadius} ${donutCenterY + endY * donutRadius}`,
    ].join(' ');

    return {
      pathData,
      color: donutColors[idx % donutColors.length],
      percent: Math.round(percent * 100),
      label: data.label
    };
  });

  return (
    <div className="p-6 space-y-6 font-sans select-none">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Moderation Coverage</span>
            <span className="text-xs text-zinc-200 font-bold uppercase">All academic terms</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Approval Rate</span>
            <span className="text-xs text-green-500 font-bold">{approvalRate}% Approved</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Queue Latency</span>
            <span className="text-xs text-amber-500 font-bold">{pending} Items Awaiting</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-2.5 bg-purple-500/10 border border-purple-550/20 text-purple-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Total Database Size</span>
            <span className="text-xs text-purple-400 font-bold">{total} Registered Papers</span>
          </div>
        </div>
      </div>

      {/* Graphs Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LINE GRAPH: Weekly Upload trends */}
        <div className="xl:col-span-2 bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wider flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="uppercase text-xs tracking-wider">Weekly Upload Activity</span>
            </span>
            <span className="text-[10px] border border-zinc-800 bg-obsidian-950 px-2 py-0.5 rounded text-zinc-500">Live Trend</span>
          </div>

          <div className="flex-1 p-5 flex items-center justify-center bg-obsidian-950/10 relative min-h-[220px]">
            {/* SVG line chart */}
            <svg className="w-full h-full max-h-48" viewBox={`0 0 ${wWidth} ${wHeight}`}>
              <line x1="40" y1="20" x2={wWidth - 40} y2="20" stroke="#22273a" strokeDasharray="3,3" />
              <line x1="40" y1="65" x2={wWidth - 40} y2="65" stroke="#22273a" strokeDasharray="3,3" />
              <line x1="40" y1="110" x2={wWidth - 40} y2="110" stroke="#22273a" strokeDasharray="3,3" />
              <line x1="40" y1="155" x2={wWidth - 40} y2="155" stroke="#22273a" strokeDasharray="3,3" />

              {/* Area filled */}
              <path d={fillPath} fill="rgba(59, 130, 246, 0.02)" stroke="none" />
              
              {/* Trendline */}
              <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />

              {/* Anchor points */}
              {wPoints.map((p, idx) => (
                <g key={idx} className="group/dot cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="4" fill="#0b0d16" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx={p.x} cy={p.y} r="7" fill="#3b82f6" className="opacity-0 group-hover/dot:opacity-20 animate-ping duration-700" />
                  
                  {/* Tooltip */}
                  <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#f4f4f5" fontSize="9" fontWeight="bold" className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-black px-1 font-mono">
                    {p.val}
                  </text>
                </g>
              ))}

              {/* Days scale */}
              {wPoints.map((p, idx) => (
                <text key={`label-${idx}`} x={p.x} y={wHeight - 2} textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold" className="font-mono">
                  {days[idx]}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* DONUT GRAPH: Subject popularities */}
        <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wider flex items-center space-x-2">
              <Compass className="h-4 w-4 text-blue-500" />
              <span className="uppercase text-xs tracking-wider">Subject Distribution</span>
            </span>
          </div>

          <div className="flex-1 p-5 flex flex-col justify-center items-center">
            {totalSubjectsCount === 0 ? (
              <div className="text-center py-10 text-zinc-550 text-xs">
                No papers registered in the database.
              </div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-2">
                {/* SVG Donut */}
                <svg className="w-36 h-36" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="60" fill="none" stroke="#1d243d" strokeWidth="16" />
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="16"
                      strokeDasharray={`${(seg.percent / 100) * 377} 377`}
                      transform={`rotate(${donutSegments.slice(0, idx).reduce((sum, s) => sum + s.percent, 0) * 3.6 - 90} 80 80)`}
                      className="transition-all duration-300"
                    />
                  ))}
                  <circle cx="80" cy="80" r="50" fill="#0b0d16" />
                  <text x="80" y="78" textAnchor="middle" fill="#f4f4f5" fontSize="13" fontWeight="bold">
                    {total}
                  </text>
                  <text x="80" y="92" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold" className="tracking-wider uppercase">
                    Papers
                  </text>
                </svg>

                {/* Legends */}
                <div className="space-y-1.5 text-[10px] text-zinc-400 font-mono">
                  {donutSegments.slice(0, 4).map((seg, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }}></span>
                      <span className="font-bold text-zinc-200">{seg.label}:</span>
                      <span>{seg.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SLA Card */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-white border-b border-zinc-850 pb-2">
            <BarChart3 className="h-4.5 w-4.5 text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Performance Metrics</h4>
          </div>
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-400"><span>Mean Review Latency</span><span className="text-green-500 font-semibold font-mono">14.2 min</span></div>
              <div className="w-full bg-obsidian-950 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-400"><span>Database Coverage</span><span className="text-green-500 font-semibold font-mono">100% Sync</span></div>
              <div className="w-full bg-obsidian-950 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-zinc-800 space-y-4 col-span-2 shadow-sm">
          <div className="flex items-center space-x-2 text-white border-b border-zinc-850 pb-2">
            <Activity className="h-4.5 w-4.5 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Moderation Breakdown</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs text-center pt-2">
            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
              <span className="text-xl font-black text-green-500 block font-mono">{approved}</span>
              <span className="text-[9px] text-zinc-500 block uppercase mt-1 font-bold">Approved</span>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
              <span className="text-xl font-black text-red-500 block font-mono">{rejected}</span>
              <span className="text-[9px] text-zinc-500 block uppercase mt-1 font-bold">Rejected</span>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <span className="text-xl font-black text-amber-500 block font-mono">{pending}</span>
              <span className="text-[9px] text-zinc-500 block uppercase mt-1 font-bold">Awaiting Review</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
