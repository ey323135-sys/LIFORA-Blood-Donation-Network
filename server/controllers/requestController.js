const { supabase } = require('../config/supabase');
const { matchDonorsForRequest } = require('../services/matchingEngine');
const { logActivity } = require('../services/auditService');

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private (Requester, Hospital, Admin)
exports.createRequest = async (req, res, next) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsNeeded,
      requiredDate,
      city,
      state,
      hospitalName,
      hospitalAddress,
      contactPerson,
      contactPhone,
      emergencyLevel,
      emergencyDescription,
      additionalNotes,
      lat,
      lng
    } = req.body;

    if (!patientName || !bloodGroup || !requiredDate || !city || !hospitalName || !hospitalAddress || !contactPerson || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory blood request fields.' });
    }

    const io = req.app.get('io');
    const requesterId = req.user.id;
    const hospitalId = req.user.role === 'hospital' ? req.user.id : null;

    // 1. Insert into blood_requests
    const { data: bloodRequest, error: insertError } = await supabase
      .from('blood_requests')
      .insert({
        requester_id: requesterId,
        hospital_id: hospitalId,
        patient_name: patientName,
        blood_group: bloodGroup,
        units_needed: Number(unitsNeeded) || 1,
        required_date: new Date(requiredDate).toISOString(),
        city,
        state: state || '',
        hospital_name: hospitalName,
        hospital_address: hospitalAddress,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        emergency_level: emergencyLevel || 'Urgent',
        emergency_description: emergencyDescription || '',
        additional_notes: additionalNotes || '',
        status: 'Matching',
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null
      })
      .select('*')
      .single();

    if (insertError) {
      return res.status(400).json({ success: false, message: insertError.message });
    }

    // 2. Run Donor Matching Engine!
    const matchResult = await matchDonorsForRequest(bloodRequest, io);

    // 3. Update matched_donors array
    const finalStatus = matchResult.matchedUserIds.length === 0 ? 'Pending' : 'Matching';
    await supabase
      .from('blood_requests')
      .update({
        matched_donors: matchResult.matchedUserIds,
        status: finalStatus
      })
      .eq('id', bloodRequest.id);

    bloodRequest.matched_donors = matchResult.matchedUserIds;
    bloodRequest.status = finalStatus;

    await logActivity(requesterId, 'CREATE_BLOOD_REQUEST', 'blood_requests', bloodRequest.id, `Units: ${unitsNeeded}, Group: ${bloodGroup}`);

    res.status(201).json({
      success: true,
      message: `Emergency blood request created. Found ${matchResult.candidates.length} potential donor matches!`,
      request: {
        ...bloodRequest,
        _id: bloodRequest.id,
        patientName: bloodRequest.patient_name,
        bloodGroup: bloodRequest.blood_group,
        unitsNeeded: bloodRequest.units_needed,
        requiredDate: bloodRequest.required_date,
        hospitalName: bloodRequest.hospital_name,
        hospitalAddress: bloodRequest.hospital_address,
        contactPerson: bloodRequest.contact_person,
        contactPhone: bloodRequest.contact_phone,
        emergencyLevel: bloodRequest.emergency_level,
        emergencyDescription: bloodRequest.emergency_description
      },
      matchSummary: {
        totalMatched: matchResult.totalMatched,
        candidates: matchResult.candidates.map(c => ({
          donorId: c.donorUserId,
          name: c.donorUser.name,
          bloodGroup: c.bloodGroup,
          city: c.donorUser.city,
          matchScore: c.matchScore,
          approximateDistanceKm: c.approximateDistanceKm,
          compatibilityNote: c.compatibilityNote
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all blood requests (with filter params)
// @route   GET /api/requests
// @access  Public / Private
exports.getRequests = async (req, res, next) => {
  try {
    const { status, bloodGroup, city, requesterOnly, hospitalOnly } = req.query;

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (bloodGroup) query = query.eq('blood_group', bloodGroup);
    if (city) query = query.ilike('city', `%${city}%`);

    if (req.user) {
      if (requesterOnly === 'true' || req.user.role === 'requester') {
        query = query.eq('requester_id', req.user.id);
      } else if (hospitalOnly === 'true' || req.user.role === 'hospital') {
        query = query.or(`hospital_id.eq.${req.user.id},requester_id.eq.${req.user.id}`);
      }
    }

    const { data: requests, error } = await query;

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
      hospitalAddress: r.hospital_address,
      contactPerson: r.contact_person,
      contactPhone: r.contact_phone,
      emergencyLevel: r.emergency_level,
      emergencyDescription: r.emergency_description,
      additionalNotes: r.additional_notes,
      requester: r.requester ? { ...r.requester, _id: r.requester.id } : null
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

// @desc    Get request by ID with responses & matches
// @route   GET /api/requests/:id
// @access  Private
exports.getRequestById = async (req, res, next) => {
  try {
    const { data: bloodRequest, error } = await supabase
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
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    // Fetch responses for this request
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
      .eq('request_id', bloodRequest.id);

    const formattedResponses = (responses || []).map(resp => ({
      ...resp,
      _id: resp.id,
      donor: resp.donor ? { ...resp.donor, _id: resp.donor.id } : null
    }));

    res.json({
      success: true,
      request: {
        ...bloodRequest,
        _id: bloodRequest.id,
        patientName: bloodRequest.patient_name,
        bloodGroup: bloodRequest.blood_group,
        unitsNeeded: bloodRequest.units_needed,
        requiredDate: bloodRequest.required_date,
        hospitalName: bloodRequest.hospital_name,
        hospitalAddress: bloodRequest.hospital_address,
        contactPerson: bloodRequest.contact_person,
        contactPhone: bloodRequest.contact_phone,
        emergencyLevel: bloodRequest.emergency_level,
        emergencyDescription: bloodRequest.emergency_description,
        additionalNotes: bloodRequest.additional_notes,
        requester: bloodRequest.requester ? { ...bloodRequest.requester, _id: bloodRequest.requester.id } : null,
        responses: formattedResponses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status
// @route   PATCH /api/requests/:id/status
// @access  Private (Requester, Hospital, Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Matching', 'Donor Responded', 'Hospital Verification', 'In Coordination', 'Fulfilled', 'Cancelled', 'Expired'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    await logActivity(req.user.id, 'REQUEST_STATUS_UPDATED', 'blood_requests', updated.id, `Status: ${status}`);

    res.json({
      success: true,
      message: `Request status updated to ${status}`,
      request: {
        ...updated,
        _id: updated.id,
        patientName: updated.patient_name,
        bloodGroup: updated.blood_group
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel request
// @route   DELETE /api/requests/:id
// @access  Private (Requester, Admin)
exports.cancelRequest = async (req, res, next) => {
  try {
    const { data: bloodRequest, error } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    // Permission check
    if (bloodRequest.requester_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request' });
    }

    const { data: cancelled, error: updateErr } = await supabase
      .from('blood_requests')
      .update({ status: 'Cancelled' })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(400).json({ success: false, message: updateErr.message });
    }

    await logActivity(req.user.id, 'CANCEL_BLOOD_REQUEST', 'blood_requests', req.params.id);

    res.json({ success: true, message: 'Blood request cancelled successfully', request: cancelled });
  } catch (error) {
    next(error);
  }
};
