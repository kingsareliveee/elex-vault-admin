import React, { useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { MetricCard } from '../components/MetricCard';
import { normalizeContributorName } from '../utils/formatters';
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  AlertTriangle, 
  Users,
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { resources, auditLogs, setActivePage, setSelectedResourceId, refreshResources, isLoading } = useAdmin();

  // Load resources if not loaded yet
  useEffect(() => {
    refreshResources();
  }, []);

  // Calculations
  // Calculations
  const totalUploads = resources.length;
  const pendingCount = resources.filter(r => r.status === 'pending').length;
  const approvedCount = resources.filter(r => r.status === 'approved').length;
  const rejectedCount = resources.filter(r => r.status === 'rejected').length;
  
  const uniqueContributors = Array.from(new Set(resources.map(r => normalizeContributorName(r.contributorName)))).length;

  const handleViewResource = (id: string) => {
    setSelectedResourceId(id);
    setActivePage('viewer');
  };

  // Sparkline data generators
  const getSparklineData = (baseVal: number) => {
    return [baseVal, baseVal + 2, baseVal - 1, baseVal + 4, baseVal + 2, baseVal + 7, baseVal + 5, baseVal + 8];
  };

  // Contributor stats
  const contributorStats = resources.reduce((acc: any, curr) => {
    const name = normalizeContributorName(curr.contributorName);
    if (!acc[name]) {
      acc[name] = { name, total: 0, approved: 0, pending: 0 };
    }
    acc[name].total += 1;
    if (curr.status === 'approved') acc[name].approved += 1;
    if (curr.status === 'pending') acc[name].pending += 1;
    return acc;
  }, {});

  const rankedContributors = Object.values(contributorStats)
    .sort((a: any, b: any) => b.approved - a.approved)
    .slice(0, 5);

  const recentPending = resources.filter(r => r.status === 'pending').slice(0, 3);

  if (isLoading && resources.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-zinc-400">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 font-sans select-none">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Uploads"
          value={totalUploads}
          change="12%"
          isPositive={true}
          icon={FileText}
          colorClass="blue"
          sparklineData={getSparklineData(totalUploads || 12)}
        />
        <MetricCard
          title="Pending Reviews"
          value={pendingCount}
          change="8%"
          isPositive={false}
          icon={Clock}
          colorClass="amber"
          sparklineData={getSparklineData(pendingCount || 4)}
        />
        <MetricCard
          title="Approved DB"
          value={approvedCount}
          change="15%"
          isPositive={true}
          icon={CheckSquare}
          colorClass="green"
          sparklineData={getSparklineData(approvedCount || 8)}
        />
        <MetricCard
          title="Rejected Archs"
          value={rejectedCount}
          change="4%"
          isPositive={false}
          icon={AlertTriangle}
          colorClass="red"
          sparklineData={getSparklineData(rejectedCount || 2)}
        />
        <MetricCard
          title="Contributors"
          value={uniqueContributors}
          change="18%"
          isPositive={true}
          icon={Users}
          colorClass="blue"
          sparklineData={getSparklineData(uniqueContributors || 5)}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* LEFT COLUMN: System Activity Log Stream */}
        <div className="xl:col-span-2 flex flex-col bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
            <span className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Moderation Activity Stream</span>
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Live Logs</span>
          </div>

          <div className="flex-1 p-4 text-xs space-y-4 max-h-[380px] overflow-y-auto bg-obsidian-950/10">
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="absolute h-full w-full rounded-full bg-blue-500/20 animate-ping"></div>
                </div>
                <div>
                  <p className="text-zinc-300 font-bold uppercase tracking-wide">System Monitoring Active</p>
                  <p className="text-zinc-500 text-[10px] mt-1">Awaiting new moderation events</p>
                </div>
                {/* Timeline Placeholders */}
                <div className="w-full max-w-sm mt-4 space-y-3 opacity-30 pointer-events-none">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-obsidian-950 border border-zinc-850 rounded-lg">
                      <div className="w-1 h-10 rounded-full bg-zinc-800"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-2 w-1/3 bg-zinc-800 rounded"></div>
                        <div className="h-1.5 w-2/3 bg-zinc-800 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 bg-obsidian-950 border border-zinc-850 rounded-lg relative group transition hover:border-zinc-800"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'danger' ? 'bg-red-500' :
                    log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>

                  <div className="flex justify-between items-start pl-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-zinc-500 font-semibold font-mono">[{log.id}]</span>
                      <span className={`font-bold uppercase text-[10px] ${
                        log.type === 'success' ? 'text-green-500' :
                        log.type === 'danger' ? 'text-red-500' :
                        log.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {log.action}
                      </span>
                    </div>
                    <span className="text-zinc-500 text-[10px]">{log.timestamp}</span>
                  </div>

                  <p className="text-zinc-350 pl-2 leading-relaxed text-[11px]">{log.target}</p>
                  <div className="flex justify-between items-center pl-2 mt-2 border-t border-zinc-850/50 pt-1.5 text-[9px] text-zinc-500 uppercase font-medium">
                    <span>Operator: {log.adminName}</span>
                    <span className="text-zinc-650 font-bold font-mono text-[8px]">SYNCHRONIZED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Contributors & Pending Queue */}
        <div className="space-y-4">
          
          {/* Active Contributors */}
          <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
              <span className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Top Academic Contributors</span>
              </span>
            </div>

            <div className="p-4 divide-y divide-zinc-850 text-xs">
              {rankedContributors.length === 0 ? (
                <div className="text-center py-6 text-zinc-500">
                  No active contributors.
                </div>
              ) : (
                rankedContributors.map((c: any, idx) => (
                  <div key={c.name} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-zinc-500 font-bold">#0{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-zinc-200 font-bold truncate">{c.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">Academic Contributor</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-500 font-bold text-[11px]">{c.approved} Approved</span>
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-semibold">{c.total} Uploads</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Pending Queue */}
          <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
              <span className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Pending Review Queue</span>
              </span>
              <button 
                onClick={() => setActivePage('pending')} 
                className="text-[10px] text-blue-500 hover:text-blue-400 hover:underline flex items-center space-x-1 font-bold uppercase cursor-pointer"
              >
                <span>Full Queue</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {recentPending.length === 0 ? (
                <div className="text-center py-6 flex flex-col items-center space-y-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <div>
                    <p className="text-zinc-300 font-semibold text-xs">Review queue clear</p>
                    <p className="text-zinc-500 text-[10px] mt-0.5">Awaiting new submissions</p>
                  </div>
                </div>
              ) : (
                recentPending.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => handleViewResource(res.id)}
                    className="p-3 bg-obsidian-950 border border-zinc-850 hover:border-amber-500/30 rounded-lg cursor-pointer transition flex justify-between items-center group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded font-bold uppercase">{res.resourceType}</span>
                        <span className="text-zinc-200 font-bold truncate text-[11px]">{res.subjectCode}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-[180px]">{res.subjectName}</p>
                    </div>
                    <span className="text-zinc-500 text-[11px] group-hover:text-blue-500 transition-colors">&rarr;</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
