// utils/url.js
export function toRelative(u) {
  if (!u) return u;
  if (u.startsWith('/')) return u;            // already relative
  try {
    const url = new URL(u);                   // works for http/https
    return url.pathname + url.search + url.hash; // keep query tokens
  } catch {
    return u; // not a valid absolute URL; just return as-is
  }
}

const canonical = (u) => {
  const url = new URL(u);
  url.pathname = url.pathname.replace(/\/{2,}/g, '/');
  return url.toString();
};
