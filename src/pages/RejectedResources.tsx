import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, SlidersHorizontal, AlertCircle, FileText, Trash2, Eye } from 'lucide-react';

const formatSafeDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  } catch (err) {
    return 'N/A';
  }
};

export const RejectedResources: React.FC = () => {
  const { resources, refreshResources, setSelectedResourceId, setActivePage, deleteResource } = useAdmin();

  useEffect(() => {
    refreshResources();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch rejected resources directly from DB mapping
  const rejectedResources = resources.filter(r => r.status === 'rejected');

  // Apply search query
  const filteredList = rejectedResources.filter(res => 
    res.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.contributorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreview = (id: string) => {
    setSelectedResourceId(id);
    setActivePage('viewer');
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Confirm permanent deletion and storage purge of rejected resource ${id}?`)) {
      await deleteResource(id);
      await refreshResources();
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans select-none">
      {/* Description Info Banner */}
      <div className="p-4 bg-zinc-800/20 border border-zinc-800 rounded-xl space-y-2 text-xs leading-relaxed text-zinc-400">
        <p className="font-semibold text-zinc-200">ℹ️ Rejection Archive Policy</p>
        <p>
          Rejected academic papers are safely archived and retained in the database with their metadata intact for analytics and contributor tracking. You can review or permanently purge them below.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-white border-b border-zinc-850 pb-3 mb-1">
          <SlidersHorizontal className="h-4 w-4 text-red-500" />
          <span className="font-bold text-xs tracking-wider uppercase font-sans">Search Rejection Archive</span>
        </div>

        <div className="max-w-md">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Search records</label>
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
            <span>Archived Rejected Records ({filteredList.length})</span>
          </span>
          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 border border-red-500/20 rounded font-semibold">Archived</span>
        </div>

        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-zinc-800/20 border border-zinc-800/40">
                <FileText className="h-4 w-4 text-zinc-500/50" />
                <div className="absolute h-full w-full rounded-full border border-zinc-500/20 animate-pulse" style={{ animationDuration: '3s' }}></div>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase tracking-wide">No Recent Rejection Events Logged</p>
                <p className="text-zinc-600 text-[11px] mt-1">System monitoring active</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table (hidden on mobile) */}
              <table className="hidden md:table w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-obsidian-950/60 border-b border-zinc-850 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Contributor</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Course/Sem</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {filteredList.map((res) => (
                    <tr key={res.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-400 font-mono">{res.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-200">{res.contributorName}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-200">{res.subjectCode}</div>
                        <div className="text-[10px] text-zinc-450 mt-0.5 truncate max-w-[200px]" title={res.subjectName}>{res.subjectName}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-400 border border-red-500/25">
                          {res.resourceType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 font-mono">
                        <span>{res.course}</span>
                        <span className="text-[9px] text-zinc-500 block font-bold font-mono">SEMESTER {res.semester}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handlePreview(res.id)}
                            className="p-2 bg-obsidian-950 hover:bg-zinc-800/60 border border-zinc-850 hover:border-blue-500/30 text-zinc-450 hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                            title="Open Document Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(res.id)}
                            className="p-2 bg-obsidian-950 border border-zinc-850 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-505 text-zinc-500 rounded-lg transition-all cursor-pointer"
                            title="Purge Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-zinc-850">
                {filteredList.map((res) => (
                  <div key={res.id} className="p-4 space-y-3 bg-obsidian-950/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-500/10 text-red-455 border border-red-500/25 uppercase mr-2">
                          {res.resourceType}
                        </span>
                        <span className="font-mono text-zinc-550 text-[10px] font-bold select-all">#{res.id.substring(0, 8)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{formatSafeDate(res.uploadDate)}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-200 text-xs">{res.subjectCode} - {res.subjectName}</h4>
                      <p className="text-[11px] text-zinc-400">Contributor: <span className="text-zinc-300 font-semibold">{res.contributorName}</span></p>
                      <p className="text-[11px] text-zinc-400">Course & Sem: <span className="text-zinc-350">{res.course} (Sem {res.semester})</span></p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handlePreview(res.id)}
                        className="px-2.5 py-1.5 bg-obsidian-950 hover:bg-zinc-800/60 border border-zinc-850 hover:border-blue-550/30 text-zinc-405 hover:text-blue-500 rounded-lg flex items-center gap-1 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 bg-obsidian-950 border border-zinc-850 hover:bg-red-550/10 hover:border-red-550/30 text-zinc-550 rounded-lg transition"
                        title="Purge Permanently"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
