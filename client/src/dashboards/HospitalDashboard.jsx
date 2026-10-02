import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { hospitalService } from '../services/hospitalService';
import { requestService } from '../services/requestService';
import BloodGroupBadge from '../components/BloodGroupBadge';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { 
  Building2, 
  Activity, 
  Users, 
  CheckCircle2, 
  Plus, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Clock,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function HospitalDashboard() {
  const { user, profile: roleProfile } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);
  
  // Verification Modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    requestId: '',
    donorId: '',
    donorName: '',
    unitsDonated: 1,
    notes: 'Clinical donation verified by hospital medical staff.'
  });
  const [verifying, setVerifying] = useState(false);

  // New Request Form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsNeeded: 1,
    requiredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    city: user?.city || '',
    state: user?.state || '',
    hospitalName: roleProfile?.hospital_name || user?.name || '',
    hospitalAddress: roleProfile?.address || '',
    contactPerson: roleProfile?.contact_person || user?.name || '',
    contactPhone: roleProfile?.phone || user?.phone || '',
    emergencyLevel: 'Urgent',
    emergencyDescription: ''
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  // Sync form defaults when user/roleProfile loads
  useEffect(() => {
    if (user || roleProfile) {
      setReqForm(prev => ({
        ...prev,
        city: prev.city || user?.city || '',
        state: prev.state || user?.state || '',
        hospitalName: prev.hospitalName || roleProfile?.hospital_name || user?.name || '',
        hospitalAddress: prev.hospitalAddress || roleProfile?.address || '',
        contactPerson: prev.contactPerson || roleProfile?.contact_person || user?.name || '',
        contactPhone: prev.contactPhone || roleProfile?.phone || user?.phone || ''
      }));
    }
  }, [user, roleProfile]);

  const loadData = async () => {
    try {
      const statsRes = await hospitalService.getDashboardStats();
      if (statsRes.success) {
        setDashboardData(statsRes);
      }

      const reqRes = await requestService.getRequests({ hospitalOnly: 'true' });
      if (reqRes.success) {
        setRequests(reqRes.requests);
      }
    } catch (err) {
      console.error('Failed to load hospital dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFetchMatches = async (requestId) => {
    setLoadingMatches(true);
    setMatchesModalOpen(true);
    try {
      const res = await hospitalService.getRequestMatches(requestId);
      if (res.success) {
        setSelectedMatches(res);
      }
    } catch (err) {
      alert('Error fetching candidate matches');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleOpenVerifyModal = (requestId, donorId, donorName) => {
    setVerifyForm({
      requestId,
      donorId,
      donorName,
      unitsDonated: 1,
      notes: 'Clinical donation verified by hospital staff.'
    });
    setVerifyModalOpen(true);
  };

  const handleVerifyDonation = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await hospitalService.verifyDonation(verifyForm);
      if (res.success) {
        setVerifyModalOpen(false);
        setMatchesModalOpen(false);
        await loadData();
        alert(res.message);
      }
    } catch (err) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      const res = await requestService.createRequest(reqForm);
      if (res.success) {
        setCreateModalOpen(false);
        await loadData();
        alert(`Hospital Blood Request Created! Alerted ${res.matchSummary?.totalMatched || 0} candidate donors!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create request');
    } finally {
      setSubmittingReq(false);
    }
  };

  const stats = dashboardData?.stats || {
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    donorMatches: 0,
    pendingDonorResponses: 0,
    acceptedDonorResponses: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Verified Medical Facility
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {dashboardData?.hospitalProfile?.hospitalName || 'Hospital Emergency Portal'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            License: {dashboardData?.hospitalProfile?.registrationNo || 'LIC-VERIFIED'} • {dashboardData?.hospitalProfile?.address}
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary text-xs font-bold flex items-center gap-2 shadow-xl shadow-red-600/30"
        >
          <Plus className="w-4 h-4" /> Create Emergency Request
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Hospital Requests" value={stats.totalRequests} icon={Activity} color="blue" />
        <StatsCard title="Active Emergency Cases" value={stats.activeRequests} icon={Clock} color="amber" />
        <StatsCard title="Accepted Donors" value={stats.acceptedDonorResponses} subtitle="Ready for donation" icon={CheckCircle2} color="emerald" />
        <StatsCard title="Completed & Verified" value={stats.completedRequests} icon={ShieldCheck} color="purple" />
      </div>

      {/* Hospital Request Listing */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">Emergency Requests & Donor Candidate Engine</h2>
          <span className="text-xs text-slate-400">{requests.length} Requests Found</span>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No active hospital requests.</p>
            <button onClick={() => setCreateModalOpen(true)} className="btn-primary text-xs !py-2.5">
              Create Emergency Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req._id} className="glass-card p-6 space-y-4 border-slate-800 relative">
                
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'Fulfilled' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white">{req.patientName}</h3>
                    <p className="text-xs text-slate-400">Target Date: {new Date(req.requiredDate).toLocaleDateString()}</p>
                  </div>
                  <BloodGroupBadge bloodGroup={req.bloodGroup} size="lg" />
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl space-y-2 text-xs text-slate-300 border border-slate-850">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Units Required:</span>
                    <span className="font-bold text-white">{req.unitsNeeded} Units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Emergency Level:</span>
                    <span className="font-bold text-red-400">{req.emergencyLevel}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleFetchMatches(req._id)}
                    className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" /> View Donor Matches & Verification
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Matched Donor Candidates */}
      <Modal
        isOpen={matchesModalOpen}
        onClose={() => setMatchesModalOpen(false)}
        title="Preliminary Donor Matches (Privacy-Safe View)"
        maxWidth="max-w-4xl"
      >
        {loadingMatches ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs">Running compatibility engine & distance calculations...</span>
          </div>
        ) : selectedMatches ? (
          <div className="space-y-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Target Patient Request</span>
                <h4 className="font-bold text-base text-white">{selectedMatches.patientName}</h4>
              </div>
              <BloodGroupBadge bloodGroup={selectedMatches.bloodGroup} size="lg" />
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
                Matched Candidates ({selectedMatches.candidates.length})
              </h4>

              {selectedMatches.candidates.length === 0 ? (
                <div className="p-6 text-center text-slate-400 glass-card">
                  No matching donors available in this city right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMatches.candidates.map((candidate) => (
                    <div key={candidate.donorId} className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{candidate.donorName}</span>
                          <BloodGroupBadge bloodGroup={candidate.bloodGroup} size="sm" />
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-semibold border border-sky-500/30">
                            {candidate.compatibilityNote}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>City: {candidate.city}</span>
                          {candidate.approximateDistanceKm && (
                            <span className="text-emerald-400 font-semibold">~{candidate.approximateDistanceKm} km away</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Contact Info: <span className="font-mono text-slate-200">{candidate.phone}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          candidate.responseStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {candidate.responseStatus === 'accepted' ? 'Accepted' : 'Pending Response'}
                        </span>

                        {candidate.responseStatus === 'accepted' && (
                          <button
                            onClick={() => handleOpenVerifyModal(selectedMatches.requestId, candidate.donorId, candidate.donorName)}
                            className="btn-primary text-xs !py-1.5 !px-3"
                          >
                            Verify Clinical Donation
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}
      </Modal>

      {/* Modal: Verify Donation */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verify Clinical Blood Donation"
      >
        <form onSubmit={handleVerifyDonation} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            Confirm that donor <span className="font-bold">{verifyForm.donorName}</span> has completed physical blood donation at the hospital facility.
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Units Donated</label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={verifyForm.unitsDonated}
              onChange={(e) => setVerifyForm({ ...verifyForm, unitsDonated: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Verification Clinical Notes</label>
            <textarea
              rows={3}
              value={verifyForm.notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setVerifyModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={verifying} className="btn-primary text-xs">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Mark Request Fulfilled'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Hospital Create Request */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Hospital Emergency Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Patient Reference Name *</label>
              <input
                type="text"
                required
                value={reqForm.patientName}
                onChange={(e) => setReqForm({ ...reqForm, patientName: e.target.value })}
                placeholder="e.g. ICU Trauma Patient #99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Blood Group Required *</label>
              <select
                value={reqForm.bloodGroup}
                onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Units Needed *</label>
              <input
                type="number"
                min="1"
                required
                value={reqForm.unitsNeeded}
                onChange={(e) => setReqForm({ ...reqForm, unitsNeeded: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={reqForm.requiredDate}
                onChange={(e) => setReqForm({ ...reqForm, requiredDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Urgency</label>
              <select
                value={reqForm.emergencyLevel}
                onChange={(e) => setReqForm({ ...reqForm, emergencyLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              >
                <option value="Critical">Critical Emergency</option>
                <option value="Urgent">Urgent Reserve</option>
                <option value="Standard">Standard Operation</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={submittingReq} className="btn-primary text-xs">
              {submittingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Emergency Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
