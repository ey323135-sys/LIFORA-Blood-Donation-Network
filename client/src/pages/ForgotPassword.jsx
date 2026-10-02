import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Droplet, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
          <p className="text-xs text-slate-400">Enter your email and we'll send a secure reset link</p>
        </div>

        <div className="glass-panel p-8 space-y-5">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-white font-semibold">Check Your Email</h3>
              <p className="text-slate-400 text-sm">
                If an account exists for <strong className="text-white">{email}</strong>, a password reset link has been sent.
                Check your inbox (and spam folder).
              </p>
              <p className="text-xs text-slate-500">The link expires in 1 hour.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-xs !py-2.5 !px-4">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full text-xs font-bold !py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending reset link...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>
              <div className="text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-red-300 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
