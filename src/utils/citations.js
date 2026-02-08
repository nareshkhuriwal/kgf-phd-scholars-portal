// src/utils/citations.js

/**
 * Extract citation IDs from HTML content
 * @param {string} html
 * @returns {number[]}
 */
export function extractCitationKeys(html) {
  if (!html) {
    console.debug('[citations] extractCitationKeys: empty html');
    return [];
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  const ids = [
    ...new Set(
      Array.from(container.querySelectorAll('[data-cite]'))
        .map(el => Number(el.getAttribute('data-cite')))
        .filter(Number.isInteger)
    ),
  ];

  console.debug('[citations] extractCitationKeys', {
    count: ids.length,
    ids,
  });

  return ids;
}

/**
 * Renumber citations and LINK them to reference list
 * @param {string} html
 * @param {Object} citationMap citation_id → { order, title, authors }
 */
export function renumberCitations(html, citationMap = {}) {
  if (!html) {
    console.debug('[citations] renumberCitations: empty html');
    return html;
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  let updated = 0;
  let missing = 0;

  container.querySelectorAll('[data-cite]').forEach(el => {
    const citationId = el.getAttribute('data-cite');
    const citation = citationMap[citationId];

    if (citation && citation.order) {
      // 🔗 Link inline citation → reference entry
      el.innerHTML = `
        <a
          href="#ref-${citation.order}"
          class="citation-link"
          title="${citation.authors ?? ''} (${citation.year ?? ''})"
        >
          [${citation.order}]
        </a>
      `;
      updated++;
    } else {
      // ⛑ Safe placeholder until backend assigns order
      el.textContent = '[•]';
      missing++;
    }
  });

  console.debug('[citations] renumberCitations', {
    updated,
    missing,
    mapSize: Object.keys(citationMap).length,
  });

  return container.innerHTML;
}

/**
 * Build citation map keyed by citation_id
 * @param {Array} citations
 * @returns {Object}
 */
export function buildCitationMap(citations = []) {
  if (!Array.isArray(citations)) {
    console.warn('[citations] buildCitationMap: invalid input', citations);
    return {};
  }

  const map = citations.reduce((acc, c) => {
    if (c.citation_id) {
      acc[String(c.citation_id)] = c;
    }
    return acc;
  }, {});

  console.debug('[citations] buildCitationMap', {
    received: citations.length,
    mapped: Object.keys(map).length,
  });

  return map;
}
