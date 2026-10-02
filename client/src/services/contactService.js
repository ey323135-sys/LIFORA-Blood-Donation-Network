import API from './api';

export const contactService = {
  submitMessage: (data) => API.post('/contact', data)
};
