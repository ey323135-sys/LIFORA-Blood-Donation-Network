import API from './api';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (credentials) => API.post('/auth/login', credentials),
  googleAuth: (credential) => API.post('/auth/google', { credential }),
  getMe: () => API.get('/auth/me'),
  changePassword: (data) => API.post('/auth/change-password', data),
  logout: () => API.post('/auth/logout'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  verifyEmail: (token) => API.get(`/auth/verify-email/${token}`),
  completeProfile: (data) => API.post('/auth/complete-profile', data),
};

export const organService = {
  pledge: (data) => API.post('/organ/pledge', data),
  getMyPledge: () => API.get('/organ/my-pledge'),
  withdraw: (reason) => API.post('/organ/withdraw', { reason }),
  getAll: () => API.get('/organ/all'),
};

export const aiService = {
  query: (query) => API.post('/ai/query', { query }),
  getAnalytics: () => API.get('/ai/analytics'),
  getDocuments: () => API.get('/ai/documents'),
  addDocument: (data) => API.post('/ai/documents', data),
  deleteDocument: (id) => API.delete(`/ai/documents/${id}`),
};
