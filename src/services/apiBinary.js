import { getToken } from './../utils/authStorage.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || '';
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'jwt').toLowerCase();

async function ensureCsrfForSanctum() {
  if (AUTH_MODE !== 'sanctum') return;
  if (!API_ORIGIN) return;

  await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
  });
}

/**
 * apiFetchBinary
 * - Returns ArrayBuffer
 * - Supports JWT + Sanctum
 * - Does NOT parse JSON
 */
export async function apiFetchBinary(
  path,
  { method = 'POST', body, noAuth = false } = {}
) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const token = getToken();

  if (
    AUTH_MODE === 'sanctum' &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
  ) {
    await ensureCsrfForSanctum();
  }

  const headers = new Headers();
  if (!noAuth && token && AUTH_MODE === 'jwt') {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Accept', '*/*'); // important for binary

  const payload =
    body && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

  if (payload && !(payload instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: payload,
    credentials: 'include',
    mode: 'cors',
  });

  if (!res.ok) {
    const msg = `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  // 🔥 KEY DIFFERENCE
  return await res.arrayBuffer();
}
