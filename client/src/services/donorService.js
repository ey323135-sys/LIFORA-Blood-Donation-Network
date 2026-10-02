import API from './api';

export const donorService = {
  getProfile: () => API.get('/donors/profile'),
  updateProfile: (data) => API.put('/donors/profile', data),
  updateAvailability: (isAvailable) => API.patch('/donors/availability', { isAvailable }),
  getIncomingRequests: () => API.get('/donors/requests'),
  respondToRequest: (id, status, notes = '') => API.post(`/donors/requests/${id}/respond`, { status, notes }),
  getHistory: () => API.get('/donors/history')
};
