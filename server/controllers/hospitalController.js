const { supabase } = require('../config/supabase');
const { matchDonorsForRequest } = require('../services/matchingEngine');
const { logActivity } = require('../services/auditService');

// @desc    Get Hospital dashboard stats
// @route   GET /api/hospitals/dashboard
// @access  Private (Hospital)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const hospitalUserId = req.user.id;

    // Get hospital profile
    const { data: hospitalProfile } = await supabase
      .from('hospitals')
      .select('*')
      .eq('user_id', hospitalUserId)
      .maybeSingle();

    // Requests associated with this hospital or created by this hospital
    const { data: requests, error: reqErr } = await supabase
      .from('blood_requests')
      .select('*')
      .or(`hospital_id.eq.${hospitalUserId},requester_id.eq.${hospitalUserId},city.eq.${req.user.city || ''}`)
      .order('created_at', { ascending: false });

    if (reqErr) {
      return res.status(400).json({ success: false, message: reqErr.message });
    }

    const reqList = requests || [];
    const totalRequests = reqList.length;
    const activeRequests = reqList.filter(r => ['Pending', 'Matching', 'Donor Responded', 'In Coordination'].includes(r.status)).length;
    const completedRequests = reqList.filter(r => r.status === 'Fulfilled').length;

    // Get donor responses for these requests
    const requestIds = reqList.map(r => r.id);
    let donorResponses = [];
    if (requestIds.length > 0) {
      const { data: responses } = await supabase
        .from('donor_responses')
        .select(`
          *,
          donor:donor_id (
            id,
            name,
            phone,
            email,
            city
          )
        `)
        .in('request_id', requestIds);
      donorResponses = responses || [];
    }

    const pendingResponses = donorResponses.filter(dr => dr.status === 'pending').length;
    const acceptedResponses = donorResponses.filter(dr => dr.status === 'accepted').length;

    const formattedRequests = reqList.slice(0, 5).map(r => ({
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
      stats: {
        totalRequests,
        activeRequests,
        completedRequests,
        donorMatches: donorResponses.length,
        pendingDonorResponses: pendingResponses,
        acceptedDonorResponses: acceptedResponses
      },
      hospitalProfile: hospitalProfile ? { ...hospitalProfile, _id: hospitalProfile.id } : null,
      recentRequests: formattedRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get matched candidate donors for a request
// @route   GET /api/hospitals/matches/:requestId
// @access  Private (Hospital, Admin)
exports.getRequestMatches = async (req, res, next) => {
  try {
    const { data: bloodRequest, error } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.requestId)
      .maybeSingle();

    if (error || !bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const matchResult = await matchDonorsForRequest(bloodRequest);

    // Fetch existing responses for this specific request
    const { data: responses } = await supabase
      .from('donor_responses')
      .select('*')
      .eq('request_id', bloodRequest.id);

    const responseMap = {};
    (responses || []).forEach(r => {
      responseMap[r.donor_id] = { status: r.status, respondedAt: r.responded_at, notes: r.notes };
    });

    const enrichedCandidates = matchResult.candidates.map(candidate => {
      const resp = responseMap[candidate.donorUserId];
      const isAccepted = resp && resp.status === 'accepted';

      return {
        donorId: candidate.donorUserId,
        donorName: candidate.donorUser.name,
        // Privacy protection: Mask until donor accepts the request
        phone: isAccepted ? candidate.donorUser.phone : '••• ••• •••• (Acceptance Required)',
        email: isAccepted ? candidate.donorUser.email : '•••••@protected.org',
        bloodGroup: candidate.bloodGroup,
        city: candidate.donorUser.city,
        state: candidate.donorUser.state,
        matchScore: candidate.matchScore,
        approximateDistanceKm: candidate.approximateDistanceKm,
        compatibilityNote: candidate.compatibilityNote,
        responseStatus: resp ? resp.status : 'pending',
        respondedAt: resp ? resp.respondedAt : null
      };
    });

    res.json({
      success: true,
      requestId: bloodRequest.id,
      patientName: bloodRequest.patient_name,
      bloodGroup: bloodRequest.blood_group,
      totalMatched: enrichedCandidates.length,
      candidates: enrichedCandidates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record and verify clinical donation completion
// @route   POST /api/hospitals/verify-donation
// @access  Private (Hospital, Admin)
exports.verifyDonation = async (req, res, next) => {
  try {
    const { requestId, donorId, unitsDonated = 1, notes = '' } = req.body;

    if (!requestId || !donorId) {
      return res.status(400).json({ success: false, message: 'Request ID and Donor ID are required' });
    }

    const hospitalId = req.user.id;

    // 1. Insert donation record
    const { data: record, error: recError } = await supabase
      .from('donation_records')
      .insert({
        request_id: requestId,
        donor_id: donorId,
        hospital_id: hospitalId,
        units_donated: Number(unitsDonated) || 1,
        verification_status: 'Verified',
        verified_by: hospitalId,
        notes: notes || 'Clinical donation verified by hospital staff'
      })
      .select('*')
      .single();

    if (recError) {
      return res.status(400).json({ success: false, message: recError.message });
    }

    // 2. Mark blood request as fulfilled
    await supabase
      .from('blood_requests')
      .update({ status: 'Fulfilled' })
      .eq('id', requestId);

    // 3. Increment donor donation count
    const { data: currentDonor } = await supabase
      .from('donor_profiles')
      .select('total_donations')
      .eq('user_id', donorId)
      .maybeSingle();

    if (currentDonor) {
      await supabase
        .from('donor_profiles')
        .update({
          total_donations: (currentDonor.total_donations || 0) + (Number(unitsDonated) || 1),
          last_donated_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', donorId);
    }

    // 4. Send thank you & confirmation notification to donor
    await supabase
      .from('notifications')
      .insert({
        recipient_id: donorId,
        title: 'Donation Verified – Thank You!',
        message: `Your donation of ${unitsDonated} unit(s) has been officially verified by ${req.user.name}. You saved a life today!`,
        type: 'status_updated',
        related_id: requestId,
        is_read: false
      });

    await logActivity(hospitalId, 'DONATION_VERIFIED', 'donation_records', record.id, `Donor: ${donorId}, Units: ${unitsDonated}`);

    res.status(201).json({
      success: true,
      message: 'Donation verified successfully! Donor profile updated and request marked fulfilled.',
      record: {
        ...record,
        _id: record.id
      }
    });
  } catch (error) {
    next(error);
  }
};
