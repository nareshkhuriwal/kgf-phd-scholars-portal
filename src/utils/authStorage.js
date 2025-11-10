// src/services/authStorage.js
export const AUTH_KEY = 'phd_auth'; // single source of truth

export const readAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; }
};
export const writeAuth = (value) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(value || {}));
  // optional: mirror to sessionStorage if you want
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(value || {}));
};
export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};
export const getToken = () => readAuth()?.token || null;
