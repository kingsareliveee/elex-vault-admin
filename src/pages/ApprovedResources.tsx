import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Eye, X, Trash2, Search, SlidersHorizontal, AlertCircle, Database, Loader2 } from 'lucide-react';

export const ApprovedResources: React.FC = () => {
  const { resources, rejectResource, deleteResource, setSelectedResourceId, setActivePage, refreshResources, isLoading } = useAdmin();

  // Filters
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterSem, setFilterSem] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Rejection modal state
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    refreshResources();
  }, []);

  const approvedResources = resources.filter(r => r.isApproved === true);

  // Available options
  const courses = ['ALL', 'BSc Electronics', 'Integrated MTech Electronics'];
  const semesters = ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const resourceTypes = ['ALL', 'MST 1', 'MST 2', 'MST 3', 'EndSem', 'Syllabus', 'Assignment'];

  // Apply filters
  const filteredList = approvedResources.filter(res => {
    const matchesCourse = filterCourse === 'ALL' || res.course === filterCourse;
    const matchesSem = filterSem === 'ALL' || res.semester.toString() === filterSem;
    const matchesType = filterType === 'ALL' || res.resourceType === filterType;
    const matchesQuery = 
      res.contributorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesCourse && matchesSem && matchesType && matchesQuery;
  });

  const handlePreview = (id: string) => {
    setSelectedResourceId(id);
    setActivePage('viewer');
  };

  const handleRevokeClick = (id: string) => {
    setRevokeId(id);
    setRevokeReason('');
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeId || !revokeReason.trim()) return;
    // Revoking approval deletes resource from production indexing
    await rejectResource(revokeId, revokeReason);
    setRevokeId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Confirm permanent deletion and storage purge of approved resource ${id}?`)) {
      await deleteResource(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans select-none">
      {/* Filters */}
      <div className="glass-panel p-4 sm:p-5 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between text-white border-b border-zinc-850 pb-3 mb-1">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-green-500" />
            <span className="font-bold text-xs tracking-wider uppercase">Search Filters</span>
          </div>
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden px-3 py-1.5 bg-obsidian-950 border border-zinc-800 text-zinc-350 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Subject, contributor, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-655 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Collapsible dropdown filter options */}
          <div className={`${showFiltersMobile ? 'flex' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-4 flex-col`}>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Course</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-350 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {courses.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Courses' : c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Semester</label>
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-350 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {semesters.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Semesters' : `Semester ${s}`}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Resource Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-350 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {resourceTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Database Grid */}
      <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Database className="h-4 w-4 text-green-500" />
            <span>Active Database Records ({filteredList.length})</span>
          </span>
          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 border border-green-500/20 rounded font-semibold">Synced</span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-zinc-550">Fetching database records...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-zinc-650" />
              <p>No approved resources found matching search filters.</p>
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
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-500/10 text-green-400 border border-green-500/25">
                          {res.resourceType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 font-mono">
                        <span>{res.course}</span>
                        <span className="text-[9px] text-zinc-500 block font-bold font-mono">SEMESTER {res.semester}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Preview */}
                          <button
                            onClick={() => handlePreview(res.id)}
                            className="p-2 bg-obsidian-950 hover:bg-zinc-800/60 border border-zinc-850 hover:border-blue-500/30 text-zinc-450 hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                            title="Open Document Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Revoke */}
                          <button
                            onClick={() => handleRevokeClick(res.id)}
                            className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent text-red-500 rounded-lg transition-all cursor-pointer"
                            title="Revoke and Purge Paper"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
  
                          {/* Purge */}
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
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-green-500/10 text-green-455 border border-green-500/25 uppercase mr-2">
                          {res.resourceType}
                        </span>
                        <span className="font-mono text-zinc-550 text-[10px] font-bold select-all">#{res.id.substring(0, 8)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{res.uploadDate.split(' ')[0]}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-200 text-xs">{res.subjectCode} - {res.subjectName}</h4>
                      <p className="text-[11px] text-zinc-400">Contributor: <span className="text-zinc-300 font-semibold">{res.contributorName}</span></p>
                      <p className="text-[11px] text-zinc-400">Course & Sem: <span className="text-zinc-350">{res.course} (Sem {res.semester})</span></p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                      {/* Preview */}
                      <button
                        onClick={() => handlePreview(res.id)}
                        className="px-2.5 py-1.5 bg-obsidian-950 hover:bg-zinc-800/60 border border-zinc-850 hover:border-blue-550/30 text-zinc-405 hover:text-blue-500 rounded-lg flex items-center gap-1 transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </button>

                      {/* Revoke */}
                      <button
                        onClick={() => handleRevokeClick(res.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent text-red-500 rounded-lg flex items-center gap-1 transition font-semibold"
                      >
                        <X className="h-3 w-3" />
                        <span>Revoke</span>
                      </button>

                      {/* Purge */}
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

      {/* REVOCATION REASON MODAL OVERLAY */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-obsidian-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-red-500 border-b border-zinc-850 pb-3 mb-4">
              <X className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Revoke Approval: {revokeId}</h3>
            </div>
            
            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1.5 uppercase">Reason for Revocation</label>
                <textarea
                  required
                  placeholder="Specify the reason for revoking approval (this deletes the file permanently)..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-obsidian-950 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-red-500/30 h-28 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 text-xs font-semibold pt-2">
                <button
                  type="button"
                  onClick={() => setRevokeId(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 bg-obsidian-950 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                >
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
