import API from './api';

export const adminService = {
  getDashboardStats: () => API.get('/admin/dashboard'),
  getUsers: (params = {}) => API.get('/admin/users', { params }),
  verifyUser: (id) => API.patch(`/admin/users/${id}/verify`),
  toggleUserStatus: (id, status) => API.patch(`/admin/users/${id}/status`, { status }),
  getAuditLogs: () => API.get('/admin/audit-logs'),
  getContactMessages: () => API.get('/admin/contact-messages')
};
