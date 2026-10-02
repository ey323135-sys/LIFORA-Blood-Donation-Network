const { supabase } = require('../config/supabase');

// @desc    Get real platform statistics from Supabase database (publicly accessible)
// @route   GET /api/stats/public
// @access  Public
exports.getPublicStats = async (req, res, next) => {
  try {
    const isConfigured = Boolean(
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_URL.includes('placeholder')
    );

    if (!isConfigured) {
      return res.json({
        success: true,
        stats: {
          totalDonors: 0,
          availableDonors: 0,
          activeBloodRequests: 0,
          totalBloodRequests: 0,
          requestsFulfilled: 0,
          registeredHospitals: 0,
          registeredBloodBanks: 0,
          totalInventoryUnits: 0
        }
      });
    }

    // 1. Total registered donors
    const { count: totalDonors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'donor');

    // 2. Available donors
    const { count: availableDonors } = await supabase
      .from('donor_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true);

    // 3. Active blood requests
    const { count: activeRequests } = await supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Pending', 'Matching', 'Donor Responded', 'In Coordination']);

    // 4. Requests fulfilled
    const { count: fulfilledRequests } = await supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Fulfilled');

    // 5. Total blood requests
    const { count: totalRequests } = await supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true });

    // 6. Registered hospitals
    const { count: registeredHospitals } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'hospital');

    // 7. Registered blood banks
    const { count: registeredBloodBanks } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'bloodbank');

    // 8. Blood inventory total reported units
    const { data: invRows } = await supabase
      .from('blood_inventory')
      .select('units');
    const totalInventoryUnits = (invRows || []).reduce((acc, row) => acc + (Number(row.units) || 0), 0);

    res.json({
      success: true,
      stats: {
        totalDonors: totalDonors || 0,
        availableDonors: availableDonors || 0,
        activeBloodRequests: activeRequests || 0,
        totalBloodRequests: totalRequests || 0,
        requestsFulfilled: fulfilledRequests || 0,
        registeredHospitals: registeredHospitals || 0,
        registeredBloodBanks: registeredBloodBanks || 0,
        totalInventoryUnits: totalInventoryUnits || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
