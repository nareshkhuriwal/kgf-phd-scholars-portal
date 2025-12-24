// src/utils/text/cleanRich.js
export function cleanRich(input = "") {
  if (input == null) return "";
  let s = String(input);

  // Normalize breaks before decoding
  s = s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\s*p[^>]*>/gi, "");

  // Decode entities using the browser
  if (s.includes("&")) {
    const div = document.createElement("div");
    div.innerHTML = s;
    s = div.textContent || div.innerText || "";
  }

  // NBSP handling
  s = s
    .replace(/\u00A0{2,}/g, "\n")      // 2+ NBSP -> newline
    .replace(/(?:&nbsp;){2,}/gi, "\n") // (fallback)
    .replace(/\u00A0/g, " ")           // single NBSP -> space
    .replace(/&nbsp;/gi, " ");

  // Strip any leftover tags
  s = s.replace(/<\/?[^>]+>/g, "");

  // Trim trailing spaces per line, preserve internal ones
  s = s.split("\n").map(ln => ln.replace(/[ \t]+$/g, "")).join("\n");

  // Collapse 3+ newlines into 2 (keep blank lines)
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}


export const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
