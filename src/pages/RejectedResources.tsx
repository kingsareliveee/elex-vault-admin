import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, SlidersHorizontal, AlertCircle, FileText } from 'lucide-react';

export const RejectedResources: React.FC = () => {
  const { auditLogs } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch rejected logs
  const rejectionLogs = auditLogs.filter(log => 
    log.action.includes('REJECTED') || log.action.includes('DELETED')
  );

  // Apply search query
  const filteredLogs = rejectionLogs.filter(log => 
    log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 font-sans select-none">
      {/* Description Info Banner */}
      <div className="p-4 bg-zinc-800/20 border border-zinc-800 rounded-xl space-y-2 text-xs leading-relaxed text-zinc-400">
        <p className="font-semibold text-zinc-200">ℹ️ Rejection Policy</p>
        <p>
          To maintain database hygiene, rejected and deleted academic papers are permanently purged from the Supabase database and storage buckets. Below is the historical audit trail of these actions recorded on the dashboard console.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-5 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-white border-b border-zinc-850 pb-3 mb-1">
          <SlidersHorizontal className="h-4 w-4 text-red-500" />
          <span className="font-bold text-xs tracking-wider uppercase font-sans">Search Rejection Logs</span>
        </div>

        <div className="max-w-md">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Search logs</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search subject code, contributor name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Database Grid */}
      <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <FileText className="h-4 w-4 text-red-500" />
            <span>Historical Rejection Logs ({filteredLogs.length})</span>
          </span>
          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 border border-red-500/20 rounded font-semibold">Immutable Trail</span>
        </div>

        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-zinc-650" />
              <p>No rejection history found in the audit logs.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-obsidian-950/60 border-b border-zinc-850 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5">Log ID</th>
                  <th className="px-5 py-3.5">Action Type</th>
                  <th className="px-5 py-3.5">Resource Details</th>
                  <th className="px-5 py-3.5">Moderator</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-zinc-400 font-semibold">{log.id}</td>
                    <td className="px-5 py-3.5 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.action.includes('DELETED') 
                          ? 'bg-zinc-800 text-zinc-400' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 leading-relaxed text-zinc-200 select-all font-mono text-[11px]">
                      {log.target}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-400">{log.adminName}</td>
                    <td className="px-5 py-3.5 text-zinc-500 font-mono">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
