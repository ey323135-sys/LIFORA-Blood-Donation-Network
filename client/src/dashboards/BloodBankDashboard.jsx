import React, { useState, useEffect } from 'react';
import { bloodBankService } from '../services/bloodBankService';
import BloodGroupBadge from '../components/BloodGroupBadge';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { 
  Droplet, 
  Database, 
  AlertTriangle, 
  Edit3, 
  Save, 
  Loader2, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Building2
} from 'lucide-react';

export default function BloodBankDashboard() {
  const [inventory, setInventory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disclaimer, setDisclaimer] = useState('');
  
  // Stock edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState('O+');
  const [unitsInput, setUnitsInput] = useState(0);
  const [saving, setSaving] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await bloodBankService.getInventory();
      if (res.success) {
        setInventory(res.inventory);
        setProfile(res.bloodBankProfile);
        setDisclaimer(res.disclaimer);
      }
    } catch (err) {
      console.error('Failed to load blood bank inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOpenEdit = (item) => {
    setEditGroup(item.bloodGroup);
    setUnitsInput(item.units);
    setEditModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await bloodBankService.updateInventory(editGroup, unitsInput);
      if (res.success) {
        setEditModalOpen(false);
        await loadInventory();
      }
    } catch (err) {
      alert(err.message || 'Stock update failed');
    } finally {
      setSaving(false);
    }
  };

  const totalUnits = inventory.reduce((acc, item) => acc + (item.units || 0), 0);
  const criticalCount = inventory.filter(item => item.status === 'Critical' || item.status === 'Out of Stock').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-cyan-500/30 flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5" /> Licensed Blood Bank Facility
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {profile?.bloodBankName || 'Red Cross Central Blood Bank'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registration: {profile?.registrationNo || 'BB-LIC-VERIFIED'} • {profile?.address}
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="btn-secondary text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Inventory Logs
        </button>
      </div>

      {/* Mandatory Reported Stock Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">Reported Stock Protocol Notice</span>
          <p className="text-slate-400 leading-relaxed">
            Stock figures represent reported availability as manually recorded by staff. Inventory levels do NOT auto-decrement on donor request acceptance. All transactions must be authorized by staff.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Reported Units" value={totalUnits} subtitle="Across 8 Blood Groups" icon={Database} color="cyan" />
        <StatsCard title="Critical Stock Groups" value={criticalCount} subtitle="Requires urgent replenishment" icon={AlertTriangle} color="red" />
        <StatsCard title="Authorized Staff" value={profile?.contactPerson || 'Authorized Technician'} icon={Building2} color="purple" />
        <StatsCard title="Last Inspection" value="Verified" icon={CheckCircle2} color="emerald" />
      </div>

      {/* 8 Blood Groups Inventory Cards */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" /> Stock Records by Blood Group
            </h2>
            <p className="text-xs text-slate-400">Manage reported reserve units for all 8 standard blood groups</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs">Fetching inventory logs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inventory.map((item) => (
              <div key={item._id || item.bloodGroup} className="glass-card p-6 space-y-4 border-slate-800 relative group">
                
                <div className="flex items-center justify-between">
                  <BloodGroupBadge bloodGroup={item.bloodGroup} size="lg" />
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    item.status === 'In Stock' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.status === 'Low Stock'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="py-2 text-center">
                  <span className="font-heading font-extrabold text-4xl text-white">{item.units}</span>
                  <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">Available Units</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Updated By:</span>
                    <span className="text-slate-200 truncate font-medium">{item.lastUpdatedBy || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Edit:</span>
                    <span className="text-slate-300">{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="btn-secondary w-full text-xs !py-2 justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Update Stock
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Reported Stock: ${editGroup}`}
      >
        <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Blood Group</label>
            <input
              type="text"
              disabled
              value={editGroup}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Reported Units Count *</label>
            <input
              type="number"
              min="0"
              max="500"
              required
              value={unitsInput}
              onChange={(e) => setUnitsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-extrabold text-base"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Staff Member: <span className="text-white font-medium">{profile?.contactPerson || 'Authorized Technician'}</span>
          </p>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs !bg-cyan-600 hover:!bg-cyan-500">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Inventory Transaction'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
