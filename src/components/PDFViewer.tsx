import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import type { Resource } from '../context/AdminContext';
import { supabase } from '../supabaseClient';
import { 
  Check, 
  X, 
  Trash2, 
  FileText, 
  User, 
  Layers,
  MessageSquare,
  Send,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PDFViewerProps {
  resource: Resource;
  onBack?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ resource, onBack }) => {
  const { approveResource, rejectResource, deleteResource, setActivePage, currentAdmin } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');
  const [commentText, setCommentText] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('elex_paper_comments')
        .select('*')
        .eq('paper_id', resource.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mapped = data.map(c => ({
          id: c.id.toString(),
          author: c.admin_email ? c.admin_email.split('@')[0] : 'System',
          text: c.comment,
          date: c.created_at 
            ? new Date(c.created_at).toISOString().replace('T', ' ').substring(0, 19)
            : new Date().toISOString().replace('T', ' ').substring(0, 19)
        }));
        setCommentsList(mapped);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resource.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const email = currentAdmin?.email || 'system@davv.edu';
    try {
      const { error } = await supabase
        .from('elex_paper_comments')
        .insert([{
          paper_id: resource.id,
          comment: commentText,
          admin_email: email
        }]);

      if (error) throw error;
      setCommentText('');
      await fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleApprove = async () => {
    if (confirm('Approve this resource and publish it to ELEX Vault?')) {
      await approveResource(resource.id);
      if (onBack) onBack();
      else setActivePage('pending');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    await rejectResource(resource.id, rejectReason);
    setShowRejectModal(false);
    if (onBack) onBack();
    else setActivePage('pending');
  };

  const handleDelete = async () => {
    if (confirm(`Confirm permanent deletion of ${resource.id}? This action cannot be undone.`)) {
      await deleteResource(resource.id);
      if (onBack) onBack();
      else setActivePage('pending');
    }
  };

  const handleOpenNewTab = () => {
    if (resource.previewUrl) {
      window.open(resource.previewUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-[calc(100vh-64px)] overflow-y-auto xl:overflow-hidden p-4 sm:p-6 select-none font-sans">
      
      {/* LEFT AREA: Actual PDF Viewport using iframe */}
      <div className="flex-1 flex flex-col bg-obsidian-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm min-h-[500px] xl:min-h-0">
        {/* Document toolbar */}
        <div className="h-12 border-b border-zinc-800 bg-obsidian-900/60 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-750 transition cursor-pointer"
              >
                &larr; Back
              </button>
            )}
            <span className="text-zinc-300 font-bold tracking-wider font-mono">{resource.id}</span>
            <span className="text-zinc-650">|</span>
            <span className="text-zinc-400 truncate max-w-[200px]" title={resource.subjectName}>{resource.subjectName}</span>
          </div>

          {/* External controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleOpenNewTab} 
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-obsidian-950 text-zinc-450 hover:text-blue-500 cursor-pointer flex items-center gap-1 text-[11px] px-2.5 transition"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in New Tab</span>
            </button>
            <a 
              href={resource.previewUrl} 
              download
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-obsidian-950 text-zinc-450 hover:text-blue-500 cursor-pointer flex items-center gap-1 text-[11px] px-2.5 transition"
              title="Download PDF file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Real PDF frame */}
        <div className="flex-1 bg-obsidian-900 p-4 relative flex justify-center items-center">
          {resource.previewUrl ? (
            <iframe 
              src={`${resource.previewUrl}#toolbar=0`} 
              className="w-full h-full border-none rounded-lg bg-[#18181b]" 
              title="Document Preview File"
            />
          ) : (
            <div className="text-center space-y-2">
              <AlertCircle className="h-10 w-10 text-zinc-650 mx-auto" />
              <p className="text-sm text-zinc-400">PDF URL not found. Unable to render preview.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Administrative Action Panel */}
      <div className="w-full xl:w-96 flex flex-col bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm shrink-0">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-obsidian-950/40 text-[11px] font-semibold">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3.5 text-center border-r border-zinc-850 transition cursor-pointer ${
              activeTab === 'info' ? 'text-white bg-obsidian-900 border-b-2 border-b-blue-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            METADATA
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3.5 text-center transition cursor-pointer ${
              activeTab === 'comments' ? 'text-white bg-obsidian-900 border-b-2 border-b-blue-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            COMMENTS ({commentsList.length})
          </button>
        </div>

        {/* Tab Viewports */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Contributor Card */}
              <div className="p-4 bg-obsidian-950/50 border border-zinc-850 rounded-lg">
                <div className="flex items-center space-x-3 mb-3 border-b border-zinc-850 pb-2">
                  <User className="h-4.5 w-4.5 text-blue-500" />
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Contributor Profile</h5>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300 font-bold">{resource.contributorName}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Authority</span><span className="text-green-500 font-bold uppercase text-[10px]">Verified Student</span></div>
                </div>
              </div>

              {/* Resource Metadata Card */}
              <div className="p-4 bg-obsidian-950/50 border border-zinc-850 rounded-lg">
                <div className="flex items-center space-x-3 mb-3 border-b border-zinc-850 pb-2">
                  <FileText className="h-4.5 w-4.5 text-blue-500" />
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Paper Details</h5>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Subject</span><span className="text-zinc-300 font-bold truncate max-w-[170px]" title={resource.subjectName}>{resource.subjectName}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Code</span><span className="text-zinc-300 font-bold font-mono">{resource.subjectCode}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Semester</span><span className="text-zinc-300 font-bold">Semester {resource.semester}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Course</span><span className="text-zinc-300 font-bold truncate max-w-[170px]">{resource.course}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Resource</span><span className="text-blue-500 font-bold uppercase">{resource.resourceType}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Exam Year</span><span className="text-zinc-300 font-bold font-mono">{resource.examYear || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-550">Status</span><span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
                    resource.status === 'approved' ? 'text-green-500 bg-green-500/10 border border-green-500/20' :
                    resource.status === 'rejected' ? 'text-red-500 bg-red-500/10 border border-red-500/20' :
                    'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                  }`}>{resource.status}</span></div>
                </div>
              </div>

              {/* Integrity */}
              <div className="p-4 bg-obsidian-950/50 border border-zinc-850 rounded-lg text-xs space-y-2">
                <div className="flex items-center space-x-2 text-zinc-450 border-b border-zinc-850 pb-1.5 font-semibold">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Metadata Fingerprint</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono text-zinc-500">
                  <div className="flex justify-between"><span>Mock size</span><span className="text-zinc-400">{resource.fileSize}</span></div>
                  <div className="flex justify-between"><span>DB Identifier</span><span className="text-zinc-400 select-all">{resource.id}</span></div>
                  <div className="flex justify-between"><span className="truncate">File Hash</span><span className="text-zinc-450 text-[10px] select-all">{resource.hash}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-full space-y-4">
              {/* Comment logs */}
              <div className="flex-1 space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 mx-auto" />
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-30 text-zinc-400" />
                    <span>No moderator notes recorded.</span>
                  </div>
                ) : (
                  commentsList.map((comment) => (
                    <div key={comment.id} className="p-2.5 bg-obsidian-950 border border-zinc-850 rounded-lg text-xs">
                      <div className="flex justify-between text-zinc-550 mb-1 border-b border-zinc-900 pb-1 font-semibold">
                        <span className="text-blue-500">{comment.author}</span>
                        <span>{comment.date.split(' ')[1]}</span>
                      </div>
                      <p className="text-zinc-350 leading-relaxed text-[11px]">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleAddComment} className="border-t border-zinc-850 pt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a moderator note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-obsidian-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  className="p-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-zinc-400 hover:text-blue-500 rounded-lg transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* MODERATION ACTION CONTROL PANEL */}
        <div className="p-4 bg-obsidian-950 border-t border-zinc-850 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* APPROVE ACTION */}
            <button
              onClick={handleApprove}
              disabled={resource.isApproved}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-bold text-xs bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-black hover:border-transparent transition-all duration-200 cursor-pointer disabled:opacity-25 disabled:pointer-events-none"
            >
              <Check className="h-4 w-4" />
              <span>Approve Paper</span>
            </button>

            {/* REJECT ACTION */}
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-bold text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent transition-all duration-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Reject & Purge</span>
            </button>
          </div>

          {/* PERMANENT PURGE */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold text-zinc-500 border border-zinc-850 hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Permanent Purge</span>
          </button>
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-obsidian-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-red-500 border-b border-zinc-850 pb-3 mb-4">
              <X className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Reject & Purge Resource</h3>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1.5 font-bold uppercase tracking-wide">Specify Rejection Reason</label>
                <textarea
                  required
                  placeholder="State the reason for rejection (this deletes the database record and storage file permanently)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-obsidian-950 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-red-500/30 h-28 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 text-xs font-semibold pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-850 bg-obsidian-950 text-zinc-440 hover:text-white transition cursor-pointer"
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
