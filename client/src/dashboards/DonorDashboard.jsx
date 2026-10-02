import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import BloodGroupBadge from '../components/BloodGroupBadge';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { 
  HeartHandshake, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Edit3, 
  Bell, 
  Calendar,
  Check,
  X,
  Loader2,
  Building2,
  Phone,
  AlertCircle
} from 'lucide-react';

export default function DonorDashboard() {
  const { user, profile, refreshProfile } = useContext(AuthContext);
  
  const [donorProfile, setDonorProfile] = useState(profile || null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState({ responses: [], donations: [] });
  const [stats, setStats] = useState({ totalReceived: 0, acceptedRequests: 0, declinedRequests: 0, verifiedDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Profile Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bloodGroup: 'O+',
    city: '',
    state: '',
    isAvailable: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await donorService.getProfile();
      if (profileRes.success) {
        setDonorProfile(profileRes.profile);
        setIsAvailable(profileRes.profile.isAvailable);
        setEditForm({
          bloodGroup: profileRes.profile.bloodGroup,
          city: profileRes.profile.city,
          state: profileRes.profile.state || '',
          isAvailable: profileRes.profile.isAvailable
        });
      }

      const reqRes = await donorService.getIncomingRequests();
      if (reqRes.success) {
        setRequests(reqRes.requests);
      }

      const histRes = await donorService.getHistory();
      if (histRes.success) {
        setHistory({ responses: histRes.responses, donations: histRes.donations });
        setStats(histRes.stats);
      }
    } catch (err) {
      console.error('Error loading donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const nextStatus = !isAvailable;
      const res = await donorService.updateAvailability(nextStatus);
      if (res.success) {
        setIsAvailable(res.isAvailable);
        refreshProfile();
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleRespond = async (requestId, status) => {
    setActionLoading(requestId);
    try {
      const res = await donorService.respondToRequest(requestId, status, 'Ready to donate upon confirmation.');
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await donorService.updateProfile(editForm);
      if (res.success) {
        setDonorProfile(res.profile);
        setIsAvailable(res.profile.isAvailable);
        setEditModalOpen(false);
        refreshProfile();
      }
    } catch (err) {
      alert(err.message || 'Profile update failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading your donor portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user?.name}</h1>
            {donorProfile && <BloodGroupBadge bloodGroup={donorProfile.bloodGroup} size="lg" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            Registered Location: <span className="text-white font-medium">{donorProfile?.city}, {donorProfile?.state}</span>
          </p>
        </div>

        {/* Availability Toggle Switch */}
        <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 w-full md:w-auto justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Donor Status</span>
            <span className={`text-sm font-bold ${isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAvailable ? '● Ready & Available' : '○ Temporarily Offline'}
            </span>
          </div>

          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAvailable 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isAvailable ? 'Set Unavailable' : 'Set Available'}
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition-colors"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Requests Received" 
          value={stats.totalReceived || requests.length} 
          subtitle="Matching blood group" 
          icon={Bell} 
          color="blue"
        />
        <StatsCard 
          title="Accepted Requests" 
          value={stats.acceptedRequests} 
          subtitle="Coordinated responses" 
          icon={CheckCircle2} 
          color="emerald"
        />
        <StatsCard 
          title="Declined Requests" 
          value={stats.declinedRequests} 
          subtitle="Declined by donor" 
          icon={XCircle} 
          color="amber"
        />
        <StatsCard 
          title="Verified Donations" 
          value={stats.verifiedDonations} 
          subtitle="Clinical completions" 
          icon={HeartHandshake} 
          color="purple"
        />
      </div>

      {/* Incoming Requests Feed */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" /> Incoming Matching Emergency Requests
            </h2>
            <p className="text-xs text-slate-400">Emergency blood requests matching your blood group ({donorProfile?.bloodGroup})</p>
          </div>
          <span className="text-xs bg-red-500/20 text-red-400 font-bold px-3 py-1 rounded-full border border-red-500/30">
            {requests.length} Active
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No active emergency requests matching your profile right now.</p>
            <p className="text-xs text-slate-500">We will notify you immediately when a compatible request is published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((reqItem) => (
              <div key={reqItem._id} className="glass-card p-6 space-y-4 border-slate-800/90 relative">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        reqItem.emergencyLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {reqItem.emergencyLevel || 'Urgent'} Emergency
                      </span>
                      <span className="text-[11px] text-slate-400">Ref: #{reqItem._id.substring(reqItem._id.length - 6)}</span>
                    </div>
                    <h3 className="font-bold text-lg text-white">{reqItem.patientName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" /> {reqItem.hospitalName}, {reqItem.city}
                    </p>
                  </div>
                  <BloodGroupBadge bloodGroup={reqItem.bloodGroup} size="lg" />
                </div>

                {/* Details */}
                <div className="bg-slate-950/60 p-3 rounded-xl space-y-2 text-xs text-slate-300 border border-slate-850">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Units Needed:</span>
                    <span className="font-bold text-white">{reqItem.unitsNeeded} Units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Required Date:</span>
                    <span className="font-medium text-white">{new Date(reqItem.requiredDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hospital Location:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">{reqItem.hospitalAddress}</span>
                  </div>
                  {reqItem.emergencyDescription && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Notes:</span> {reqItem.emergencyDescription}
                    </div>
                  )}
                </div>

                {/* Response Action Status */}
                <div className="pt-2 flex items-center justify-between">
                  {reqItem.myResponseStatus === 'accepted' ? (
                    <div className="w-full p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You Accepted This Request
                      </span>
                      <span className="text-[11px] text-emerald-400 underline">Hospital Notified</span>
                    </div>
                  ) : reqItem.myResponseStatus === 'declined' ? (
                    <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-slate-500" /> You Declined
                      </span>
                      <button
                        onClick={() => handleRespond(reqItem._id, 'accepted')}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Change to Accept
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => handleRespond(reqItem._id, 'accepted')}
                        disabled={actionLoading === reqItem._id}
                        className="btn-primary text-xs !py-2.5 flex items-center justify-center gap-1.5"
                      >
                        {actionLoading === reqItem._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleRespond(reqItem._id, 'declined')}
                        disabled={actionLoading === reqItem._id}
                        className="btn-secondary text-xs !py-2.5 flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation History Table */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-bold text-lg text-white">Your Donation Response Log</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Patient Name</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Response Status</th>
                <th className="px-4 py-3 rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {history.responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No past donation history logged.</td>
                </tr>
              ) : (
                history.responses.map((resp) => (
                  <tr key={resp._id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-semibold text-white">{resp.request?.patientName || 'Emergency Request'}</td>
                    <td className="px-4 py-3"><BloodGroupBadge bloodGroup={resp.request?.bloodGroup || 'O+'} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-300">{resp.request?.hospitalName || 'Local Hospital'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        resp.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {resp.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(resp.respondedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title="Edit Verified Donor Profile"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Blood Group</label>
            <select
              value={editForm.bloodGroup}
              onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={editForm.isAvailable}
                onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-red-600"
              />
              <span>I am actively available for emergency donor calls in my city</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Profile Changes
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
