import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Settings as SettingsIcon, Shield, Server, Save, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentAdmin, settings, updateSettings } = useAdmin();
  
  // Local profile states
  const [profileName, setProfileName] = useState(currentAdmin?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentAdmin?.email || '');

  // Local preferences states
  const [maxUploadSize, setMaxUploadSize] = useState(settings.maxUploadSize);
  const [autoVirusScan, setAutoVirusScan] = useState(settings.autoVirusScan);
  const [requireMultiApproval, setRequireMultiApproval] = useState(settings.requireMultiApproval);
  const [notifyOnUpload, setNotifyOnUpload] = useState(settings.notifyOnUpload);

  // Supabase configurations info
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qeydeliinydvyydplbpa.supabase.co';
  const dbStatus = 'CONNECTED';

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(
      { name: profileName, email: profileEmail },
      { maxUploadSize, autoVirusScan, requireMultiApproval, notifyOnUpload }
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 font-sans select-none">
      
      {/* Save Success Alert Banner */}
      {savedSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold text-center rounded-lg flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="h-4 w-4" />
          <span>System configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Admin Profile Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center space-x-2 text-white">
              <Shield className="h-4.5 w-4.5 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Moderator Profile</h3>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-zinc-850">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center font-bold text-blue-500 text-sm border border-zinc-750">
                  {currentAdmin?.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200">{currentAdmin?.name}</h4>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">{currentAdmin?.role}</span>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-305 focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Last login */}
              <div className="text-[10px] text-zinc-500 pt-2 flex justify-between font-mono">
                <span>LAST SESSION AUDIT:</span>
                <span className="text-zinc-400">{currentAdmin?.lastLogin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Moderation Settings */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center space-x-2 text-white">
              <SettingsIcon className="h-4.5 w-4.5 text-green-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Moderation Preferences</h3>
            </div>

            <div className="p-5 space-y-5 text-xs text-zinc-300">
              
              {/* Max upload size */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-zinc-500">Max Upload File Size Limit</span>
                  <span className="text-white font-bold">{maxUploadSize} MB</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                  className="w-full bg-obsidian-950 accent-blue-500 cursor-pointer h-1.5 rounded-full border border-zinc-850"
                />
              </div>

              {/* Preferences Toggles */}
              <div className="space-y-4 pt-2 border-t border-zinc-850">
                
                {/* Auto scan */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-[11px] text-zinc-200 uppercase tracking-wide">Automatic malware scan</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 block">Trigger scanning checks on uploaded documents</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoVirusScan}
                    onChange={(e) => setAutoVirusScan(e.target.checked)}
                    className="h-4 w-4 bg-obsidian-950 border-zinc-850 text-blue-500 accent-blue-500 rounded"
                  />
                </div>

                {/* Double approval */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-[11px] text-zinc-200 uppercase tracking-wide">Multi-Operator Signoff</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 block">Requires two approval markers to index papers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireMultiApproval}
                    onChange={(e) => setRequireMultiApproval(e.target.checked)}
                    className="h-4 w-4 bg-obsidian-950 border-zinc-850 text-blue-500 accent-blue-500 rounded"
                  />
                </div>

                {/* Notify on upload */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-[11px] text-zinc-200 uppercase tracking-wide">Audit Notifications</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 block">Broadcast alert triggers on new user uploads</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOnUpload}
                    onChange={(e) => setNotifyOnUpload(e.target.checked)}
                    className="h-4 w-4 bg-obsidian-950 border-zinc-850 text-blue-500 accent-blue-500 rounded"
                  />
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Supabase Connection Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-obsidian-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 bg-obsidian-950/40 flex items-center space-x-2 text-white">
              <Server className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Supabase Connection</h3>
            </div>

            <div className="p-5 space-y-4 text-xs text-zinc-300">
              <p className="text-[10px] text-zinc-500 leading-normal">
                This system runs connected to the live Supabase server for real-time authentication and DB moderation queries.
              </p>

              {/* Status */}
              <div className="flex justify-between items-center bg-obsidian-950 border border-zinc-850 p-2.5 rounded-lg">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Sync State</span>
                <span className="px-2 py-0.5 text-[9px] rounded font-bold text-green-500 bg-green-500/10 border border-green-500/20 font-mono">
                  {dbStatus}
                </span>
              </div>

              {/* DB URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Project URL</label>
                <input
                  type="text"
                  readOnly
                  value={supabaseUrl}
                  className="w-full bg-obsidian-950 border border-zinc-850 rounded-lg px-3 py-2 text-[10px] text-zinc-450 font-mono focus:outline-none"
                />
              </div>

              {/* DB Anon key info */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Anon Key</label>
                <input
                  type="password"
                  readOnly
                  value="sb_publishable_v3yx0H-65oWxm2f_IOitNw_bVNqy72F"
                  className="w-full bg-obsidian-950 border border-zinc-850 rounded-lg px-3 py-2 text-[10px] text-zinc-500 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="lg:col-span-3 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-lg active:scale-[0.99] transition duration-200 shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            <Save className="h-4.5 w-4.5" />
            <span>Save Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
};
