import API from './api';

export const requestService = {
  createRequest: (data) => API.post('/requests', data),
  getRequests: (params = {}) => API.get('/requests', { params }),
  getRequestById: (id) => API.get(`/requests/${id}`),
  updateStatus: (id, status) => API.patch(`/requests/${id}/status`, { status }),
  cancelRequest: (id) => API.delete(`/requests/${id}`),
  getMatches: (id) => API.get(`/matching/${id}`)
};
