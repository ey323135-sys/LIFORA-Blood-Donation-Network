const { supabase } = require('../config/supabase');
const { calculateDistance } = require('../utils/distanceCalculator');

// Medical Blood Compatibility Matrix (Donor -> Acceptable Recipients)
const COMPATIBILITY_RULES = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/**
 * Finds compatible donors for a blood request
 * @param {Object} bloodRequest - The request object (id, blood_group, city, lat, lng, etc.)
 * @param {Object} io - Optional Socket.IO instance for real-time notification broadcasts
 */
const matchDonorsForRequest = async (bloodRequest, io = null) => {
  try {
    const targetBloodGroup = bloodRequest.blood_group || bloodRequest.bloodGroup;
    const targetCity = (bloodRequest.city || '').toLowerCase().trim();
    const reqLat = Number(bloodRequest.lat) || null;
    const reqLng = Number(bloodRequest.lng) || null;

    // 1. Identify all donor blood groups that CAN donate to targetBloodGroup
    const compatibleDonorGroups = Object.keys(COMPATIBILITY_RULES).filter(donorGroup => 
      COMPATIBILITY_RULES[donorGroup].includes(targetBloodGroup)
    );

    if (compatibleDonorGroups.length === 0) {
      return { totalMatched: 0, candidates: [], matchedUserIds: [] };
    }

    // 2. Query available donors with compatible blood groups from Supabase
    const { data: donorRecords, error } = await supabase
      .from('donor_profiles')
      .select(`
        id,
        user_id,
        blood_group,
        city,
        state,
        is_available,
        lat,
        lng,
        total_donations,
        profiles:user_id (
          id,
          name,
          email,
          phone,
          city,
          state,
          role,
          status,
          is_verified
        )
      `)
      .in('blood_group', compatibleDonorGroups)
      .eq('is_available', true);

    if (error) {
      console.error('[MatchingEngine Error]: Supabase query failed:', error.message);
      return { totalMatched: 0, candidates: [], matchedUserIds: [] };
    }

    // 3. Filter active users
    const validDonors = (donorRecords || []).filter(item => {
      const u = item.profiles;
      return u && u.status === 'active';
    });

    // 4. Score and calculate distance for candidates
    const candidates = validDonors.map(record => {
      const u = record.profiles;
      const isExactMatch = record.blood_group === targetBloodGroup;
      const donorCity = (record.city || u.city || '').toLowerCase().trim();
      const isSameCity = Boolean(targetCity && donorCity && targetCity === donorCity);

      // Distance calculation without hardcoded coordinates
      let approximateDistanceKm = null;
      const donorLat = Number(record.lat);
      const donorLng = Number(record.lng);

      if (reqLat && reqLng && donorLat && donorLng) {
        approximateDistanceKm = calculateDistance(donorLat, donorLng, reqLat, reqLng);
        if (approximateDistanceKm !== null) {
          approximateDistanceKm = Math.round(approximateDistanceKm * 10) / 10;
        }
      }

      // Dynamic Matching Score (0 - 100)
      let score = 0;
      if (isExactMatch) score += 40;
      else score += 25; // Compatible group

      if (isSameCity) score += 35;
      else score += 10;

      if (approximateDistanceKm !== null) {
        if (approximateDistanceKm <= 10) score += 25;
        else if (approximateDistanceKm <= 25) score += 20;
        else if (approximateDistanceKm <= 50) score += 12;
        else if (approximateDistanceKm <= 100) score += 5;
      } else if (isSameCity) {
        score += 15; // Proximity bonus based on verified city match
      }

      // Cap at 100
      score = Math.min(100, score);

      const compatibilityNote = isExactMatch 
        ? `Exact Match (${record.blood_group})` 
        : `Compatible Donor (${record.blood_group} for ${targetBloodGroup})`;

      return {
        donorProfileId: record.id,
        donorUserId: u.id,
        donorUser: {
          _id: u.id,
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          city: u.city,
          state: u.state
        },
        bloodGroup: record.blood_group,
        isExactMatch,
        isSameCity,
        matchScore: score,
        approximateDistanceKm,
        compatibilityNote,
        medicalDisclaimer: 'Coordination match only. Transfusion eligibility and crossmatching must be verified clinically.'
      };
    });

    // 5. Sort candidates by matchScore descending
    candidates.sort((a, b) => b.matchScore - a.matchScore);

    const matchedUserIds = candidates.map(c => c.donorUserId);

    // 6. Create in-app notifications for matched donors
    if (matchedUserIds.length > 0) {
      const hospitalName = bloodRequest.hospital_name || bloodRequest.hospitalName || 'Hospital';
      const city = bloodRequest.city || '';
      const requestId = bloodRequest.id || bloodRequest._id;

      const notifications = matchedUserIds.slice(0, 15).map(userId => ({
        recipient_id: userId,
        title: `Emergency Blood Request: ${targetBloodGroup}`,
        message: `Urgent need for ${targetBloodGroup} blood at ${hospitalName}, ${city}. Please respond if available to donate.`,
        type: 'match_found',
        related_id: requestId,
        is_read: false
      }));

      const { data: createdNotifs, error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('*');

      if (notifError) {
        console.warn('[MatchingEngine Warning]: Could not save notification records:', notifError.message);
      } else if (io && createdNotifs) {
        // Broadcast via Socket.IO if connected
        createdNotifs.forEach(notif => {
          io.to(notif.recipient_id.toString()).emit('new_notification', {
            _id: notif.id,
            id: notif.id,
            ...notif
          });
        });
      }
    }

    return {
      totalMatched: candidates.length,
      candidates,
      matchedUserIds
    };
  } catch (error) {
    console.error('[MatchingEngine Error]:', error);
    throw error;
  }
};

module.exports = {
  matchDonorsForRequest,
  COMPATIBILITY_RULES
};
