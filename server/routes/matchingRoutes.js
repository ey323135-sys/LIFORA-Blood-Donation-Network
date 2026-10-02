const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { matchDonorsForRequest } = require('../services/matchingEngine');
const { protect } = require('../middleware/authMiddleware');

router.get('/:requestId', protect, async (req, res, next) => {
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

    res.json({
      success: true,
      requestId: bloodRequest.id,
      patientName: bloodRequest.patient_name,
      bloodGroup: bloodRequest.blood_group,
      city: bloodRequest.city,
      totalMatched: matchResult.candidates.length,
      candidates: matchResult.candidates.map(c => ({
        donorId: c.donorUserId,
        donorName: c.donorUser.name,
        bloodGroup: c.bloodGroup,
        city: c.donorUser.city,
        state: c.donorUser.state,
        matchScore: c.matchScore,
        approximateDistanceKm: c.approximateDistanceKm,
        compatibilityNote: c.compatibilityNote
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
