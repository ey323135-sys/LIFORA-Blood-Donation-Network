const { supabase } = require('../config/supabase');
const { logActivity } = require('../services/auditService');

/**
 * Helper to fetch complete role-specific profile data
 */
const fetchFullUserProfile = async (userId, role) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return { user: null, roleProfile: null };

  let roleProfile = null;
  if (role === 'donor') {
    const { data: donor } = await supabase
      .from('donor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    roleProfile = donor;
  } else if (role === 'hospital') {
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    roleProfile = hospital;
  } else if (role === 'bloodbank') {
    const { data: bloodBank } = await supabase
      .from('blood_banks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    roleProfile = bloodBank;
  }

  return {
    user: {
      ...profile,
      _id: profile.id
    },
    roleProfile: roleProfile ? { ...roleProfile, _id: roleProfile.id } : null
  };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'donor',
      city,
      state,
      bloodGroup,
      dateOfBirth,
      hospitalName,
      bloodBankName,
      registrationNo,
      officialEmail,
      address,
      contactPerson
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Role validation: Prevent self-registering as admin
    const sanitizedRole = ['donor', 'requester', 'hospital', 'bloodbank'].includes(role) ? role : 'donor';
    const lowerEmail = email.toLowerCase().trim();

    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: lowerEmail,
      password,
      options: {
        data: {
          name,
          role: sanitizedRole,
          phone: phone || '',
          city: city || '',
          state: state || '',
          blood_group: sanitizedRole === 'donor' ? bloodGroup : undefined
        }
      }
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    const authUser = authData.user;
    if (!authUser) {
      return res.status(400).json({ success: false, message: 'Failed to create user account.' });
    }

    // 2. Ensure base profile exists in public.profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: lowerEmail,
        name,
        phone: phone || '',
        role: sanitizedRole,
        city: city || '',
        state: state || '',
        is_verified: false,
        status: 'active'
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('[Register Profile Error]:', profileError.message);
    }

    // 3. Create role-specific record
    if (sanitizedRole === 'donor') {
      if (bloodGroup && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
        await supabase
          .from('donor_profiles')
          .upsert({
            user_id: authUser.id,
            blood_group: bloodGroup,
            city: city || '',
            state: state || '',
            date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
            is_available: false // Google/New user must explicitly toggle availability
          });
      }
    } else if (sanitizedRole === 'hospital') {
      await supabase
        .from('hospitals')
        .upsert({
          user_id: authUser.id,
          hospital_name: hospitalName || name,
          registration_no: registrationNo || 'PENDING-REG',
          official_email: officialEmail || lowerEmail,
          phone: phone || '',
          city: city || '',
          state: state || '',
          address: address || '',
          contact_person: contactPerson || name
        });
    } else if (sanitizedRole === 'bloodbank') {
      await supabase
        .from('blood_banks')
        .upsert({
          user_id: authUser.id,
          blood_bank_name: bloodBankName || name,
          registration_no: registrationNo || 'PENDING-REG',
          official_email: officialEmail || lowerEmail,
          phone: phone || '',
          city: city || '',
          state: state || '',
          address: address || '',
          contact_person: contactPerson || name
        });
    }

    await logActivity(authUser.id, 'USER_REGISTERED', 'profiles', authUser.id, `Role: ${sanitizedRole}, Email: ${lowerEmail}`);

    const session = authData.session;
    const token = session ? session.access_token : null;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: authUser.id,
        _id: authUser.id,
        name,
        email: lowerEmail,
        role: sanitizedRole,
        isVerified: false,
        city: city || '',
        state: state || ''
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login with Email and Password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Authenticate through Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: lowerEmail,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ 
        success: false, 
        message: authError?.message || 'Invalid email or password.' 
      });
    }

    const authUser = authData.user;

    // Fetch authoritative profile
    const { user, roleProfile } = await fetchFullUserProfile(authUser.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile record not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    await logActivity(user.id, 'USER_LOGIN', 'profiles', user.id, `Email: ${lowerEmail}`);

    res.json({
      success: true,
      token: authData.session.access_token,
      user,
      profile: roleProfile,
      message: `Welcome back, ${user.name}!`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth/Google sign-in callback handler & verification
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { accessToken, token: clientToken } = req.body;
    const token = accessToken || clientToken;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Access token is required for OAuth verification' });
    }

    // Verify token with Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ success: false, message: 'Invalid Supabase session token' });
    }

    const authUser = authData.user;
    let { user, roleProfile } = await fetchFullUserProfile(authUser.id);

    let isNewUser = false;
    let requiresProfileCompletion = false;

    // Create profile if missing
    if (!user) {
      isNewUser = true;
      const metadata = authUser.user_metadata || {};
      const { data: createdProfile } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          name: metadata.name || metadata.full_name || authUser.email.split('@')[0],
          phone: metadata.phone || '',
          role: 'donor',
          city: metadata.city || '',
          state: metadata.state || '',
          avatar: metadata.avatar_url || metadata.picture || '',
          is_verified: false,
          status: 'active'
        })
        .select('*')
        .single();

      user = createdProfile ? { ...createdProfile, _id: createdProfile.id } : null;
      requiresProfileCompletion = true;
    } else {
      // Check if profile details need completion
      if (user.role === 'donor' && (!roleProfile || !roleProfile.blood_group)) {
        requiresProfileCompletion = true;
      }
    }

    res.json({
      success: true,
      token,
      user,
      profile: roleProfile,
      isNewUser,
      requiresProfileCompletion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const { user, roleProfile } = await fetchFullUserProfile(req.user.id, req.user.role);

    res.json({
      success: true,
      user,
      profile: roleProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete profile after Google OAuth signup
// @route   POST /api/auth/complete-profile
// @access  Private
exports.completeProfile = async (req, res, next) => {
  try {
    const { phone, city, state, role, bloodGroup, dateOfBirth, isAvailable } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (phone) updates.phone = phone;
    if (city) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (role && ['donor', 'requester', 'hospital', 'bloodbank'].includes(role)) {
      updates.role = role;
    }

    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (profileErr) {
      return res.status(400).json({ success: false, message: profileErr.message });
    }

    const effectiveRole = updatedProfile.role;

    // Handle donor-specific completion
    if (effectiveRole === 'donor' && bloodGroup) {
      await supabase
        .from('donor_profiles')
        .upsert({
          user_id: userId,
          blood_group: bloodGroup,
          city: updatedProfile.city || '',
          state: updatedProfile.state || '',
          date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
          is_available: isAvailable !== undefined ? Boolean(isAvailable) : false
        });
    }

    const { user, roleProfile } = await fetchFullUserProfile(userId, effectiveRole);

    await logActivity(userId, 'PROFILE_COMPLETED', 'profiles', userId, `Completed details for ${user.email}`);

    res.json({
      success: true,
      message: 'Profile completed successfully!',
      user,
      profile: roleProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${clientUrl}/reset-password`
    });

    if (error) {
      console.warn('[ForgotPassword Warning]:', error.message);
    }

    // Always return success message to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been dispatched.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with new credentials
// @route   POST /api/auth/reset-password
// @access  Public / Private
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, accessToken } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // If access token provided in request header or body
    const token = req.headers.authorization?.replace('Bearer ', '') || accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Reset token is missing or expired.' });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset session.' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      password
    });

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    res.json({
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  res.json({
    success: true,
    message: 'Email verification is managed securely through Supabase Auth confirmation links.'
  });
};

// @desc    Change password for logged-in user
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user session
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
