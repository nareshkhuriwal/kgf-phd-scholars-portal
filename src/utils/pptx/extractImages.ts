export function extractImageUrls(html: string): string[] {
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('img'))
    .map(img => img.getAttribute('src'))
    .filter(Boolean) as string[];
}
