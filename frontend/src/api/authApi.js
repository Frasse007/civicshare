import { request } from './client.js';

export const registerRequest = (data) => request('/auth/register', { method: 'POST', body: data }).then((r) => r.user);
export const loginRequest = (data) => request('/auth/login', { method: 'POST', body: data }).then((r) => r.user);
export const logoutRequest = () => request('/auth/logout', { method: 'POST' });
export const fetchCurrentUser = (signal) => request('/auth/me', { signal }).then((r) => r.user);
