import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Droplet, Loader2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'
];

export default function CompleteProfile() {
  const { user, completeProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const passedUser = location.state?.user || user;

  const [form, setForm] = useState({
    phone: passedUser?.phone || '',
    city: passedUser?.city || '',
    state: passedUser?.state || 'Delhi',
    role: passedUser?.role || 'donor',
    bloodGroup: '', // Explicit selection required; no auto-assigned O+
    dateOfBirth: '',
    isAvailable: false // Explicit opt-in required; no auto-assigned availability
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.city) {
      setError('Phone number and city are required to complete your profile.');
      return;
    }

    if (form.role === 'donor' && !form.bloodGroup) {
      setError('Please select your blood group explicitly. It cannot be auto-assigned.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await completeProfile(form);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          const role = res.user?.role || form.role;
          switch (role) {
            case 'donor': navigate('/dashboard/donor'); break;
            case 'requester': navigate('/dashboard/requester'); break;
            case 'hospital': navigate('/dashboard/hospital'); break;
            case 'bloodbank': navigate('/dashboard/bloodbank'); break;
            default: navigate('/dashboard/donor'); break;
          }
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass-panel p-10 text-center space-y-4 max-w-sm">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
          <h3 className="text-white font-bold text-xl">Profile Initialized!</h3>
          <p className="text-slate-400 text-sm">Navigating to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <Droplet className="w-6 h-6 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
          <p className="text-xs text-slate-400">
            Welcome, <strong className="text-white">{passedUser?.name || 'new member'}</strong>! 
            Please explicitly specify your details before entering the network.
          </p>
        </div>

        <div className="glass-panel p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Medical Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed">
              <strong>Medical Disclaimer:</strong> Online verification is for platform identity only. Clinical eligibility, hemoglobin tests, and crossmatching are conducted independently by attending hospital blood banks prior to donation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Type / Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="donor">Blood Donor (Volunteer)</option>
                <option value="requester">Emergency Requester (Patient Family / Individual)</option>
                <option value="hospital">Hospital Staff / Clinical Administrator</option>
                <option value="bloodbank">Licensed Blood Bank Facility</option>
              </select>
            </div>

            {/* Donor Specific Fields */}
            {form.role === 'donor' && (
              <div className="space-y-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Blood Group <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="bloodGroup"
                    required
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">-- Select Your Verified Blood Group --</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Must be explicitly specified; blood groups are not assumed.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-700 focus:ring-red-500 mt-0.5"
                  />
                  <label htmlFor="isAvailable" className="text-xs text-slate-300 cursor-pointer">
                    <span className="font-semibold text-white">Mark as Available for Emergency Alerts</span>
                    <p className="text-[11px] text-slate-400">
                      When checked, you will receive matching notifications for compatible emergency blood requests in your city.
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Contact Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555-0123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  State
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs font-bold !py-3 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
                </span>
              ) : (
                'Save Profile & Enter Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
