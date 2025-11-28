// src/services/papersService.js
import { apiFetch } from '../services/api';

/**
 * Field label -> API key mapping for create/update payloads
 */
export const LABEL_TO_API = {
  'Paper ID': 'paper_id',
  'DOI': 'doi',
  'Author(s)': 'authors',
  'Year': 'year',
  'Title': 'title',
  'Name of Journal/Conference': 'journal',
  'ISSN / ISBN': 'issn_isbn',
  'Name of Publisher / Organization': 'publisher',
  'Place of Conference': 'place_of_conference',
  'Area / Sub Area': 'area_sub_area',
  'Volume': 'volume',
  'Issue': 'issue',
  'Page No': 'page_no',
  'Category of Paper': 'category',
  'Litracture Review': 'literature_review',
  'Key Issue': 'key_issue',
  'Solution Approach / Methodology used': 'solution_methodology',
  'Related Work': 'related_work',
  'Input Parameters used': 'input_parameters',
  'Hardware / Software / Technology Used': 'hardware_software_technology',
  'Results': 'results',
  'Key advantages': 'key_advantages',
  'Limitations': 'limitations',
  'Remarks': 'remarks',
};

export function toApiPayload(form) {
  const body = {};
  Object.entries(LABEL_TO_API).forEach(([label, apiKey]) => {
    const v = form?.[label];
    if (v !== undefined) body[apiKey] = v;
  });
  return body;
}

/** Build final request body: FormData when file present, else JSON object */
function buildBody(form) {
  // Already FormData? pass through.
  if (form instanceof FormData) return form;

  // If caller passed { file } along with labels, convert to FormData.
  if (form && form.file instanceof File) {
    const fd = new FormData();
    const mapped = toApiPayload(form);
    Object.entries(mapped).forEach(([k, v]) => fd.append(k, v ?? ''));
    fd.append('file', form.file);
    return fd;
  }

  // Plain labeled object → JSON
  return toApiPayload(form);
}

/**
 * Helper: map friendly param names to backend params and remove undefined
 * Accepts params like: { page, perPage, per_page, q, query, search, category, ... }
 * Ensures backend receives page and per_page and search (if provided)
 */
function normalizeQueryParams(params = {}) {
  if (!params) return {};

  const {
    page,
    perPage,
    per_page,
    limit,
    q,
    query,
    search,
    category,
    ...rest
  } = params || {};

  // build final map
  const out = { ...rest };

  // page default 1
  if (page !== undefined && page !== null) out.page = page;
  else out.page = 1;

  // prefer per_page if given, then perPage, then limit, else default 25
  const chosenPer = per_page ?? perPage ?? limit ?? 25;
  out.per_page = chosenPer;

  // search param: prefer search, then q, then query
  if (search !== undefined) out.search = search;
  else if (q !== undefined) out.search = q;
  else if (query !== undefined) out.search = query;

  if (category !== undefined) out.category = category;

  // strip undefined / null values
  Object.keys(out).forEach(k => {
    if (out[k] === undefined || out[k] === null) delete out[k];
  });

  return out;
}

/** Build query string from params object (skip arrays/objects) */
function buildQueryString(qp = {}) {
  const usp = new URLSearchParams();
  Object.entries(qp).forEach(([k, v]) => {
    // allow numbers and strings; skip arrays/objects to avoid weird serialization
    if (v === undefined || v === null) return;
    if (typeof v === 'object') {
      // simple support: JSON stringify arrays/objects
      usp.append(k, JSON.stringify(v));
    } else {
      usp.append(k, String(v));
    }
  });
  return usp.toString();
}

/** Endpoints ---------------------------------------------------------- */

/**
 * GET /papers
 * Accepts flexible params; sends page, per_page, search, category to API.
 */
export async function fetchPapers(params = {}) {
  const qp = normalizeQueryParams(params);
  const qs = buildQueryString(qp);
  const path = qs ? `/papers?${qs}` : '/papers';

  // debug — remove or gate by env in production
  // eslint-disable-next-line no-console
  console.debug('fetchPapers ->', path, qp);

  return apiFetch(path, { method: 'GET' });
}

export async function fetchPaperById(id) {
  return apiFetch(`/papers/${id}`, { method: 'GET' });
}

export async function createPaper(form) {
  const body = buildBody(form);
  return apiFetch('/papers', { method: 'POST', body });
}

export async function updatePaper(id, form) {
  const body = buildBody(form);
  return apiFetch(`/papers/${id}`, { method: 'PUT', body });
}

export async function deletePaper(id) {
  return apiFetch(`/papers/${id}`, { method: 'DELETE' });
}

export async function uploadPaperFile(id, file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch(`/papers/${id}/files`, { method: 'POST', body: fd });
}

export async function deletePapersBulk(ids) {
  return apiFetch('/papers/bulk-delete', { method: 'POST', body: { ids } });
}
