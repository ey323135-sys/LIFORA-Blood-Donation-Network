import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { organService } from '../services/authService';
import { Heart, AlertCircle, CheckCircle, Loader2, Shield, FileText, UserCheck, AlertTriangle, Trash2 } from 'lucide-react';

const ORGANS = [
  'Kidneys', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas', 'Skin', 'Bone & Tissue', 'All Organs'
];

export default function OrganDonation() {
  const { user } = useContext(AuthContext);

  const [pledge, setPledge] = useState(null);
  const [hasPledged, setHasPledged] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [form, setForm] = useState({
    organsPledged: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Family',
    witnessName: '',
    legalDisclaimerAccepted: false,
    digitalSignature: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchPledge = async () => {
      try {
        const res = await organService.getMyPledge();
        if (res.success) {
          setHasPledged(res.hasPledged);
          setPledge(res.pledge);
          if (res.pledge) {
            setForm(prev => ({
              ...prev,
              organsPledged: res.pledge.organsPledged || [],
              emergencyContactName: res.pledge.emergencyContactName || '',
              emergencyContactPhone: res.pledge.emergencyContactPhone || '',
              emergencyContactRelation: res.pledge.emergencyContactRelation || 'Family',
              witnessName: res.pledge.witnessName || ''
            }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchPledge();
  }, [user]);

  const toggleOrgan = (organ) => {
    setForm(prev => ({
      ...prev,
      organsPledged: prev.organsPledged.includes(organ)
        ? prev.organsPledged.filter(o => o !== organ)
        : [...prev.organsPledged, organ]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.legalDisclaimerAccepted) {
      setError('You must read and accept the legal disclaimer to proceed.');
      return;
    }
    if (form.organsPledged.length === 0) {
      setError('Please select at least one organ or tissue to pledge.');
      return;
    }
    if (!form.digitalSignature.trim()) {
      setError('Please type your full name as digital signature.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await organService.pledge(form);
      if (res.success) {
        setSuccess(res.message);
        setHasPledged(true);
        setPledge(res.pledge);
      }
    } catch (err) {
      setError(err.message || 'Failed to register pledge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await organService.withdraw('User requested withdrawal through dashboard');
      if (res.success) {
        setSuccess('Your consent has been withdrawn. The record has been updated.');
        setHasPledged(false);
        setPledge(res.pledge);
        setShowWithdrawConfirm(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to withdraw consent.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass-panel p-8 text-center max-w-md space-y-4">
          <Heart className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-white font-bold text-xl">Sign In Required</h2>
          <p className="text-slate-400 text-sm">Please sign in to manage your organ donation preferences.</p>
        </div>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Organ Donation Consent</h1>
        <p className="text-slate-400">Register your voluntary pledge and manage your consent</p>
      </div>

      {/* Important Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <AlertTriangle className="w-5 h-5" />
          <span>Important Legal Disclaimer</span>
        </div>
        <p className="text-amber-200/80 text-sm">
          LIFORA is an awareness and consent registration platform. This pledge is <strong>not</strong> a legally binding instrument for organ allocation or transplantation.
          Actual organ matching, allocation, and surgical transplantation are conducted exclusively by authorized medical institutions and government-approved transplant networks.
          You retain the absolute right to withdraw your consent at any time. 
        </p>
      </div>

      {/* Current Status */}
      {hasPledged && pledge && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-emerald-300 font-semibold">Active Organ Donation Pledge</p>
                <p className="text-emerald-200/70 text-xs">
                  Pledged: {pledge.organsPledged?.join(', ') || 'N/A'} · 
                  Registered: {pledge.consentDate ? new Date(pledge.consentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="text-xs px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Withdraw Consent
            </button>
          </div>
        </div>
      )}

      {pledge && !hasPledged && (
        <div className="p-5 rounded-2xl bg-slate-700/30 border border-slate-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-slate-300 font-semibold">Consent Withdrawn</p>
              <p className="text-slate-400 text-xs">
                Your organ donation consent was withdrawn on {pledge.withdrawalDate ? new Date(pledge.withdrawalDate).toLocaleDateString() : 'N/A'}.
                You can re-register below if you wish.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation */}
      {showWithdrawConfirm && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500 space-y-3">
          <p className="text-red-300 font-semibold">⚠ Confirm Consent Withdrawal</p>
          <p className="text-red-200/80 text-sm">
            You are about to withdraw your organ donation consent. This action is recordable in the audit history. 
            You can re-register at any time.
          </p>
          <div className="flex gap-3">
            <button onClick={handleWithdraw} disabled={withdrawing}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50">
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Withdraw'}
            </button>
            <button onClick={() => setShowWithdrawConfirm(false)}
              className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success/Error */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Registration Form */}
      <div className="glass-panel p-8 space-y-7">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-400" />
          <h2 className="text-white font-bold text-lg">
            {hasPledged ? 'Update Your Organ Donation Pledge' : 'Register Organ Donation Pledge'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organs Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Select organs/tissues to pledge *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ORGANS.map(organ => (
                <button key={organ} type="button" onClick={() => toggleOrgan(organ)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.organsPledged.includes(organ)
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>
                  {organ}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-red-400" /> Emergency Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Name *</label>
                <input type="text" required value={form.emergencyContactName}
                  onChange={e => setForm({ ...form, emergencyContactName: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Phone *</label>
                <input type="tel" required value={form.emergencyContactPhone}
                  onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                <select value={form.emergencyContactRelation}
                  onChange={e => setForm({ ...form, emergencyContactRelation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none">
                  {['Family', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Witness Name *</label>
                <input type="text" required value={form.witnessName}
                  onChange={e => setForm({ ...form, witnessName: e.target.value })}
                  placeholder="Name of witness"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Digital Signature (Type your full name to confirm) *
            </label>
            <input type="text" required value={form.digitalSignature}
              onChange={e => setForm({ ...form, digitalSignature: e.target.value })}
              placeholder="Type your full legal name here"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500 outline-none" />
          </div>

          {/* Legal Disclaimer Checkbox */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.legalDisclaimerAccepted}
                onChange={e => setForm({ ...form, legalDisclaimerAccepted: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">I understand and confirm</strong> that this is a voluntary awareness registration on LIFORA. 
                I acknowledge that organ matching, allocation, and transplantation are conducted by authorized medical institutions, not LIFORA. 
                I can withdraw my consent at any time. I have informed my emergency contact person of this pledge.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full font-bold !py-3 flex items-center justify-center gap-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering Pledge...</>
            ) : (
              <><Shield className="w-4 h-4" /> {hasPledged ? 'Update Pledge' : 'Register Organ Donation Pledge'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
