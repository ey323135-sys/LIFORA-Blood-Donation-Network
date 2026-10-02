const { supabase } = require('../config/supabase');

/**
 * Protect middleware: Verifies Supabase JWT access token and loads verified user profile
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // 1. Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData || !authData.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session. Please sign in again.' 
      });
    }

    const authUser = authData.user;

    // 2. Fetch authoritative profile from PostgreSQL
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    // 3. Fallback: If trigger hasn't populated profile yet (e.g. immediate OAuth callback)
    if (!profile) {
      const metadata = authUser.user_metadata || {};
      const fallbackRole = metadata.role && ['donor', 'requester', 'hospital', 'bloodbank'].includes(metadata.role)
        ? metadata.role
        : 'donor';

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          name: metadata.name || metadata.full_name || authUser.email.split('@')[0],
          phone: metadata.phone || '',
          role: fallbackRole,
          city: metadata.city || '',
          state: metadata.state || '',
          avatar: metadata.avatar_url || metadata.picture || '',
          is_verified: false,
          status: 'active'
        })
        .select('*')
        .single();

      if (createError) {
        console.error('[AuthMiddleware] Profile auto-creation error:', createError.message);
      } else {
        profile = createdProfile;
      }
    }

    if (!profile) {
      return res.status(401).json({ success: false, message: 'User profile not found in database' });
    }

    // 4. Check if account is suspended
    if (profile.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been suspended by an administrator.' 
      });
    }

    // Attach profile to request with backward-compatible aliases
    req.user = {
      ...profile,
      _id: profile.id // backward compatibility with legacy controller references
    };
    req.token = token;

    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]:', error.message);
    return res.status(401).json({ success: false, message: 'Authentication verification failed' });
  }
};

/**
 * Role-based authorization middleware
 * Usage: authorize('admin', 'hospital')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
