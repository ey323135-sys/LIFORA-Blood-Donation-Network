import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import BloodGroupBadge from '../components/BloodGroupBadge';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { 
  Plus, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Phone, 
  User, 
  AlertCircle,
  Loader2,
  Users,
  Search
} from 'lucide-react';

export default function RequesterDashboard() {
  const { user } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // New Request Form state
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsNeeded: 1,
    requiredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    city: user?.city || '',
    state: user?.state || '',
    hospitalName: '',
    hospitalAddress: '',
    contactPerson: user?.name || '',
    contactPhone: user?.phone || '',
    emergencyLevel: 'Urgent',
    emergencyDescription: ''
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests({ requesterOnly: 'true' });
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await requestService.createRequest(form);
      if (res.success) {
        setCreateModalOpen(false);
        await loadRequests();
        alert(`Request created successfully! Matched ${res.matchSummary?.totalMatched || 0} candidate donors!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      const res = await requestService.cancelRequest(requestId);
      if (res.success) {
        loadRequests();
      }
    } catch (err) {
      alert(err.message || 'Cancel failed');
    }
  };

  const handleViewDetails = async (requestId) => {
    try {
      const res = await requestService.getRequestById(requestId);
      if (res.success) {
        setSelectedRequestDetails(res);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      alert('Could not fetch request details.');
    }
  };

  const totalReq = requests.length;
  const activeReq = requests.filter(r => ['Pending', 'Matching', 'Donor Responded', 'In Coordination'].includes(r.status)).length;
  const completedReq = requests.filter(r => r.status === 'Fulfilled').length;
  const cancelledReq = requests.filter(r => r.status === 'Cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Requester Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your emergency blood requests and track real-time donor matching progress.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary text-xs font-bold flex items-center gap-2 shadow-xl shadow-red-600/30"
        >
          <Plus className="w-4 h-4" /> Create Emergency Request
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Requests" value={totalReq} icon={Activity} color="blue" />
        <StatsCard title="Active & Matching" value={activeReq} subtitle="In donor outreach" icon={Clock} color="amber" />
        <StatsCard title="Fulfilled" value={completedReq} subtitle="Verified donations" icon={CheckCircle2} color="emerald" />
        <StatsCard title="Cancelled" value={cancelledReq} icon={XCircle} color="purple" />
      </div>

      {/* Requests Listing */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">Your Submitted Emergency Requests</h2>
          <span className="text-xs text-slate-400 font-medium">{requests.length} Requests Total</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            <span className="text-xs">Fetching requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">You have not submitted any emergency blood requests yet.</p>
            <button onClick={() => setCreateModalOpen(true)} className="btn-primary text-xs !py-2.5">
              Submit Your First Blood Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req._id} className="glass-card p-6 space-y-4 border-slate-800 relative">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'Fulfilled' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : req.status === 'Donor Responded'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : req.status === 'Cancelled'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white">{req.patientName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" /> {req.hospitalName} ({req.city})
                    </p>
                  </div>
                  <BloodGroupBadge bloodGroup={req.bloodGroup} size="lg" />
                </div>

                {/* Info Box */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl space-y-2 text-xs text-slate-300 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Required Units:</span>
                    <span className="font-bold text-white">{req.unitsNeeded} Units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Date:</span>
                    <span className="font-medium text-white">{new Date(req.requiredDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Matched Donors:</span>
                    <span className="font-bold text-emerald-400">{req.matchedDonors?.length || 0} Candidates Alerted</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleViewDetails(req._id)}
                    className="btn-secondary text-xs flex-1 !py-2 justify-center"
                  >
                    View Matching Donors ({req.matchedDonors?.length || 0})
                  </button>

                  {['Pending', 'Matching', 'Donor Responded'].includes(req.status) && (
                    <button
                      onClick={() => handleCancelRequest(req._id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Emergency Request */}
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        title="Create Emergency Blood Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Patient Name or Case Reference *</label>
              <input
                type="text"
                required
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="e.g. Patient Eleanor Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Blood Group Required *</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Units Needed *</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={form.unitsNeeded}
                onChange={(e) => setForm({ ...form, unitsNeeded: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Required Date *</label>
              <input
                type="date"
                required
                value={form.requiredDate}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Urgency Level</label>
              <select
                value={form.emergencyLevel}
                onChange={(e) => setForm({ ...form, emergencyLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Critical">Critical (Immediate Operation)</option>
                <option value="Urgent">Urgent (Within 24 Hours)</option>
                <option value="Standard">Standard Reserve</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City Location *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                value={form.hospitalName}
                onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                placeholder="e.g. Metro Care Super Specialty Hospital"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Hospital Full Address *</label>
            <input
              type="text"
              required
              value={form.hospitalAddress}
              onChange={(e) => setForm({ ...form, hospitalAddress: e.target.value })}
              placeholder="Building, Street, Landmark, Ward number"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Relative or Doctor name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+1 800-555-0199"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Emergency Description / Case Summary</label>
            <textarea
              rows={3}
              value={form.emergencyDescription}
              onChange={(e) => setForm({ ...form, emergencyDescription: e.target.value })}
              placeholder="Describe surgical situation, ICU reference, or urgency reason..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none resize-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Matching Donors...
                </span>
              ) : (
                'Submit & Run Matching Engine'
              )}
            </button>
          </div>

        </form>
      </Modal>

      {/* Modal: View Request Details & Donor Responses */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Emergency Request Details & Donor Responses"
        maxWidth="max-w-3xl"
      >
        {selectedRequestDetails && (
          <div className="space-y-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-white">{selectedRequestDetails.request.patientName}</h4>
                <BloodGroupBadge bloodGroup={selectedRequestDetails.request.bloodGroup} size="md" />
              </div>
              <p className="text-slate-400">Hospital: {selectedRequestDetails.request.hospitalName}, {selectedRequestDetails.request.city}</p>
              <p className="text-slate-400">Required: {selectedRequestDetails.request.unitsNeeded} Units by {new Date(selectedRequestDetails.request.requiredDate).toLocaleDateString()}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
                Donor Responses ({selectedRequestDetails.donorResponses?.length || 0})
              </h4>

              {selectedRequestDetails.donorResponses?.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-400">
                  No donors have responded yet. The matching engine will continue sending alerts.
                </div>
              ) : (
                selectedRequestDetails.donorResponses.map((resp) => (
                  <div key={resp._id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{resp.donor?.name || 'Volunteer Donor'}</span>
                      <span className="text-[11px] text-slate-400">City: {resp.donor?.city} • Contact: {resp.donor?.phone}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      resp.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {resp.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
