// src/services/papersService.js
import { apiFetch } from '../services/api';

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

/** Endpoints */
export async function fetchPapers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `/papers?${qs}` : '/papers';
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
