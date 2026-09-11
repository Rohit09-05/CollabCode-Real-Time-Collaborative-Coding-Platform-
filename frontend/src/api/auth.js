import api from './axios.js';

export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh');
export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.put('/users/me', data);
