// src/utils/citations.js

/**
 * Extract citation keys from HTML content
 * @param {string} html - HTML content containing citations
 * @returns {string[]} Array of citation keys
 */
export function extractCitationKeys(html) {
  if (!html) return [];

  const div = document.createElement('div');
  div.innerHTML = html;

  // Look for data-cite attribute
  return Array.from(div.querySelectorAll('[data-cite]'))
    .map(el => el.getAttribute('data-cite'))
    .filter(Boolean);
}

/**
 * Renumber citations in HTML based on citation key to ID mapping
 * @param {string} html - HTML content with citations
 * @param {Object} citationMap - Map of citation_key to citation object with ID
 * @returns {string} Updated HTML with proper citation IDs
 */
export function renumberCitations(html, citationMap = null) {
  if (!html) return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  // If we have a citation map, use actual IDs from the database
  if (citationMap && Object.keys(citationMap).length > 0) {
    container.querySelectorAll('[data-cite]').forEach(el => {
      const key = el.getAttribute('data-cite');
      const citation = citationMap[key];
      
      if (citation && citation.id) {
        // Use the actual database ID
        el.textContent = `[${citation.id}]`;
      } else {
        // Fallback if citation not found
        el.textContent = `[${key}]`;
      }
    });
  } else {
    // Fallback: sequential numbering if no map available
    const seen = new Map();
    let index = 1;

    container.querySelectorAll('[data-cite]').forEach(el => {
      const key = el.getAttribute('data-cite');

      if (!seen.has(key)) {
        seen.set(key, index++);
      }

      el.textContent = `[${seen.get(key)}]`;
    });
  }

  return container.innerHTML;
}

/**
 * Build a map of citation_key to citation object from array of citations
 * @param {Array} citations - Array of citation objects with citation_key and id
 * @returns {Object} Map of citation_key to citation object
 */
export function buildCitationMap(citations) {
  if (!Array.isArray(citations)) {
    console.warn('buildCitationMap received non-array:', citations);
    return {};
  }
  
  console.log('Building citation map from citations:', citations);
  
  const map = citations.reduce((map, citation) => {
    // Handle different possible field names for citation key
    const citationKey = citation.citation_key || citation.key || citation.citationKey;
    
    if (citationKey) {
      map[citationKey] = {
        id: citation.id,
        citation_key: citationKey,
        title: citation.title,
        authors: citation.authors,
        year: citation.year,
        ...citation
      };
      console.log(`Mapped citation: ${citationKey} -> ID ${citation.id}`);
    } else {
      console.warn('Citation missing citation_key:', citation);
    }
    return map;
  }, {});
  
  console.log('Final citation map:', map);
  return map;
}