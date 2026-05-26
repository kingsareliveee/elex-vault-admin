import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../supabaseClient';
import { Eye, Check, X, Trash2, Search, SlidersHorizontal, AlertCircle, Loader2 } from 'lucide-react';

export const PendingQueue: React.FC = () => {
  const { approveResource, rejectResource, deleteResource, setSelectedResourceId, setActivePage, refreshResources } = useAdmin();

  // Local state for pending resources with isolated state
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Filter States
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterSem, setFilterSem] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  // Rejection states
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingResources = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const { data, error } = await supabase
        .from("elex_papers")
        .select("*")
        .eq("is_approved", false);

      console.log("DIRECT PENDING QUERY:", data);
      console.log("DIRECT PENDING ERROR:", error);

      if (!error && data) {
        const mapped = data.map(row => ({
          id: row.id,
          subjectName: row.subject_name,
          contributorName: row.contributor_name,
          semester: row.semester,
          examYear: row.exam_year,
          fileUrl: row.file_url,
          course: row.course,
          subjectCode: row.subject_code,
          resourceType: row.resource_type,
          isApproved: row.is_approved
        }));

        console.log("MAPPED PENDING RESOURCES:", mapped);
        setPendingResources(mapped);
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Error fetching pending resources directly:", err);
      setLocalError(err.message || "Failed to load pending resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResources();
  }, []);

  useEffect(() => {
    console.log("pendingResources STATE UPDATE:", pendingResources);
  }, [pendingResources]);

  // Available options
  const courses = ['ALL', 'BSc Electronics', 'Integrated MTech Electronics'];
  const semesters = ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const resourceTypes = ['ALL', 'MST 1', 'MST 2', 'MST 3', 'EndSem', 'Syllabus', 'Assignment'];

  // Apply filters
  const filteredList = pendingResources.filter(res => {
    const matchesCourse = filterCourse === 'ALL' || 
      res.course === filterCourse ||
      (filterCourse === 'BSc Electronics' && res.course === 'bsc') ||
      (filterCourse === 'Integrated MTech Electronics' && res.course === 'imtech');

    const matchesSem = filterSem === 'ALL' || 
      (res.semester && res.semester.toString() === filterSem);

    const matchesType = filterType === 'ALL' || 
      res.resourceType === filterType ||
      (filterType === 'MST 1' && res.resourceType === 'mst_1') ||
      (filterType === 'MST 2' && res.resourceType === 'mst_2') ||
      (filterType === 'MST 3' && res.resourceType === 'mst_3') ||
      (filterType === 'EndSem' && res.resourceType === 'endsem') ||
      (filterType === 'Syllabus' && res.resourceType === 'syllabus') ||
      (filterType === 'Assignment' && res.resourceType === 'assignment');

    const matchesQuery = 
      (res.contributorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.subjectCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesCourse && matchesSem && matchesType && matchesQuery;
  });

  const getResourceTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      mst_1: 'MST 1',
      mst_2: 'MST 2',
      mst_3: 'MST 3',
      endsem: 'EndSem',
      syllabus: 'Syllabus',
      assignment: 'Assignment'
    };
    return typeMap[type] || type || 'EndSem';
  };

  const handlePreview = (id: string) => {
    setSelectedResourceId(String(id));
    setActivePage('viewer');
  };

  const handleApprove = async (id: string) => {
    if (confirm('Approve this paper and publish to the ELEX Vault?')) {
      await approveResource(String(id));
      await fetchPendingResources();
      if (refreshResources) {
        await refreshResources();
      }
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectId(String(id));
    setRejectReason('');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectReason.trim()) return;
    await rejectResource(rejectId, rejectReason);
    setRejectId(null);
    await fetchPendingResources();
    if (refreshResources) {
      await refreshResources();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Confirm permanent deletion and storage purge of upload ${id}?`)) {
      await deleteResource(String(id));
      await fetchPendingResources();
      if (refreshResources) {
        await refreshResources();
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans select-none">
      {/* Search & Filter Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between text-white border-b border-zinc-850 pb-3 mb-1">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-xs tracking-wider uppercase">Filter Queue</span>
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
          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Subject, contributor, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Collapsible filter dropdowns */}
          <div className={`${showFiltersMobile ? 'flex' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 gap-4 flex-col`}>
            {/* Course filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Course</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {courses.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Courses' : c}</option>)}
              </select>
            </div>

            {/* Semester filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Semester</label>
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {semesters.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Semesters' : `Semester ${s}`}</option>)}
              </select>
            </div>

            {/* Resource Type filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Resource Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-750 cursor-pointer appearance-none"
              >
                {resourceTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Pending Uploads ({filteredList.length})</span>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 border border-amber-500/20 rounded font-semibold">Review Pending</span>
        </div>

        <div className="overflow-x-auto">
          {localError && (
            <div className="p-4 mb-4 mx-5 mt-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-zinc-550">Fetching queue records...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-zinc-650" />
              <p>No papers awaiting moderation in this queue category.</p>
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
                    <th className="px-5 py-3.5">Course/Sem</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Exam Year</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {filteredList.map((res) => (
                    <tr key={res.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-zinc-400 font-mono">{String(res.id)}</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-200">{res.contributorName || 'Anonymous'}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-200">{res.subjectCode || 'N/A'}</div>
                        <div className="text-[10px] text-zinc-450 mt-0.5 truncate max-w-[200px]" title={res.subjectName}>{res.subjectName || 'Unknown Subject'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-zinc-200">
                          {res.course === 'bsc' ? 'BSc Electronics' : res.course === 'imtech' ? 'Integrated MTech Electronics' : res.course || 'General'}
                        </span>
                        <span className="text-zinc-500 font-bold block text-[9px] mt-0.5 font-mono">SEMESTER {res.semester || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
                          {getResourceTypeLabel(res.resourceType)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 font-mono">{res.examYear || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Preview */}
                          <button
                            onClick={() => handlePreview(res.id)}
                            className="p-2 bg-obsidian-950 hover:bg-zinc-800/60 border border-zinc-850 hover:border-blue-555/30 text-zinc-450 hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                            title="Open Document Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Approve */}
                          <button
                            onClick={() => handleApprove(res.id)}
                            className="p-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black hover:border-transparent text-green-500 rounded-lg transition-all cursor-pointer"
                            title="Approve Resource"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Reject */}
                          <button
                            onClick={() => handleRejectClick(res.id)}
                            className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent text-red-500 rounded-lg transition-all cursor-pointer"
                            title="Reject and Purge"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Purge */}
                          <button
                            onClick={() => handleDelete(res.id)}
                            className="p-2 bg-obsidian-950 border border-zinc-850 hover:bg-red-500/10 hover:border-red-550/30 hover:text-red-500 text-zinc-500 rounded-lg transition-all cursor-pointer"
                            title="Direct Purge"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile stacked cards (visible on mobile/tablet) */}
              <div className="md:hidden divide-y divide-zinc-850">
                {filteredList.map((res) => (
                  <div key={res.id} className="p-4 space-y-3 bg-obsidian-950/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 uppercase mr-2">
                          {getResourceTypeLabel(res.resourceType)}
                        </span>
                        <span className="font-mono text-zinc-550 text-[10px] font-bold select-all">#{String(res.id).substring(0, 8)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{res.examYear || 'N/A'}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-zinc-200 text-xs">{res.subjectCode || 'N/A'} - {res.subjectName || 'Unknown Subject'}</h4>
                      <p className="text-[11px] text-zinc-400">Contributor: <span className="text-zinc-300 font-semibold">{res.contributorName || 'Anonymous'}</span></p>
                      <p className="text-[11px] text-zinc-400">Course & Sem: <span className="text-zinc-350">
                        {res.course === 'bsc' ? 'BSc Electronics' : res.course === 'imtech' ? 'Integrated MTech Electronics' : res.course || 'General'} (Sem {res.semester || 'N/A'})
                      </span></p>
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

                      {/* Approve */}
                      <button
                        onClick={() => handleApprove(res.id)}
                        className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black hover:border-transparent text-green-500 rounded-lg flex items-center gap-1 transition font-semibold"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve</span>
                      </button>

                      {/* Reject */}
                      <button
                        onClick={() => handleRejectClick(res.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent text-red-500 rounded-lg flex items-center gap-1 transition font-semibold"
                      >
                        <X className="h-3 w-3" />
                        <span>Reject</span>
                      </button>

                      {/* Purge */}
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 bg-obsidian-950 border border-zinc-850 hover:bg-red-550/10 hover:border-red-550/30 text-zinc-500 rounded-lg transition"
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

      {/* REJECTION REASON MODAL OVERLAY */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-obsidian-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-red-500 border-b border-zinc-850 pb-3 mb-4">
              <X className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Reject Upload: {rejectId}</h3>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1.5 uppercase">Rejection Reason</label>
                <textarea
                  required
                  placeholder="Specify the reason for rejection (this deletes the file permanently)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-obsidian-950 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500/30 h-28 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 text-xs font-semibold pt-2">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-800 bg-obsidian-950 text-zinc-450 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
