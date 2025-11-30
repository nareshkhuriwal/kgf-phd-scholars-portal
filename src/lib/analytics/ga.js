// src/lib/analytics/ga.js
// Vite-compatible GA4 helper (uses import.meta.env)
// Put your measurement id in .env as VITE_GA_ID=G-XXXXXXXXXX

const GA_ID = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_ID
  ? String(import.meta.env.VITE_GA_ID)
  : 'G-KCF2L96PP4'; // fallback placeholder

function isGtagReady() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function initGa() {
  if (typeof window === 'undefined') return;
  if (isGtagReady()) return;

  try {
    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`);
    if (existing) return;

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s1);

    const s2 = document.createElement('script');
    s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      window.gtag = window.gtag || gtag;
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { send_page_view: false });
    `;
    document.head.appendChild(s2);
  } catch (err) {
    // Swallow errors — analytics must never break the app
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('initGa error', err);
    }
  }
}

export function trackEvent(name, params = {}) {
  try {
    if (!isGtagReady()) {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[GA] trackEvent blocked (gtag not ready):', name, params);
      }
      return;
    }
    window.gtag('event', name, params);
  } catch (err) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[GA] trackEvent error', err);
    }
  }
}

export function setUserProperties(props = {}) {
  try {
    if (!isGtagReady()) return;
    window.gtag('set', 'user_properties', props);
  } catch (err) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[GA] setUserProperties error', err);
    }
  }
}
