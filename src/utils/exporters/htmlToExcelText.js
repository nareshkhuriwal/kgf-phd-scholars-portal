import { cleanRich } from '../text/cleanRich';

export const htmlToExcelText = (html) => {
  if (!html || typeof html !== 'string') return '';

  // Ordered list → numbered points
  if (html.includes('<ol')) {
    let index = 1;

    return html
      .replace(/<\/?ol[^>]*>/gi, '')
      .replace(/<li[^>]*>/gi, () => `${index++}. `)
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Unordered list → dash bullets
  if (html.includes('<ul')) {
    return html
      .replace(/<\/?ul[^>]*>/gi, '')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  // Fallback
  return cleanRich(html);
};
