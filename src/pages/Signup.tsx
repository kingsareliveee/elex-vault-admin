import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Mail, User, ChevronLeft, Loader2, CheckCircle, FileText } from 'lucide-react';

export const Signup: React.FC = () => {
  const { setActivePage } = useAdmin();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedReason = reason.trim();

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address.');
      setLoading(false);
      return;
    }

    try {
      // 1. Check if email already exists in admin_requests table
      const { data, error: selectError } = await supabase
        .from('admin_requests')
        .select('id')
        .eq('email', trimmedEmail);

      if (selectError) {
        throw new Error(selectError.message);
      }

      if (data && data.length > 0) {
        setError('A request has already been submitted for this email address.');
        setLoading(false);
        return;
      }

      // 2. Insert request into admin_requests
      const { error: insertError } = await supabase
        .from('admin_requests')
        .insert([
          {
            email: trimmedEmail,
            full_name: trimmedName,
            reason: trimmedReason,
            status: 'pending'
          }
        ]);

      if (insertError) {
        // Handle postgres unique constraint check as well
        if (insertError.code === '23505') {
          setError('A request has already been submitted for this email address.');
        } else {
          throw new Error(insertError.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Request admin access error:', err);
      setError(err.message || 'Network issue encountered. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen elex-navy-bg flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background grid overlay */}
      <div className="absolute inset-0 elex-grid-overlay opacity-30 pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => setActivePage('login')}
        className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-300 flex items-center space-x-2 text-xs font-semibold cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Login</span>
      </button>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-obsidian-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Request Admin Access</h2>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium">Academic Moderation System</p>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Submitted Successfully</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your admin access request has been submitted successfully.
              </p>
              <button
                onClick={() => setActivePage('login')}
                className="mt-4 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-405 font-medium text-center">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-semibold tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-semibold tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@davv.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Reason for Request */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-semibold tracking-wide">Reason for Access</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <textarea
                    required
                    placeholder="Explain why you require administrative access..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    className="w-full bg-obsidian-950/80 border border-zinc-850 rounded-lg pl-10 pr-3 py-3 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-blue-500/50 transition-colors h-24 resize-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>Submit Request</span>
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
