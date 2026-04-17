import { http } from '../clients/axiosClient';

export const authApi = {
  login: (email, password) =>
    http.post('/auth/login/', { username: email, password }),
  
  register: ({ email, password, full_name, role = 'recruiter' }) =>
    http.post('/auth/register/', { username: email, email, password, role, full_name }),
  
  logout: (refreshToken) =>
    http.post('/auth/logout/', { refresh: refreshToken }),
  
  me: () => http.get('/auth/me/'),
  
  updateMe: (payload) => http.patch('/auth/me/', payload),
  
  getPreferences: () => http.get('/auth/preferences/'),
  
  updatePreferences: (payload) => http.patch('/auth/preferences/', payload),
  
  onboarding: (payload) => http.patch('/auth/onboarding/', payload),
};
