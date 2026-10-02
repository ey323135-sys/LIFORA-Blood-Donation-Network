const { supabase } = require('../config/supabase');
const { logActivity } = require('../services/auditService');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// @desc    Get reported blood inventory for logged in blood bank
// @route   GET /api/bloodbanks/inventory
// @access  Private (Blood Bank, Hospital, Admin)
exports.getInventory = async (req, res, next) => {
  try {
    const bloodBankId = req.query.bloodBankId || req.user.id;

    let { data: inventory, error } = await supabase
      .from('blood_inventory')
      .select('*')
      .eq('blood_bank_id', bloodBankId);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    let invList = inventory || [];

    // Ensure all 8 standard blood groups exist
    if (invList.length < 8 && req.user.role === 'bloodbank') {
      const existingGroups = invList.map(item => item.blood_group);
      const missingGroups = BLOOD_GROUPS.filter(bg => !existingGroups.includes(bg));

      if (missingGroups.length > 0) {
        const rowsToInsert = missingGroups.map(bg => ({
          blood_bank_id: bloodBankId,
          blood_group: bg,
          units: 0,
          last_updated_by: req.user.name,
          status: 'Out of Stock'
        }));

        await supabase.from('blood_inventory').insert(rowsToInsert);

        const { data: refreshed } = await supabase
          .from('blood_inventory')
          .select('*')
          .eq('blood_bank_id', bloodBankId);
        invList = refreshed || [];
      }
    }

    const { data: bloodBankProfile } = await supabase
      .from('blood_banks')
      .select('*')
      .eq('user_id', bloodBankId)
      .maybeSingle();

    const formattedInventory = invList.map(item => ({
      ...item,
      _id: item.id,
      bloodGroup: item.blood_group
    }));

    res.json({
      success: true,
      bloodBankProfile: bloodBankProfile ? { ...bloodBankProfile, _id: bloodBankProfile.id } : null,
      inventory: formattedInventory,
      disclaimer: 'Reported stock availability as recorded by staff. Not a real-time guarantee.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock for a specific blood group
// @route   POST /api/bloodbanks/inventory
// @access  Private (Blood Bank, Admin)
exports.updateInventory = async (req, res, next) => {
  try {
    const { bloodGroup, units } = req.body;
    const bloodBankId = req.user.id;

    if (!BLOOD_GROUPS.includes(bloodGroup) || units === undefined || units < 0) {
      return res.status(400).json({ success: false, message: 'Invalid blood group or units count' });
    }

    const unitsNum = Number(units);
    let status = 'In Stock';
    if (unitsNum === 0) status = 'Out of Stock';
    else if (unitsNum <= 3) status = 'Critical';
    else if (unitsNum <= 8) status = 'Low Stock';

    const { data: updatedItem, error } = await supabase
      .from('blood_inventory')
      .upsert({
        blood_bank_id: bloodBankId,
        blood_group: bloodGroup,
        units: unitsNum,
        last_updated_by: req.user.name,
        status
      }, { onConflict: 'blood_bank_id,blood_group' })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    await logActivity(bloodBankId, 'INVENTORY_UPDATED', 'blood_inventory', updatedItem.id, `${bloodGroup}: ${unitsNum} units (${status})`);

    res.json({
      success: true,
      message: `Inventory for ${bloodGroup} updated to ${unitsNum} units (${status}).`,
      item: {
        ...updatedItem,
        _id: updatedItem.id,
        bloodGroup: updatedItem.blood_group
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get blood requests relevant to blood bank location
// @route   GET /api/bloodbanks/requests
// @access  Private (Blood Bank)
exports.getRequests = async (req, res, next) => {
  try {
    const { data: requests, error } = await supabase
      .from('blood_requests')
      .select('*')
      .or(`city.eq.${req.user.city || ''},status.in.('Pending','Matching','In Coordination')`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (requests || []).map(r => ({
      ...r,
      _id: r.id,
      patientName: r.patient_name,
      bloodGroup: r.blood_group,
      unitsNeeded: r.units_needed,
      requiredDate: r.required_date,
      hospitalName: r.hospital_name,
      emergencyLevel: r.emergency_level
    }));

    res.json({
      success: true,
      count: formatted.length,
      requests: formatted
    });
  } catch (error) {
    next(error);
  }
};
