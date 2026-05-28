import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export type ResourceType = 'MST 1' | 'MST 2' | 'MST 3' | 'EndSem' | 'Syllabus' | 'Assignment';
export type ResourceStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Resource {
  id: string;
  contributorName: string;
  contributorEmail: string;
  subjectName: string;
  subjectCode: string;
  semester: number;
  course: string;
  resourceType: ResourceType;
  uploadDate: string;
  status: ResourceStatus;
  isApproved: boolean;
  rejectionReason?: string;
  fileSize: string;
  examYear?: string;
  storagePath?: string;
  pagesCount: number;
  downloads: number;
  previewUrl: string;
  comments: Comment[];
  hash: string;
}

export interface Admin {
  name: string;
  email: string;
  role: 'Super Admin' | 'Moderator' | 'Security Analyst';
  avatar: string;
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'success' | 'danger' | 'info' | 'warning';
}

export type PageRoute = 'login' | 'signup' | 'forgot-password' | 'dashboard' | 'pending' | 'approved' | 'rejected' | 'viewer' | 'analytics' | 'settings';

interface AdminContextType {
  currentAdmin: Admin | null;
  resources: Resource[];
  auditLogs: AuditLog[];
  activePage: PageRoute;
  selectedResourceId: string | null;
  selectedResource: Resource | null;
  searchQuery: string;
  isLoading: boolean;
  authLoading: boolean;
  isMobileMenuOpen: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedResourceId: (id: string | null) => void;
  setActivePage: (page: PageRoute) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  approveResource: (id: string) => Promise<void>;
  rejectResource: (id: string, reason: string) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  addComment: (id: string, text: string) => Promise<void>;
  updateSettings: (profile: { name: string; email: string }, preferences: any) => void;
  settings: {
    maxUploadSize: number;
    allowedFormats: string[];
    autoVirusScan: boolean;
    requireMultiApproval: boolean;
    notifyOnUpload: boolean;
  };
  refreshResources: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Safe date formatting helper to prevent blank screen crashes on invalid timestamps
export const safeFormatDate = (dateStr?: string | null): string => {
  if (!dateStr) return new Date().toISOString().replace('T', ' ').substring(0, 19);
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch (err) {
    console.error('Invalid date string:', dateStr, err);
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }
};

// Extract bucket filename from Supabase storage URL
export const getFileNameFromUrl = (url: string): string => {
  if (!url) return '';
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1] || '';
  } catch (err) {
    console.error('Error parsing file URL:', err);
    return url.split('/').pop() || '';
  }
};

// Map DB Row to Resource Interface
export const mapDbRowToResource = (row: any): Resource => {
  const typeMap: Record<string, ResourceType> = {
    mst_1: 'MST 1',
    mst_2: 'MST 2',
    mst_3: 'MST 3',
    endsem: 'EndSem',
    syllabus: 'Syllabus',
    assignment: 'Assignment'
  };

  let semNumber = 1;
  if (typeof row.semester === 'string') {
    const match = row.semester.match(/\d+/);
    if (match) semNumber = parseInt(match[0]);
  } else if (typeof row.semester === 'number') {
    semNumber = row.semester;
  }

  const courseLabel = row.course === 'bsc' 
    ? 'BSc Electronics' 
    : row.course === 'imtech' 
      ? 'Integrated MTech Electronics' 
      : row.course;

  return {
    id: row.id.toString(),
    contributorName: row.contributor_name || 'Anonymous',
    contributorEmail: 'student@davv.edu',
    subjectName: row.subject_name || 'Unknown Subject',
    subjectCode: row.subject_code || 'N/A',
    semester: semNumber,
    course: courseLabel || 'General',
    resourceType: typeMap[row.resource_type] || row.resource_type || 'EndSem',
    uploadDate: safeFormatDate(row.created_at),
    isApproved: row.moderation_status === 'approved' || (row.moderation_status == null && (row.is_approved === true || row.is_approved === 'true')),
    status: row.moderation_status || ((row.is_approved === true || row.is_approved === 'true') ? 'approved' : 'pending'),
    fileSize: '2.4 MB',
    pagesCount: 6,
    downloads: 0,
    previewUrl: row.file_url || '',
    comments: [],
    hash: `SHA256:${row.id.toString().substring(0, 8)}`,
    examYear: row.exam_year ? row.exam_year.toString() : 'N/A',
    storagePath: row.storage_path || ''
  };
};

// Query admin_requests to check authorization status
const checkAdminAuthorization = async (email: string): Promise<{ isApproved: boolean; errorMsg?: string }> => {
  try {
    const { data, error } = await supabase
      .from('admin_requests')
      .select('status')
      .eq('email', email.trim().toLowerCase());

    if (error) {
      console.error('Error querying admin_requests:', error);
      return { isApproved: false, errorMsg: 'Authorization check failed. Please check connection.' };
    }

    if (!data || data.length === 0) {
      return { isApproved: false, errorMsg: 'No access request found for this email address.' };
    }

    const status = data[0].status;
    if (status !== 'approved') {
      return { isApproved: false, errorMsg: 'Your admin access request is still pending approval.' };
    }

    return { isApproved: true };
  } catch (err) {
    console.error('Authorization check exception:', err);
    return { isApproved: false, errorMsg: 'An error occurred during verification.' };
  }
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(() => {
    const saved = localStorage.getItem('elex_current_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activePage, setActivePage] = useState<PageRoute>('login');
  const [selectedResourceId, setSelectedResourceIdState] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState({
    maxUploadSize: 15,
    allowedFormats: ['PDF'],
    autoVirusScan: true,
    requireMultiApproval: false,
    notifyOnUpload: true,
  });

  const fetchCommentsForSelected = async (id: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('elex_paper_comments')
        .select('id, admin_email, comment, created_at')
        .eq('paper_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const mappedComments = (commentsData || []).map((c: any) => ({
        id: c.id.toString(),
        author: c.admin_email || 'System',
        text: c.comment || '',
        date: safeFormatDate(c.created_at)
      }));

      setSelectedResource(prev => {
        if (prev && prev.id === id) {
          return { ...prev, comments: mappedComments };
        }
        return prev;
      });
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const setSelectedResourceId = async (id: string | null) => {
    setSelectedResourceIdState(id);
    if (id === null) {
      setSelectedResource(null);
    } else {
      setSelectedResource(null);
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('elex_papers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          const mappedResource = mapDbRowToResource(data);
          setSelectedResource(mappedResource);
          
          // Now fetch comments for this paper
          const { data: commentsData, error: commentsError } = await supabase
            .from('elex_paper_comments')
            .select('id, admin_email, comment, created_at')
            .eq('paper_id', id)
            .order('created_at', { ascending: true });

          if (commentsError) throw commentsError;

          const mappedComments = (commentsData || []).map((c: any) => ({
            id: c.id.toString(),
            author: c.admin_email || 'System',
            text: c.comment || '',
            date: safeFormatDate(c.created_at)
          }));

          mappedResource.comments = mappedComments;
          setSelectedResource({ ...mappedResource });
        }
      } catch (err) {
        console.error('Error loading resource detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Fetch Resources from Supabase
  const refreshResources = async () => {
    setIsLoading(true);
    try {
      // Fetch all resources since we now use moderation_status and need rejected resources for analytics
      const { data, error } = await supabase
        .from('elex_papers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const combined = (data || []).map(mapDbRowToResource);
      setResources(combined);
      console.log("Fetched Resources:", combined);
      console.log(
        "Pending Resources:",
        combined.filter(r => r.isApproved === false)
      );
      await refreshAuditLogs();
    } catch (err) {
      console.error('Error fetching papers from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Monitor Supabase Authentication session state (Runs ONLY once during startup)
  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email;
          const authStatus = await checkAdminAuthorization(email);
          if (authStatus.isApproved) {
            const adminUser: Admin = {
              name: email.split('@')[0],
              email: email,
              role: 'Super Admin',
              avatar: email.substring(0, 2).toUpperCase(),
              lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
            };
            setCurrentAdmin(adminUser);
            localStorage.setItem('elex_current_admin', JSON.stringify(adminUser));
            setActivePage('dashboard');
            refreshResources();
          } else {
            await supabase.auth.signOut();
            setCurrentAdmin(null);
            localStorage.removeItem('elex_current_admin');
            setActivePage('login');
          }
        } else {
          setCurrentAdmin(null);
          localStorage.removeItem('elex_current_admin');
          setActivePage('login');
        }
      } catch (err) {
        console.error('Error verifying initial session:', err);
        setCurrentAdmin(null);
        setActivePage('login');
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // Listen only for signout changes, to prevent repeated auth verification logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentAdmin(null);
        localStorage.removeItem('elex_current_admin');
        setActivePage('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('elex_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped = (data || []).map(row => {
        let actionStr = row.action || '';
        let targetStr = `Resource ID: ${row.paper_id || 'N/A'}`;
        if (actionStr.includes(' - ')) {
          const parts = actionStr.split(' - ');
          actionStr = parts[0];
          targetStr = parts.slice(1).join(' - ');
        }
        
        return {
          id: row.id.toString(),
          adminName: row.admin_email ? row.admin_email.split('@')[0] : 'System',
          action: actionStr,
          target: targetStr,
          timestamp: row.created_at
            ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 19)
            : new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: (actionStr.includes('APPROVED') || actionStr.includes('AUTHENTICATED')) ? 'success' :
                (actionStr.includes('REJECTED') || actionStr.includes('DELETED') || actionStr.includes('TERMINATED')) ? 'danger' : 'info' as AuditLog['type']
        };
      });
      setAuditLogs(mapped);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const addLog = (_adminName: string, action: string, target: string, _type: AuditLog['type']) => {
    const email = currentAdmin?.email || 'system@davv.edu';
    let paperId: string | null = null;
    if (target && target.includes(':')) {
      const parsedId = target.split(':')[0].trim();
      if (parsedId.length >= 8) {
        paperId = parsedId;
      }
    }
    
    supabase
      .from('elex_audit_logs')
      .insert([{
        paper_id: paperId,
        admin_email: email,
        action: `${action} - ${target}`
      }])
      .then(({ error }) => {
        if (error) console.error('Error writing audit log to DB:', error);
        refreshAuditLogs();
      });
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error.message);
        setAuthLoading(false);
        return { success: false, error: error.message };
      }
      const user = data?.user;
      if (user && user.email) {
        const authStatus = await checkAdminAuthorization(user.email);
        if (!authStatus.isApproved) {
          await supabase.auth.signOut();
          setAuthLoading(false);
          return { success: false, error: authStatus.errorMsg };
        }
        
        const adminUser: Admin = {
          name: user.email.split('@')[0],
          email: user.email,
          role: 'Super Admin',
          avatar: user.email.substring(0, 2).toUpperCase(),
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        setCurrentAdmin(adminUser);
        localStorage.setItem('elex_current_admin', JSON.stringify(adminUser));
        addLog(adminUser.name, 'AUTHENTICATED SESSION', 'Console Secure Gate', 'info');
        setActivePage('dashboard');
        setAuthLoading(false);
        refreshResources();
        return { success: true };
      }
      setAuthLoading(false);
      return { success: false, error: 'Administrator credentials not found.' };
    } catch (err: any) {
      console.error('Login exception:', err);
      setAuthLoading(false);
      return { success: false, error: err.message || 'An error occurred during authentication.' };
    }
  };

  const logout = async () => {
    const adminName = currentAdmin?.name || 'Admin';
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      addLog(adminName, 'TERMINATED SESSION', 'Session closed by operator', 'info');
      setCurrentAdmin(null);
      localStorage.removeItem('elex_current_admin');
      setActivePage('login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const approveResource = async (id: string) => {
    const adminName = currentAdmin?.name || 'System';
    try {
      const { error } = await supabase
        .from('elex_papers')
        .update({ is_approved: true, moderation_status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      
      const targetRes = resources.find(r => r.id === id);
      addLog(adminName, 'APPROVED RESOURCE', `${id}: ${targetRes?.subjectName || 'Paper'} (${targetRes?.resourceType})`, 'success');
      await refreshResources();
    } catch (err) {
      console.error('Error approving resource:', err);
      alert('Failed to approve resource.');
    }
  };

  const rejectResource = async (id: string, reason: string) => {
    const adminName = currentAdmin?.name || 'System';
    try {
      const targetRes = resources.find(r => r.id === id);
      // Update in database instead of deleting to preserve rejection history
      const { error: rejectDbError } = await supabase
        .from('elex_papers')
        .update({ is_approved: false, moderation_status: 'rejected' })
        .eq('id', id);

      if (rejectDbError) throw rejectDbError;

      addLog(adminName, 'REJECTED RESOURCE', `${id}: ${targetRes?.subjectName || 'Paper'} - Reason: ${reason}`, 'danger');
      await refreshResources();
      if (selectedResourceId === id) {
        setSelectedResourceId(null);
      }
    } catch (err) {
      console.error('Error rejecting resource:', err);
      alert('Failed to reject resource.');
    }
  };

  const deleteResource = async (id: string) => {
    const adminName = currentAdmin?.name || 'System';
    try {
      const targetRes = resources.find(r => r.id === id);
      const storagePath = targetRes?.storagePath || '';
      
      if (storagePath) {
        const { error: deleteStorageError } = await supabase.storage
          .from('papers_pdf')
          .remove([storagePath]);
        if (deleteStorageError) {
          console.error('Storage deletion warning:', deleteStorageError.message);
        }
      } else {
        const fileUrl = targetRes?.previewUrl;
        if (fileUrl) {
          const fileName = getFileNameFromUrl(fileUrl);
          if (fileName) {
            await supabase.storage.from('papers_pdf').remove([fileName]);
          }
        }
      }

      // Delete from database
      const { error: deleteDbError } = await supabase
        .from('elex_papers')
        .delete()
        .eq('id', id);

      if (deleteDbError) throw deleteDbError;

      addLog(adminName, 'DELETED RESOURCE PERMANENTLY', `${id}: ${targetRes?.subjectName || 'Paper'}`, 'danger');
      await refreshResources();
      if (selectedResourceId === id) {
        setSelectedResourceId(null);
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Failed to delete resource.');
    }
  };

  const addComment = async (id: string, text: string) => {
    const email = currentAdmin?.email || 'system@davv.edu';
    try {
      const { error } = await supabase
        .from('elex_paper_comments')
        .insert([
          {
            paper_id: id,
            comment: text,
            admin_email: email
          }
        ]);
      if (error) throw error;
      addLog(currentAdmin?.name || 'System', 'COMMENT ADDED', `To resource ${id}: "${text.substring(0, 20)}..."`, 'info');
      // Refresh comments for the selected resource if needed
      if (selectedResourceId === id) {
        await fetchCommentsForSelected(id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      // Optionally, show a user-facing error message here
    }
  };

  const updateSettings = (profile: { name: string; email: string }, newPreferences: any) => {
    if (currentAdmin) {
      const updated = {
        ...currentAdmin,
        name: profile.name,
        email: profile.email
      };
      setCurrentAdmin(updated);
      localStorage.setItem('elex_current_admin', JSON.stringify(updated));
    }
    setSettings(prev => ({ ...prev, ...newPreferences }));
    addLog(currentAdmin?.name || 'System', 'SYSTEM PREFERENCES MODIFIED', 'Configuration file updated', 'warning');
  };

  return (
    <AdminContext.Provider value={{
      currentAdmin,
      resources,
      auditLogs,
      activePage,
      selectedResourceId,
      selectedResource,
      searchQuery,
      isLoading,
      authLoading,
      isMobileMenuOpen,
      setSearchQuery,
      setSelectedResourceId,
      setActivePage,
      setIsMobileMenuOpen,
      login,
      logout,
      approveResource,
      rejectResource,
      deleteResource,
      addComment,
      updateSettings,
      settings,
      refreshResources
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
