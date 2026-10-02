const { supabase } = require('../config/supabase');
const { logActivity } = require('../services/auditService');

// @desc    Register or update organ donation pledge
// @route   POST /api/organ/pledge
// @access  Private
exports.pledgeOrganDonation = async (req, res, next) => {
  try {
    const { 
      organsPledged, 
      emergencyContactName, 
      emergencyContactPhone, 
      emergencyContactRelation, 
      witnessName, 
      legalDisclaimerAccepted,
      digitalSignature 
    } = req.body;

    if (!emergencyContactName || !emergencyContactPhone || !witnessName || !legalDisclaimerAccepted) {
      return res.status(400).json({ 
        success: false, 
        message: 'Emergency contact, witness name, and legal disclaimer acceptance are required.' 
      });
    }

    if (!organsPledged || !Array.isArray(organsPledged) || organsPledged.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one organ/tissue to pledge.' });
    }

    const userId = req.user.id;
    const ipSignature = digitalSignature || req.ip || 'Confirmed Digital Acceptance';

    // Upsert into user_consents table
    const { data: pledge, error } = await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        consent_type: 'organ_pledge',
        organs_pledged: organsPledged,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_relation: emergencyContactRelation || 'Family',
        witness_name: witnessName,
        legal_disclaimer_accepted: Boolean(legalDisclaimerAccepted),
        digital_signature: ipSignature,
        status: 'Registered',
        withdrawn_at: null
      }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Update donor_profiles organ_donation_pledged flag
    await supabase
      .from('donor_profiles')
      .update({ organ_donation_pledged: true })
      .eq('user_id', userId);

    await logActivity(userId, 'ORGAN_PLEDGE_REGISTERED', 'user_consents', pledge.id, `Organs: ${organsPledged.join(', ')}`);

    res.status(201).json({
      success: true,
      message: 'Official Organ & Tissue Donor Pledge registered successfully.',
      pledge: {
        ...pledge,
        _id: pledge.id,
        organsPledged: pledge.organs_pledged,
        emergencyContactName: pledge.emergency_contact_name,
        emergencyContactPhone: pledge.emergency_contact_phone,
        emergencyContactRelation: pledge.emergency_contact_relation,
        witnessName: pledge.witness_name,
        digitalSignature: pledge.digital_signature
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated user's organ pledge
// @route   GET /api/organ/my-pledge
// @access  Private
exports.getMyPledge = async (req, res, next) => {
  try {
    const { data: pledge, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('consent_type', 'organ_pledge')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!pledge) {
      return res.json({ success: true, pledge: null });
    }

    res.json({
      success: true,
      pledge: {
        ...pledge,
        _id: pledge.id,
        organsPledged: pledge.organs_pledged,
        emergencyContactName: pledge.emergency_contact_name,
        emergencyContactPhone: pledge.emergency_contact_phone,
        emergencyContactRelation: pledge.emergency_contact_relation,
        witnessName: pledge.witness_name,
        digitalSignature: pledge.digital_signature
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw organ donation consent
// @route   POST /api/organ/withdraw
// @access  Private
exports.withdrawPledge = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: pledge, error } = await supabase
      .from('user_consents')
      .update({
        status: 'Withdrawn',
        withdrawn_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('consent_type', 'organ_pledge')
      .select('*')
      .single();

    if (error || !pledge) {
      return res.status(404).json({ success: false, message: 'Organ pledge record not found' });
    }

    await supabase
      .from('donor_profiles')
      .update({ organ_donation_pledged: false })
      .eq('user_id', userId);

    await logActivity(userId, 'ORGAN_PLEDGE_WITHDRAWN', 'user_consents', pledge.id);

    res.json({
      success: true,
      message: 'Organ donation pledge withdrawn in accordance with legal and registry regulations.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered organ donors (Admin/Hospital view)
// @route   GET /api/organ/all
// @access  Private (Admin, Hospital)
exports.getAllPledges = async (req, res, next) => {
  try {
    const { data: pledges, error } = await supabase
      .from('user_consents')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          city,
          state
        )
      `)
      .eq('consent_type', 'organ_pledge')
      .eq('status', 'Registered')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (pledges || []).map(p => ({
      ...p,
      _id: p.id,
      organsPledged: p.organs_pledged,
      emergencyContactName: p.emergency_contact_name,
      emergencyContactPhone: p.emergency_contact_phone,
      user: p.user ? { ...p.user, _id: p.user.id } : null
    }));

    res.json({
      success: true,
      count: formatted.length,
      pledges: formatted
    });
  } catch (error) {
    next(error);
  }
};
