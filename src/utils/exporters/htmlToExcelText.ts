import { cleanRich } from '../text/cleanRich';

function decodeNbsp(s: string) {
  return s.replace(/\u00A0/g, ' ');
}

function normalizeLineBreaks(s: string) {
  // Excel safest newline is CRLF
  return s
    .replace(/\r?\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/\n/g, '\r\n');
}

function ensureNumberedBulletsOnNewLines(text: string) {
  // If someone gave: "1. aaa 2. bbb 3. ccc" -> make it vertical.
  // Only triggers when the "N." is followed by whitespace (so decimals like 3.14 won't match).
  return text
    .replace(/\s+(\d+)\.\s+/g, '\n$1. ')
    .replace(/^\n/, '');
}

export function htmlToExcelText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Fast-path: if it's not html-ish, treat as plain text
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  if (!looksLikeHtml) {
    let t = decodeNbsp(String(html));
    t = ensureNumberedBulletsOnNewLines(t);
    return normalizeLineBreaks(t);
  }

  // Parse HTML safely (no execution)
  const container = document.createElement('div');
  container.innerHTML = html;

  // Convert <br> to newlines BEFORE reading text
  container.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

  // Handle ordered/unordered lists explicitly
  const ol = container.querySelector('ol');
  const ul = container.querySelector('ul');

  let text = '';

  if (ol) {
    const items = Array.from(ol.querySelectorAll('li')).map((li, idx) => {
      const liText = decodeNbsp(li.textContent || '').trim();
      return liText ? `${idx + 1}. ${liText}` : '';
    }).filter(Boolean);

    text = items.join('\n');
  } else if (ul) {
    const items = Array.from(ul.querySelectorAll('li')).map((li) => {
      const liText = decodeNbsp(li.textContent || '').trim();
      return liText ? `- ${liText}` : '';
    }).filter(Boolean);

    text = items.join('\n');
  } else {
    // Paragraph-ish HTML: keep structure by translating block elements to newlines
    // so "1. ..." in separate <p> doesn't collapse to one line.
    container.querySelectorAll('p, div, section, article, tr').forEach(el => {
      // add a newline after each block element
      el.append('\n');
    });

    text = decodeNbsp(container.textContent || '');
    text = cleanRich(text); // your cleaner
    text = ensureNumberedBulletsOnNewLines(text);
  }

  text = normalizeLineBreaks(text);

  // Prevent Excel formula parsing
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return text;
}
