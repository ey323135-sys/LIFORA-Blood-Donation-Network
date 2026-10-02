import API from './api';

export const bloodBankService = {
  getInventory: (bloodBankId) => API.get('/bloodbanks/inventory', { params: { bloodBankId } }),
  updateInventory: (bloodGroup, units) => API.post('/bloodbanks/inventory', { bloodGroup, units }),
  getRequests: () => API.get('/bloodbanks/requests')
};
