const { supabase } = require('../config/supabase');
const { logActivity } = require('../services/auditService');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// @desc    Get complete system analytics for Admin Dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total counts from profiles
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalDonors } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'donor');
    const { count: totalHospitals } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'hospital');
    const { count: totalBloodBanks } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'bloodbank');

    // 2. Request counts
    const { count: totalRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true });
    const { count: activeRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true })
      .in('status', ['Pending', 'Matching', 'Donor Responded', 'In Coordination']);
    const { count: completedRequests } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true })
      .eq('status', 'Fulfilled');

    // 3. Blood Inventory units
    const { data: invRows } = await supabase.from('blood_inventory').select('units');
    const totalReportedUnits = (invRows || []).reduce((acc, row) => acc + (Number(row.units) || 0), 0);

    // 4. Analytics by blood group
    const { data: allRequests } = await supabase.from('blood_requests').select('blood_group, status');
    const requestsList = allRequests || [];

    const groupCounts = {};
    const statusCounts = {};

    BLOOD_GROUPS.forEach(bg => { groupCounts[bg] = 0; });
    requestsList.forEach(r => {
      if (r.blood_group) {
        groupCounts[r.blood_group] = (groupCounts[r.blood_group] || 0) + 1;
      }
      if (r.status) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    });

    const requestsByBloodGroup = BLOOD_GROUPS.map(bg => ({
      bloodGroup: bg,
      count: groupCounts[bg] || 0
    }));

    const requestsByStatus = Object.keys(statusCounts).map(statusKey => ({
      status: statusKey,
      count: statusCounts[statusKey]
    }));

    // 5. Unverified institutions
    const { count: unverifiedHospitals } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'hospital').eq('is_verified', false);
    const { count: unverifiedBloodBanks } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'bloodbank').eq('is_verified', false);

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalDonors: totalDonors || 0,
        totalHospitals: totalHospitals || 0,
        totalBloodBanks: totalBloodBanks || 0,
        totalRequests: totalRequests || 0,
        activeRequests: activeRequests || 0,
        completedRequests: completedRequests || 0,
        totalReportedUnits: totalReportedUnits || 0,
        unverifiedHospitals: unverifiedHospitals || 0,
        unverifiedBloodBanks: unverifiedBloodBanks || 0
      },
      charts: {
        requestsByBloodGroup,
        requestsByStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users list with filtering & search
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, isVerified, status } = req.query;

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (isVerified !== undefined && isVerified !== '') {
      query = query.eq('is_verified', isVerified === 'true');
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (users || []).map(u => ({
      ...u,
      _id: u.id,
      isVerified: u.is_verified
    }));

    res.json({ success: true, count: formatted.length, users: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify hospital or blood bank user
// @route   PATCH /api/admin/users/:id/verify
// @access  Private (Admin)
exports.verifyUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const { data: user, error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', targetUserId)
      .select('*')
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found or update failed' });
    }

    await supabase
      .from('notifications')
      .insert({
        recipient_id: user.id,
        title: 'Account Verified!',
        message: `Congratulations ${user.name}! Your ${user.role} account has been verified by the LIFORA administration team.`,
        type: 'account_verified',
        is_read: false
      });

    await logActivity(req.user.id, 'ADMIN_VERIFY_USER', 'profiles', user.id, `Verified ${user.role} account: ${user.name}`);

    res.json({
      success: true,
      message: `Account for ${user.name} verified successfully`,
      user: {
        ...user,
        _id: user.id,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or Reactivate user account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' or 'suspended'
    const targetUserId = req.params.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const { data: targetUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify administrator status.' });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', targetUserId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    await logActivity(req.user.id, 'ADMIN_TOGGLE_USER_STATUS', 'profiles', targetUserId, `Set status to ${status}`);

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      user: {
        ...updated,
        _id: updated.id,
        isVerified: updated.is_verified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit activity logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { data: logs, error } = await supabase
      .from('admin_audit_logs')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (logs || []).map(l => ({
      ...l,
      _id: l.id,
      user: l.user ? { ...l.user, _id: l.user.id } : null
    }));

    res.json({ success: true, count: formatted.length, logs: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get contact form submissions
// @route   GET /api/admin/contact-messages
// @access  Private (Admin)
exports.getContactMessages = async (req, res, next) => {
  try {
    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (messages || []).map(m => ({
      ...m,
      _id: m.id
    }));

    res.json({ success: true, count: formatted.length, messages: formatted });
  } catch (error) {
    next(error);
  }
};
