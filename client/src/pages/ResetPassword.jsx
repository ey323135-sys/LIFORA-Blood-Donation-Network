import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Droplet, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support both hash fragments from Supabase OAuth/recovery and URL query parameters
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hashParams.get('access_token') || searchParams.get('token') || searchParams.get('access_token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If neither token nor active supabase session exists
    if (!token) {
      if (supabase && isSupabaseConfigured) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setError('Password reset link is invalid or expired. Please request a new link.');
          }
        });
      } else {
        setError('Invalid or missing reset token. Please request a new password reset link.');
      }
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (supabase && isSupabaseConfigured) {
        const { error: supaErr } = await supabase.auth.updateUser({ password });
        if (supaErr) throw supaErr;
      } else {
        const res = await authService.resetPassword({ accessToken: token, password });
        if (!res.success) throw new Error(res.message);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful! Please sign in with your new password.' }
        });
      }, 2500);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <Droplet className="w-6 h-6 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Set New Password</h2>
          <p className="text-xs text-slate-400">Choose a strong password for your LIFORA account</p>
        </div>

        <div className="glass-panel p-8 space-y-5">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-white font-semibold">Password Reset Successful!</h3>
              <p className="text-slate-400 text-sm">Redirecting you to sign in with your new password...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      id="reset-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full text-xs font-bold !py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Resetting Password...
                    </span>
                  ) : 'Reset Password'}
                </button>
              </form>
              <div className="text-center">
                <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-red-300">
                  Request a new reset link
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
