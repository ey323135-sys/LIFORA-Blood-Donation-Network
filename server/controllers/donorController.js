const { supabase } = require('../config/supabase');
const { logActivity } = require('../services/auditService');
const { COMPATIBILITY_RULES } = require('../services/matchingEngine');

// @desc    Get donor profile details
// @route   GET /api/donors/profile
// @access  Private (Donor)
exports.getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('donor_profiles')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          phone,
          city,
          state,
          role,
          avatar,
          is_verified
        )
      `)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        _id: profile.id,
        bloodGroup: profile.blood_group,
        isAvailable: profile.is_available,
        totalDonations: profile.total_donations,
        user: profile.user ? { ...profile.user, _id: profile.user.id } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/profile
// @access  Private (Donor)
exports.updateProfile = async (req, res, next) => {
  try {
    const { bloodGroup, city, state, dateOfBirth, isAvailable } = req.body;
    const userId = req.user.id;

    const donorUpdates = {};
    if (bloodGroup && ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
      donorUpdates.blood_group = bloodGroup;
    }
    if (city) donorUpdates.city = city;
    if (state !== undefined) donorUpdates.state = state;
    if (dateOfBirth) donorUpdates.date_of_birth = new Date(dateOfBirth).toISOString().split('T')[0];
    if (isAvailable !== undefined) donorUpdates.is_available = Boolean(isAvailable);

    // Upsert into donor_profiles
    const { data: updatedDonor, error: donorErr } = await supabase
      .from('donor_profiles')
      .upsert({
        user_id: userId,
        ...donorUpdates
      })
      .select('*')
      .single();

    if (donorErr) {
      return res.status(400).json({ success: false, message: donorErr.message });
    }

    // Also sync base profile city and state
    if (city || state !== undefined) {
      await supabase
        .from('profiles')
        .update({
          city: city || req.user.city,
          state: state !== undefined ? state : req.user.state
        })
        .eq('id', userId);
    }

    await logActivity(userId, 'DONOR_PROFILE_UPDATED', 'donor_profiles', updatedDonor.id);

    res.json({
      success: true,
      profile: {
        ...updatedDonor,
        _id: updatedDonor.id,
        bloodGroup: updatedDonor.blood_group,
        isAvailable: updatedDonor.is_available
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle donor availability status
// @route   PATCH /api/donors/availability
// @access  Private (Donor)
exports.updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const userId = req.user.id;

    const { data: updated, error } = await supabase
      .from('donor_profiles')
      .update({ is_available: Boolean(isAvailable) })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    await logActivity(userId, 'AVAILABILITY_CHANGED', 'donor_profiles', updated.id, `Status: ${updated.is_available ? 'Available' : 'Unavailable'}`);

    res.json({
      success: true,
      isAvailable: updated.is_available,
      message: `Availability status set to ${updated.is_available ? 'Available' : 'Unavailable'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incoming blood requests for donor
// @route   GET /api/donors/requests
// @access  Private (Donor)
exports.getIncomingRequests = async (req, res, next) => {
  try {
    // 1. Get donor's blood group
    const { data: donorProfile } = await supabase
      .from('donor_profiles')
      .select('blood_group, city')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!donorProfile) {
      return res.status(404).json({ success: false, message: 'Donor profile not found. Please complete your donor details.' });
    }

    const donorGroup = donorProfile.blood_group;

    // 2. Identify which request groups this donor can donate to
    const acceptableRequestGroups = Object.keys(COMPATIBILITY_RULES).filter(reqGroup => 
      (COMPATIBILITY_RULES[donorGroup] || []).includes(reqGroup)
    );

    // 3. Query active blood requests
    const { data: requests, error: reqErr } = await supabase
      .from('blood_requests')
      .select(`
        *,
        requester:requester_id (
          id,
          name,
          phone,
          email,
          city
        )
      `)
      .in('blood_group', acceptableRequestGroups)
      .not('status', 'in', '("Fulfilled","Cancelled","Expired")')
      .order('created_at', { ascending: false });

    if (reqErr) {
      return res.status(400).json({ success: false, message: reqErr.message });
    }

    // 4. Fetch existing responses by this donor
    const { data: responses } = await supabase
      .from('donor_responses')
      .select('request_id, status')
      .eq('donor_id', req.user.id);

    const responseMap = {};
    (responses || []).forEach(r => {
      responseMap[r.request_id] = r.status;
    });

    const formattedRequests = (requests || []).map(r => ({
      ...r,
      _id: r.id,
      patientName: r.patient_name,
      bloodGroup: r.blood_group,
      unitsNeeded: r.units_needed,
      requiredDate: r.required_date,
      hospitalName: r.hospital_name,
      hospitalAddress: r.hospital_address,
      contactPerson: r.contact_person,
      contactPhone: r.contact_phone,
      emergencyLevel: r.emergency_level,
      emergencyDescription: r.emergency_description,
      myResponseStatus: responseMap[r.id] || 'pending',
      requester: r.requester ? { ...r.requester, _id: r.requester.id } : null
    }));

    res.json({
      success: true,
      requests: formattedRequests,
      count: formattedRequests.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Donor accept or decline request
// @route   POST /api/donors/requests/:id/respond
// @access  Private (Donor)
exports.respondToRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { status, notes } = req.body; // 'accepted' or 'declined'
    const donorId = req.user.id;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid response status' });
    }

    // 1. Find request
    const { data: bloodRequest, error: reqErr } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    // 2. Upsert donor response
    const { data: responseRecord, error: respErr } = await supabase
      .from('donor_responses')
      .upsert({
        request_id: requestId,
        donor_id: donorId,
        status,
        notes: notes || '',
        responded_at: new Date().toISOString()
      }, { onConflict: 'request_id,donor_id' })
      .select('*')
      .single();

    if (respErr) {
      return res.status(400).json({ success: false, message: respErr.message });
    }

    // 3. If accepted, update request status and notify requester
    if (status === 'accepted') {
      if (['Pending', 'Matching'].includes(bloodRequest.status)) {
        await supabase
          .from('blood_requests')
          .update({ status: 'Donor Responded' })
          .eq('id', requestId);
      }

      await supabase
        .from('notifications')
        .insert({
          recipient_id: bloodRequest.requester_id,
          title: 'Donor Accepted Your Blood Request',
          message: `A donor (${req.user.name}) has accepted your ${bloodRequest.blood_group} request for ${bloodRequest.patient_name}.`,
          type: 'request_accepted',
          related_id: requestId,
          is_read: false
        });

      if (bloodRequest.hospital_id) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: bloodRequest.hospital_id,
            title: 'Donor Accepted Blood Request',
            message: `Donor ${req.user.name} accepted request for ${bloodRequest.patient_name} (${bloodRequest.blood_group}).`,
            type: 'request_accepted',
            related_id: requestId,
            is_read: false
          });
      }
    } else if (status === 'declined') {
      await supabase
        .from('notifications')
        .insert({
          recipient_id: bloodRequest.requester_id,
          title: 'Donor Declined Request',
          message: `A candidate donor declined the request for ${bloodRequest.patient_name}. System continues matching.`,
          type: 'request_declined',
          related_id: requestId,
          is_read: false
        });
    }

    // Socket broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(bloodRequest.requester_id.toString()).emit('request_updated', {
        ...bloodRequest,
        status: status === 'accepted' ? 'Donor Responded' : bloodRequest.status
      });
    }

    await logActivity(donorId, 'DONOR_RESPONDED', 'blood_requests', requestId, `Status: ${status}`);

    res.json({
      success: true,
      message: `Request successfully ${status}. ${status === 'accepted' ? 'Hospital/Requester has been notified for coordination.' : ''}`,
      response: {
        ...responseRecord,
        _id: responseRecord.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor donation history & stats
// @route   GET /api/donors/history
// @access  Private (Donor)
exports.getDonationHistory = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    // Responses with joined blood requests
    const { data: responses, error: respErr } = await supabase
      .from('donor_responses')
      .select(`
        *,
        request:request_id (
          id,
          patient_name,
          blood_group,
          hospital_name,
          city,
          status,
          requester:requester_id (
            id,
            name,
            phone,
            email
          )
        )
      `)
      .eq('donor_id', donorId)
      .order('responded_at', { ascending: false });

    // Donation records
    const { data: records, error: recErr } = await supabase
      .from('donation_records')
      .select(`
        *,
        request:request_id (
          id,
          patient_name,
          hospital_name
        ),
        verifiedBy:verified_by (
          id,
          name,
          role
        )
      `)
      .eq('donor_id', donorId)
      .order('donated_at', { ascending: false });

    const respList = responses || [];
    const recList = records || [];

    const acceptedCount = respList.filter(r => r.status === 'accepted').length;
    const declinedCount = respList.filter(r => r.status === 'declined').length;
    const verifiedDonationsCount = recList.filter(r => r.verification_status === 'Verified').length;

    const formattedResponses = respList.map(r => ({
      ...r,
      _id: r.id,
      request: r.request ? {
        ...r.request,
        _id: r.request.id,
        patientName: r.request.patient_name,
        bloodGroup: r.request.blood_group,
        hospitalName: r.request.hospital_name,
        requester: r.request.requester ? { ...r.request.requester, _id: r.request.requester.id } : null
      } : null
    }));

    const formattedDonations = recList.map(d => ({
      ...d,
      _id: d.id,
      unitsDonated: d.units_donated,
      donatedAt: d.donated_at,
      verificationStatus: d.verification_status,
      verifiedBy: d.verifiedBy ? { ...d.verifiedBy, _id: d.verifiedBy.id } : null,
      request: d.request ? { ...d.request, _id: d.request.id } : null
    }));

    res.json({
      success: true,
      stats: {
        totalReceived: respList.length,
        acceptedRequests: acceptedCount,
        declinedRequests: declinedCount,
        verifiedDonations: verifiedDonationsCount
      },
      responses: formattedResponses,
      donations: formattedDonations
    });
  } catch (error) {
    next(error);
  }
};
