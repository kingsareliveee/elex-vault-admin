import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, setActivePage } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your admin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen elex-navy-bg flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background grid overlay */}
      <div className="absolute inset-0 elex-grid-overlay opacity-30 pointer-events-none"></div>

      {/* Decorative navy gradient glow */}
      <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-obsidian-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8 sm:p-10">
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">ELEX Vault Admin</h2>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium">Academic Moderation System</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium leading-normal text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-300 font-semibold tracking-wide">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@elex.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-obsidian-950/80 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-zinc-300 font-semibold tracking-wide">Password</label>
                <button
                  type="button"
                  onClick={() => setActivePage('forgot-password')}
                  className="text-xs text-zinc-500 hover:text-blue-400 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-obsidian-950/80 border border-zinc-800 rounded-lg pl-10 pr-10 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Account Registration Help */}
          <div className="mt-8 border-t border-zinc-800/80 pt-5 text-center">
            <p className="text-xs text-zinc-500">
              Only authorized administrators can access this system.
            </p>
            <button
              onClick={() => setActivePage('signup')}
              className="mt-2.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Request Admin Access &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
