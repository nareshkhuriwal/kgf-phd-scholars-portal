export function extractCitationKeys(html) {
  if (!html) return [];

  const div = document.createElement('div');
  div.innerHTML = html;

  // Look for data-cite attribute instead of data
  return Array.from(div.querySelectorAll('[data-cite]'))
    .map(el => el.getAttribute('data-cite'))
    .filter(Boolean);
}

export function renumberCitations(html) {
  if (!html) return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  const seen = new Map();
  let index = 1;

  // Look for data-cite attribute instead of data
  container.querySelectorAll('[data-cite]').forEach(el => {
    const key = el.getAttribute('data-cite');

    if (!seen.has(key)) {
      seen.set(key, index++);
    }

    // Update the text content to show the number
    el.textContent = `[${seen.get(key)}]`;
  });

  return container.innerHTML;
}