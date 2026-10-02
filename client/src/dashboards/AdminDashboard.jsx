import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Shield, 
  Users, 
  Building2, 
  Droplet, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  FileText, 
  Mail, 
  Loader2,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';

const COLORS = ['#ef4444', '#0284c7', '#10b981', '#a855f7', '#f59e0b', '#06b6d4'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'audit' | 'contact'

  // User Filter state
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getDashboardStats();
      if (statsRes.success) {
        setData(statsRes);
      }

      const usersRes = await adminService.getUsers();
      if (usersRes.success) {
        setUsers(usersRes.users);
      }

      const auditRes = await adminService.getAuditLogs();
      if (auditRes.success) {
        setAuditLogs(auditRes.logs);
      }

      const msgRes = await adminService.getContactMessages();
      if (msgRes.success) {
        setContactMessages(msgRes.messages);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyUser = async (userId) => {
    try {
      const res = await adminService.verifyUser(userId);
      if (res.success) {
        await loadAdminData();
        alert(res.message);
      }
    } catch (err) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change user status to ${nextStatus.toUpperCase()}?`)) return;

    try {
      const res = await adminService.toggleUserStatus(userId, nextStatus);
      if (res.success) {
        await loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Status change failed');
    }
  };

  const stats = data?.stats || {};
  const charts = data?.charts || { requestsByBloodGroup: [], requestsByStatus: [] };

  const filteredUsers = users.filter(u => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/20 text-purple-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Root System Administrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            LIFORA Network Administration & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Platform governance, user verification, system activity audit, and analytical insights.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'contact' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contact Messages ({contactMessages.length})
          </button>
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Registered Users" value={stats.totalUsers || 0} icon={Users} color="purple" />
            <StatsCard title="Registered Donors" value={stats.totalDonors || 0} icon={Droplet} color="red" />
            <StatsCard title="Hospitals / Facilities" value={stats.totalHospitals || 0} icon={Building2} color="blue" />
            <StatsCard title="Blood Banks" value={stats.totalBloodBanks || 0} icon={Database} color="cyan" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Requests" value={stats.totalRequests || 0} icon={Activity} color="amber" />
            <StatsCard title="Active Requests" value={stats.activeRequests || 0} icon={Clock} color="red" />
            <StatsCard title="Fulfilled Requests" value={stats.completedRequests || 0} icon={CheckCircle2} color="emerald" />
            <StatsCard title="Reported Stock Units" value={stats.totalReportedUnits || 0} icon={Database} color="purple" />
          </div>

          {/* Recharts Graphical Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Bar Chart: Requests by Blood Group */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-bold text-base text-white">Blood Requests Distribution by Blood Group</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.requestsByBloodGroup}>
                    <XAxis dataKey="bloodGroup" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
                    />
                    <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Request Statuses */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-bold text-base text-white">Emergency Request Status Breakdown</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.requestsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {charts.requestsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">User Accounts & Verification Portal</h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search name, email, city..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              >
                <option value="">All Roles</option>
                <option value="donor">Donors</option>
                <option value="hospital">Hospitals</option>
                <option value="bloodbank">Blood Banks</option>
                <option value="requester">Requesters</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">User Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                    <td className="px-4 py-3 uppercase font-semibold text-[10px] text-purple-400">{u.role}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-500">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3">{u.city}</td>
                    <td className="px-4 py-3">
                      {u.isVerified ? (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
                          VERIFIED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyUser(u._id)}
                          className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/40"
                        >
                          Approve Verification
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u._id, u.status)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            u.status === 'active' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">System Audit & Security Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3 rounded-r-lg">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{log.user?.name || 'System / Guest'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-400 text-[10px]">{log.action}</td>
                    <td className="px-4 py-3 text-slate-400">{log.entity}</td>
                    <td className="px-4 py-3 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact Messages Tab */}
      {activeTab === 'contact' && (
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Public Contact Form Submissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactMessages.map((msg) => (
              <div key={msg._id} className="glass-card p-4 space-y-2 border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{msg.name}</span>
                  <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sky-400 font-medium">{msg.email}</p>
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="font-semibold text-slate-400 block mb-1">Subject: {msg.subject}</span>
                  <p className="leading-relaxed bg-slate-950 p-2.5 rounded-lg text-slate-300">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
