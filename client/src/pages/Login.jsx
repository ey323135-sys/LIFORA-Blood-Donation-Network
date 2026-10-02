import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Droplet, Lock, Mail, Loader2, AlertCircle, Shield, Building2, HeartHandshake, User, Key, CheckCircle, Eye, EyeOff } from 'lucide-react';

const SHOW_DEMO_LOGINS = import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' && import.meta.env.DEV;

export default function Login() {
  const { login, loginWithGoogle, user, isConfigured } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirectByRole = (role) => {
    switch (role) {
      case 'donor':     navigate('/dashboard/donor');     break;
      case 'requester': navigate('/dashboard/requester'); break;
      case 'hospital':  navigate('/dashboard/hospital');  break;
      case 'bloodbank': navigate('/dashboard/bloodbank'); break;
      case 'admin':     navigate('/dashboard/admin');     break;
      default:          navigate(from);                   break;
    }
  };

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user && user.role) {
      redirectByRole(user.role);
    }
  }, [user]);

  // Show messages passed via navigation state (e.g. from registration or password reset)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await login({ email, password });
      if (res?.success && res.user) {
        redirectByRole(res.user.role);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In through Supabase OAuth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Browser redirects to Google OAuth page automatically
    } catch (err) {
      setError(err.message || 'Failed to initialize Google Sign-In. Check Supabase OAuth configuration.');
      setGoogleLoading(false);
    }
  };

  // Dev Demo Logins (local development only)
  const handleDemoLogin = async (demoEmail) => {
    if (!SHOW_DEMO_LOGINS) return;
    setEmail(demoEmail);
    setPassword('Lifora@123');
    setLoading(true);
    setError('');
    try {
      const res = await login({ email: demoEmail, password: 'Lifora@123' });
      if (res?.success && res.user) {
        redirectByRole(res.user.role);
      }
    } catch (err) {
      setError(err.message || 'Demo login failed. Make sure demo accounts are provisioned in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <Droplet className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to LIFORA</h1>
          <p className="text-xs text-slate-400">Access your role dashboard and emergency network</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-8 space-y-5">

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google OAuth Button */}
          <div className="space-y-2">
            <button
              type="button"
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-75"
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-800" /> Redirecting to Google...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {!isConfigured && (
              <p className="text-[11px] text-amber-400 text-center">
                Configure <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">VITE_SUPABASE_URL</code> to enable live OAuth.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-widest rounded">
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-red-400 hover:text-red-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="btn-primary w-full text-xs font-bold !py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-1">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
              Register now
            </Link>
          </div>

          {/* Dev Demo Logins (Development only) */}
          {SHOW_DEMO_LOGINS && (
            <details className="pt-2 border-t border-slate-800">
              <summary className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 select-none py-1">
                <Key className="w-3.5 h-3.5" /> Dev Demo Logins
              </summary>
              <div className="grid grid-cols-2 gap-2 text-[11px] mt-3">
                <button type="button" onClick={() => handleDemoLogin('donor@lifora.org')}
                  className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <HeartHandshake className="w-3.5 h-3.5" /> Donor (O+)
                </button>
                <button type="button" onClick={() => handleDemoLogin('hospital@lifora.org')}
                  className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 hover:bg-blue-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <Building2 className="w-3.5 h-3.5" /> Hospital
                </button>
                <button type="button" onClick={() => handleDemoLogin('bloodbank@lifora.org')}
                  className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <Droplet className="w-3.5 h-3.5" /> Blood Bank
                </button>
                <button type="button" onClick={() => handleDemoLogin('requester@lifora.org')}
                  className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <User className="w-3.5 h-3.5" /> Requester
                </button>
                <button type="button" onClick={() => handleDemoLogin('admin@lifora.org')}
                  className="col-span-2 p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
