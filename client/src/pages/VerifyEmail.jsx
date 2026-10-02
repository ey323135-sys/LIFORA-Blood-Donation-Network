import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { Droplet, Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found. Please check your email link.');
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setStatus('success');
          setMessage(res.message || 'Your email has been verified!');
        } else {
          setStatus('error');
          setMessage(res.message || 'Verification failed. Please try again.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification link is invalid or has expired. Please request a new one.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <Droplet className="w-8 h-8 text-white fill-white" />
          </div>

          <h2 className="text-xl font-bold text-white">Email Verification</h2>

          {status === 'verifying' && (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-red-400 mx-auto" />
              <p className="text-slate-400 text-sm">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
              <h3 className="text-emerald-300 font-semibold text-lg">Email Verified!</h3>
              <p className="text-slate-400 text-sm">{message}</p>
              <p className="text-slate-400 text-sm">You can now sign in to your LIFORA account.</p>
              <Link to="/login"
                className="btn-primary inline-flex items-center gap-2 text-sm !py-2.5 !px-6">
                Sign In Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h3 className="text-red-300 font-semibold">Verification Failed</h3>
              <p className="text-slate-400 text-sm">{message}</p>
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2 text-sm !py-2.5">
                  Go to Sign In
                </Link>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Contact support if the issue persists
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
