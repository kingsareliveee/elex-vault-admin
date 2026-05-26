import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Bell, Shield, Cloud, Clock as ClockIcon, Menu } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { currentAdmin, searchQuery, setSearchQuery, auditLogs, activePage, setActivePage, isMobileMenuOpen, setIsMobileMenuOpen } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentAdmin) return null;

  const formatClock = () => {
    return time.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get recent 4 logs for notifications
  const recentLogs = auditLogs.slice(0, 4);

  // Set page headers based on active page
  const getPageHeader = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Overview';
      case 'pending': return 'Pending Resource Queue';
      case 'approved': return 'Approved Resources';
      case 'rejected': return 'Rejected Archives';
      case 'viewer': return 'Document Moderation';
      case 'analytics': return 'Analytics & Reports';
      case 'settings': return 'System Settings';
      default: return 'Moderation Console';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-obsidian-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Page Title & Status */}
      <div className="flex items-center space-x-3">
        {/* Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg border border-zinc-850 bg-obsidian-950 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h2 className="font-bold text-xs tracking-wider text-white uppercase font-sans">{getPageHeader()}</h2>
        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Cloud className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">SUPABASE ACTIVE</span>
        </div>
      </div>

      {/* Center Search */}
      <div className="flex-1 max-w-md mx-8 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search papers, contributor, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-950 border border-zinc-800 rounded-lg px-10 py-2 text-xs text-zinc-350 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Dynamic System Clock */}
        <div className="hidden sm:flex items-center space-x-2 border-r border-zinc-850 pr-4 text-[10px] text-zinc-400">
          <ClockIcon className="h-3.5 w-3.5 text-zinc-500" />
          <span>{formatDate()}</span>
          <span className="text-white font-bold bg-obsidian-950 px-2 py-0.5 rounded border border-zinc-800">{formatClock()}</span>
        </div>

        {/* Security Shield */}
        <div className="flex items-center space-x-1.5 border-r border-zinc-850 pr-4">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-[10px] text-green-500 font-semibold uppercase hidden md:inline">Secure Session</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
              showNotifications
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-obsidian-950 border-zinc-850 text-zinc-450 hover:text-zinc-200 hover:border-zinc-750'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-obsidian-900 shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-100">
                <div className="p-3 border-b border-zinc-850 bg-obsidian-950/60 flex items-center justify-between">
                  <span className="text-white font-semibold tracking-wider text-[10px] uppercase">Activity Stream</span>
                  <button 
                    onClick={() => {
                      setActivePage('dashboard');
                      setShowNotifications(false);
                    }}
                    className="text-[10px] text-blue-500 hover:text-blue-400 hover:underline uppercase font-bold"
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-850">
                  {recentLogs.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">
                      No recent activity.
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <div key={log.id} className="p-3 hover:bg-zinc-850/20 transition-colors">
                        <div className="flex justify-between items-start mb-1 text-[10px]">
                          <span className={`font-semibold uppercase ${
                            log.type === 'success' ? 'text-green-500' :
                            log.type === 'danger' ? 'text-red-500' :
                            log.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-zinc-500">{log.timestamp.split(' ')[1]}</span>
                        </div>
                        <p className="text-zinc-350 text-[10px] leading-relaxed truncate">{log.target}</p>
                        <p className="text-[9px] text-zinc-550 mt-0.5">By {log.adminName}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
