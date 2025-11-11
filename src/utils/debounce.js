// src/utils/debounce.js
export function debounce(fn, wait = 250) {
  let t;
  function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}
