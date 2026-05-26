import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { PendingQueue } from './pages/PendingQueue';
import { ApprovedResources } from './pages/ApprovedResources';
import { RejectedResources } from './pages/RejectedResources';
import { ResourceViewerPage } from './pages/ResourceViewerPage';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { 
  Loader2,
  X,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import type { PageRoute } from './context/AdminContext';

const AppContent: React.FC = () => {
  const { currentAdmin, activePage, authLoading, isMobileMenuOpen, setIsMobileMenuOpen, logout, resources, setActivePage } = useAdmin();

  if (authLoading) {
    return (
      <div className="min-h-screen w-screen elex-navy-bg flex items-center justify-center font-sans">
        <div className="absolute inset-0 elex-grid-overlay opacity-30 pointer-events-none"></div>
        <div className="text-center space-y-3 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase">Verifying Authorization...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render authentication pages
  if (!currentAdmin) {
    switch (activePage) {
      case 'signup':
        return <Signup />;
      case 'forgot-password':
        return <ForgotPassword />;
      case 'login':
      default:
        return <Login />;
    }
  }

  const pendingCount = resources.filter(r => r.isApproved === false).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pending', label: 'Pending Queue', icon: Clock, badge: pendingCount, badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { id: 'approved', label: 'Approved Resources', icon: CheckCircle2 },
    { id: 'rejected', label: 'Rejected (Archive)', icon: XCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  // Render the core admin dashboard layout
  return (
    <div className="flex h-screen elex-navy-bg text-zinc-100 overflow-hidden relative font-sans">
      {/* Background grid overlay */}
      <div className="absolute inset-0 elex-grid-overlay opacity-25 pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          {/* Drawer content panel */}
          <aside className="relative w-72 max-w-[80vw] bg-obsidian-950/95 backdrop-blur-md border-r border-zinc-800 flex flex-col h-full z-50 animate-in slide-in-from-left duration-250 select-none">
            {/* Header close panel */}
            <div className="p-5 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                  <ShieldAlert className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-wide text-white">ELEX Vault</h1>
                  <span className="text-[9px] tracking-wider text-zinc-500 font-semibold block uppercase">Admin Control</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-750 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Admin Profile */}
            <div className="p-4 border-b border-zinc-850 bg-obsidian-900/30 flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg border border-zinc-800 bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-sm font-bold text-blue-450">
                {currentAdmin.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate">{currentAdmin.name}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">{currentAdmin.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id || (item.id === 'pending' && activePage === 'viewer');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id as PageRoute);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-150 border group cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-800/60 border-zinc-750 text-white font-semibold shadow-sm' 
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                        isActive ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout Action */}
            <div className="p-4 border-t border-zinc-850 bg-obsidian-950/20">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 font-semibold text-xs transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar control hub */}
        <Topbar />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto">
          {(() => {
            switch (activePage) {
              case 'dashboard':
                return <Dashboard />;
              case 'pending':
                return <PendingQueue />;
              case 'approved':
                return <ApprovedResources />;
              case 'rejected':
                return <RejectedResources />;
              case 'viewer':
                return <ResourceViewerPage />;
              case 'analytics':
                return <Analytics />;
              case 'settings':
                return <Settings />;
              default:
                return <Dashboard />;
            }
          })()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
