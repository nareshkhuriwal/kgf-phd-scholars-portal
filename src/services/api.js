// src/services/api.js
import { getToken } from './../utils/authStorage.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || ''; // e.g. http://localhost:8000
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'jwt').toLowerCase(); // 'jwt' | 'sanctum'

async function ensureCsrfForSanctum() {
  if (AUTH_MODE !== 'sanctum') return;
  if (!API_ORIGIN) return;
  // must NOT be under /api
  await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
  });
}

function buildHeaders(token, body) {
  const h = new Headers();
  if (token && AUTH_MODE === 'jwt') h.set('Authorization', `Bearer ${token}`);
  if (body && !(body instanceof FormData)) h.set('Content-Type', 'application/json');
  h.set('Accept', 'application/json');
  return h;
}

/**
 * apiFetch(path, { method='GET', body, noAuth=false })
 *  - Automatically attaches Authorization (JWT) or cookies (Sanctum)
 *  - Throws Error with {status, payload}
 */
export async function apiFetch(path, { method = 'GET', body, noAuth = false } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const token = getToken();

  if (AUTH_MODE === 'sanctum') {
    // Make sure CSRF cookie is set before any state-changing call
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      await ensureCsrfForSanctum();
    }
  }

  const headers = buildHeaders(noAuth ? null : token, body);
  const payload = body && !(body instanceof FormData) ? JSON.stringify(body) : body;

  const res = await fetch(url, {
    method,
    headers,
    body: payload,
    credentials: 'include', // needed for Sanctum; harmless for JWT
    mode: 'cors',
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep text */ }

  if (!res.ok) {
    const msg = data?.message || data?.error || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data ?? text;
    throw err;
  }
  return data;
}
