import { cleanRich } from '../text/cleanRich';

export function htmlToExcelText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let text = '';

  // Ordered list → numbered points
  if (html.includes('<ol')) {
    let i = 1;
    text = html
      .replace(/<\/?ol[^>]*>/gi, '')
      .replace(/<li[^>]*>/gi, () => `${i++}. `)
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  // Unordered list → dash bullets
  else if (html.includes('<ul')) {
    text = html
      .replace(/<\/?ul[^>]*>/gi, '')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  // Plain text
  else {
    text = cleanRich(html);
  }

  // 🔒 CRITICAL: prevent Excel formula parsing
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return text;
}
