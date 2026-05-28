import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../supabaseClient';
import { Eye, Check, X, Trash2, Search, SlidersHorizontal, AlertCircle, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

const formatSafeDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  } catch (err) {
    return 'N/A';
  }
};

export const PendingQueue: React.FC = () => {
  const { approveResource, rejectResource, deleteResource, setSelectedResourceId, setActivePage, refreshResources, resources } = useAdmin();

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
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;
  
  // Rejection states
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    id: string | null;
    action: 'approve' | 'delete' | 'replace' | null;
    duplicateId?: string;
    title: string;
    message: string;
  }>({ isOpen: false, id: null, action: null, title: '', message: '' });

  // Helper for suspicious names
  const isSuspiciousName = (name: string) => {
    if (!name) return true;
    const lower = name.toLowerCase().trim();
    const suspiciousExact = ['xyz', 'abc', 'test', 'anonymous', 'admin', 'qwerty', 'user', 'unknown'];
    if (suspiciousExact.includes(lower)) return true;
    if (/^\d+$/.test(lower) || lower.length <= 2) return true;
    return false;
  };

  const checkDuplicate = (res: any) => {
    const duplicates = resources.filter(r => 
      r.status === 'approved' &&
      r.subjectCode === res.subjectCode &&
      r.resourceType === res.resourceType &&
      r.examYear === res.examYear
    );
    return duplicates.length > 0 ? duplicates[0] : null;
  };

  const fetchPendingResources = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      let query = supabase
        .from("elex_papers")
        .select("*", { count: 'exact' })
        .or('moderation_status.eq.pending,and(moderation_status.is.null,is_approved.eq.false)');

      if (filterCourse !== 'ALL') {
        const val = filterCourse === 'BSc Electronics' ? 'bsc' : 'imtech';
        query = query.eq('course', val);
      }
      if (filterSem !== 'ALL') {
        query = query.eq('semester', `sem_${filterSem}`);
      }
      if (filterType !== 'ALL') {
        const typeMap: Record<string, string> = {
          'MST 1': 'mst_1',
          'MST 2': 'mst_2',
          'MST 3': 'mst_3',
          'EndSem': 'endsem',
          'Syllabus': 'syllabus',
          'Assignment': 'assignment'
        };
        query = query.eq('resource_type', typeMap[filterType] || filterType);
      }
      if (searchQuery.trim() !== '') {
        query = query.or(`subject_code.ilike.%${searchQuery}%,subject_name.ilike.%${searchQuery}%,contributor_name.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      console.log("DIRECT PENDING QUERY:", data);
      console.log("DIRECT PENDING ERROR:", error);

      if (error) throw error;

      if (data) {
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
          isApproved: row.is_approved,
          uploadDate: row.created_at || new Date().toISOString(),
          storagePath: row.storage_path
        }));

        setPendingResources(mapped);
        setTotalItems(count || 0);
      }
    } catch (err: any) {
      console.error("Error fetching pending resources directly:", err);
      setLocalError(err.message || "Failed to load pending resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCourse, filterSem, filterType, searchQuery]);

  useEffect(() => {
    fetchPendingResources();
  }, [currentPage, filterCourse, filterSem, filterType, searchQuery]);

  useEffect(() => {
    console.log("pendingResources STATE UPDATE:", pendingResources);
  }, [pendingResources]);

  // Available options
  const courses = ['ALL', 'BSc Electronics', 'Integrated MTech Electronics'];
  const semesters = ['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const resourceTypes = ['ALL', 'MST 1', 'MST 2', 'MST 3', 'EndSem', 'Syllabus', 'Assignment'];

  // Already filtered and paginated server-side
  const filteredList = pendingResources;

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

  const handleApproveClick = (res: any) => {
    const duplicate = checkDuplicate(res);
    if (duplicate) {
      setConfirmAction({
        isOpen: true,
        id: res.id,
        action: 'replace',
        duplicateId: duplicate.id,
        title: 'Duplicate Detected',
        message: `An approved paper already exists for ${res.subjectCode} (${res.resourceType} ${res.examYear}). Do you want to replace it or approve it alongside?`
      });
    } else {
      setConfirmAction({
        isOpen: true,
        id: res.id,
        action: 'approve',
        title: 'Confirm Approval',
        message: 'Are you sure you want to approve this paper and publish it to the ELEX Vault?'
      });
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

  const handleDeleteClick = (id: string) => {
    setConfirmAction({
      isOpen: true,
      id: String(id),
      action: 'delete',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently delete this paper from the database and storage? This action cannot be undone.'
    });
  };

  const handleConfirmAction = async (forceApproveDuplicate = false) => {
    const { action, id, duplicateId } = confirmAction;
    if (!id || !action) return;

    try {
      if (action === 'approve' || forceApproveDuplicate) {
        await approveResource(String(id));
      } else if (action === 'delete') {
        await deleteResource(String(id));
      } else if (action === 'replace') {
        if (duplicateId) {
          await deleteResource(String(duplicateId)); // Delete old
        }
        await approveResource(String(id)); // Approve new
      }
      
      setConfirmAction({ isOpen: false, id: null, action: null, title: '', message: '' });
      await fetchPendingResources();
      if (refreshResources) {
        await refreshResources();
      }
    } catch (error) {
      console.error('Action failed:', error);
      setLocalError('Failed to execute action.');
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans select-none">
      {/* Search & Filter Header */}
      <div className="glass-panel p-4 rounded-xl border border-zinc-800 space-y-4">
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
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                <div className="absolute h-full w-full rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
              </div>
              <div>
                <p className="text-zinc-300 font-bold uppercase tracking-wide">Review Queue Clear</p>
                <p className="text-zinc-500 text-[11px] mt-1">Awaiting new submissions</p>
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
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-200 flex items-center space-x-1.5">
                          <span>{res.contributorName || 'Anonymous'}</span>
                          {isSuspiciousName(res.contributorName) && (
                            <span title="Suspicious Contributor Name" className="flex shrink-0">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {formatSafeDate(res.uploadDate)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-200">{res.subjectCode || 'N/A'}</div>
                        <div className="text-[10px] text-zinc-450 mt-0.5 truncate max-w-[200px]" title={res.subjectName}>{res.subjectName || 'Unknown Subject'}</div>
                        {checkDuplicate(res) && (
                          <div className="mt-1.5 inline-flex items-center text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold tracking-wide uppercase">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            Duplicate Exists
                          </div>
                        )}
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
                            onClick={() => handleApproveClick(res)}
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
                            onClick={() => handleDeleteClick(res.id)}
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

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-zinc-200 text-xs">{res.subjectCode || 'N/A'} - {res.subjectName || 'Unknown Subject'}</h4>
                      
                      {checkDuplicate(res) && (
                        <div className="inline-flex items-center text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold tracking-wide uppercase">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Duplicate Exists
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center text-[11px] text-zinc-400">
                          Contributor: <span className="text-zinc-300 font-semibold ml-1">{res.contributorName || 'Anonymous'}</span>
                          {isSuspiciousName(res.contributorName) && (
                            <span title="Suspicious Contributor Name" className="inline-flex ml-1.5 shrink-0">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {formatSafeDate(res.uploadDate)}
                        </div>
                      </div>
                      
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
                        onClick={() => handleApproveClick(res)}
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
                        onClick={() => handleDeleteClick(res.id)}
                        className="p-1.5 bg-obsidian-950 border border-zinc-850 hover:bg-red-550/10 hover:border-red-550/30 text-zinc-500 rounded-lg transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalItems > ITEMS_PER_PAGE && (
                <div className="px-5 py-4 border-t border-zinc-800 bg-obsidian-950/40 flex items-center justify-between text-xs text-zinc-400 select-none">
                  <div>
                    Showing <span className="font-bold text-zinc-200">{Math.min(totalItems, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{' '}
                    <span className="font-bold text-zinc-200">{Math.min(totalItems, currentPage * ITEMS_PER_PAGE)}</span> of{' '}
                    <span className="font-bold text-zinc-200">{totalItems}</span> resources
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-obsidian-950 hover:bg-zinc-850 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-zinc-500 font-mono">
                      Page {currentPage} of {Math.ceil(totalItems / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(totalItems / ITEMS_PER_PAGE)}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-obsidian-950 hover:bg-zinc-850 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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

      {/* ACTION CONFIRMATION MODAL */}
      {confirmAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-obsidian-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-zinc-200 border-b border-zinc-850 pb-3 mb-4">
              {confirmAction.action === 'delete' ? (
                <Trash2 className="h-5 w-5 text-red-500" />
              ) : confirmAction.action === 'replace' ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <Check className="h-5 w-5 text-green-500" />
              )}
              <h3 className="text-sm font-bold uppercase tracking-wider">{confirmAction.title}</h3>
            </div>
            
            <p className="text-xs text-zinc-350 mb-6 leading-relaxed">
              {confirmAction.message}
            </p>

            <div className="flex justify-end gap-2.5 text-xs font-semibold">
              <button
                onClick={() => setConfirmAction({ isOpen: false, id: null, action: null, title: '', message: '' })}
                className="px-4 py-2 rounded-lg border border-zinc-800 bg-obsidian-950 text-zinc-450 hover:text-zinc-200 transition cursor-pointer"
              >
                Cancel
              </button>
              
              {confirmAction.action === 'replace' ? (
                <>
                  <button
                    onClick={() => handleConfirmAction(true)}
                    className="px-4 py-2 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                  >
                    Approve Anyway
                  </button>
                  <button
                    onClick={() => handleConfirmAction()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                  >
                    Replace Existing
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConfirmAction()}
                  className={`px-4 py-2 rounded-lg text-white transition cursor-pointer ${
                    confirmAction.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Confirm {confirmAction.action === 'delete' ? 'Deletion' : 'Approval'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
