import React from 'react';
import { useAdmin } from '../context/AdminContext';
import type { PageRoute } from '../context/AdminContext';
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Database
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentAdmin, activePage, setActivePage, logout, resources } = useAdmin();

  if (!currentAdmin) return null;

  const pendingCount = resources.filter(r => r.isApproved === false).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pending', label: 'Pending Queue', icon: Clock, badge: pendingCount, badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { id: 'approved', label: 'Approved Resources', icon: CheckCircle2 },
    { id: 'rejected', label: 'Rejected (Archive)', icon: XCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 border-r border-zinc-800 bg-obsidian-900 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Platform Title */}
      <div className="p-6 border-b border-zinc-850 flex items-center space-x-3">
        <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
          <ShieldAlert className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white font-sans">ELEX Vault</h1>
          <span className="text-[10px] tracking-wide text-zinc-500 font-semibold block uppercase">Admin Control</span>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="p-4 border-b border-zinc-850 bg-obsidian-950/30 flex items-center space-x-3">
        <div className="h-9 w-9 rounded-lg border border-zinc-800 bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-sm font-bold text-blue-400">
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
              onClick={() => setActivePage(item.id as PageRoute)}
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

      {/* System Monitoring Unit */}
      <div className="p-4 border-t border-zinc-850 bg-obsidian-950/40 text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-850 pb-1.5">
          <span className="flex items-center space-x-1.5 font-medium">
            <Database className="h-3.5 w-3.5 text-green-500" />
            <span>Connection State</span>
          </span>
          <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 font-semibold">SUPABASE</span>
        </div>
        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex justify-between">
            <span>Node</span>
            <span className="text-zinc-300">ELEX-ADM-01</span>
          </div>
          <div className="flex justify-between">
            <span>Sync status</span>
            <span className="text-green-500">Live</span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-zinc-850 bg-obsidian-900/50">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 font-semibold text-xs transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
