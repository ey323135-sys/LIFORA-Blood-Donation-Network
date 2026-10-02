import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lifora_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (supabase && isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
      await authService.logout().catch(() => {});
    } finally {
      localStorage.removeItem('lifora_token');
      setToken(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.success) {
        setUser(res.user);
        setProfile(res.profile);
        return res;
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
    return null;
  }, []);

  // Supabase Auth state listener & session restoration
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // If Supabase is available, get active session
      if (supabase && isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            localStorage.setItem('lifora_token', session.access_token);
            if (mounted) setToken(session.access_token);
            const res = await authService.getMe();
            if (mounted && res.success) {
              setUser(res.user);
              setProfile(res.profile);
            }
          } else {
            // Check local fallback token if any
            const localTok = localStorage.getItem('lifora_token');
            if (localTok) {
              const res = await authService.getMe();
              if (mounted && res.success) {
                setUser(res.user);
                setProfile(res.profile);
              }
            }
          }
        } catch (err) {
          console.error('[Auth Init] Session verification error:', err);
        } finally {
          if (mounted) setLoading(false);
        }

        // Listen for OAuth callbacks, sign-ins, and token refresh
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.access_token) {
            localStorage.setItem('lifora_token', session.access_token);
            if (mounted) setToken(session.access_token);
            try {
              const meRes = await authService.getMe();
              if (mounted && meRes.success) {
                setUser(meRes.user);
                setProfile(meRes.profile);
              }
            } catch (err) {
              console.error('[Auth State Change] Failed to fetch me:', err);
            }
          } else if (event === 'SIGNED_OUT') {
            if (mounted) {
              localStorage.removeItem('lifora_token');
              setToken(null);
              setUser(null);
              setProfile(null);
            }
          }
          if (mounted) setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Supabase not configured in client env, check if local token exists
        const localTok = localStorage.getItem('lifora_token');
        if (localTok) {
          authService.getMe().then(res => {
            if (mounted && res.success) {
              setUser(res.user);
              setProfile(res.profile);
            }
          }).catch(() => {
            if (mounted) logout();
          }).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          if (mounted) setLoading(false);
        }
      }
    };

    const cleanupPromise = initAuth();

    return () => {
      mounted = false;
      if (typeof cleanupPromise?.then === 'function') {
        cleanupPromise.then(cleanup => cleanup && cleanup());
      }
    };
  }, [logout]);

  // Real Google Sign-In with Supabase Auth
  const loginWithGoogle = async () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      );
    }

    const redirectUrl = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) throw error;
    return data;
  };

  // Email and Password Login
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.token) {
        localStorage.setItem('lifora_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setProfile(res.profile);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Registration
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await authService.register(formData);
      if (res.success) {
        if (res.token) {
          localStorage.setItem('lifora_token', res.token);
          setToken(res.token);
        }
        setUser(res.user);
        await refreshProfile();
        return { success: true, user: res.user, message: res.message };
      }
      throw new Error(res.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Complete Profile after OAuth or registration
  const completeProfile = async (data) => {
    try {
      const res = await authService.completeProfile(data);
      if (res.success) {
        setUser(res.user);
        setProfile(res.profile);
        await refreshProfile();
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      token, 
      loading, 
      isConfigured: isSupabaseConfigured,
      login, 
      loginWithGoogle, 
      register, 
      logout, 
      refreshProfile, 
      completeProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
