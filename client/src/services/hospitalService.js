import API from './api';

export const hospitalService = {
  getDashboardStats: () => API.get('/hospitals/dashboard'),
  getRequestMatches: (requestId) => API.get(`/hospitals/matches/${requestId}`),
  verifyDonation: (data) => API.post('/hospitals/verify-donation', data)
};
