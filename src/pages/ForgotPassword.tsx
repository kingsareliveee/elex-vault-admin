import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../supabaseClient';
import { Mail, ChevronLeft, Key, Loader2, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { setActivePage } = useAdmin();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen elex-navy-bg flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background grid */}
      <div className="absolute inset-0 elex-grid-overlay opacity-30 pointer-events-none"></div>

      <button
        onClick={() => setActivePage('login')}
        className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-300 flex items-center space-x-2 text-xs font-semibold cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Login</span>
      </button>

      <div className="w-full max-w-md bg-obsidian-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Reset Password</h2>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium">Request Admin Account Password Reset</p>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reset Link Sent</h3>
              <p className="text-xs text-zinc-450 leading-relaxed">
                We have sent a password reset link to <span className="font-semibold text-zinc-200">{email}</span>. Please check your inbox.
              </p>
              <button
                onClick={() => setActivePage('login')}
                className="w-full mt-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium text-center">
                  {error}
                </div>
              )}

              <p className="text-xs text-zinc-400 leading-relaxed text-center">
                Enter the email address associated with your admin account. We will send a secure link to reset your credentials.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-semibold tracking-wide">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="admin@elex.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-obsidian-950/80 border border-zinc-800 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4.5 w-4.5" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
