// src/store/reportsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/** ───── Existing endpoints (kept as-is) ───── **/

// All "Literature Review" fields (normalized list for Reports page)
export const loadLiteratureReviews = createAsyncThunk('reports/loadLit', async () => {
  return await apiFetch('/reports/literature', { method: 'GET' });
});

// ROL table rows (full schema)
export const loadROL = createAsyncThunk('reports/loadROL', async () => {
  return await apiFetch('/reports/rol', { method: 'GET' });
});

/** ───── New endpoints for Reports module (no roles) ───── **/

// Chapters list for selectors in builder/Synopsis/Thesis
export const loadChapters = createAsyncThunk('reports/loadChapters', async () => {
  return await apiFetch('/reports/chapters', { method: 'GET' });
});

// Users for multi-select (admin/supervisor style selection — no roles enforced)
export const loadUsers = createAsyncThunk('reports/loadUsers', async () => {
  return await apiFetch('/reports/users', { method: 'GET' });
});

// Preview the report (outline, KPIs, etc.)
export const fetchReportPreview = createAsyncThunk(
  'reports/fetchReportPreview',
  async (payload) => {
    // payload: { template, filters, selections }
    return await apiFetch('/reports/preview', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' }
    });
  }
);

// Generate a report file (PDF/DOCX/XLSX/PPTX)
export const generateReport = createAsyncThunk(
  'reports/generateReport',
  async (payload) => {
    // payload: { template, format, filename, filters, selections }
    return await apiFetch('/reports/generate', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' }
    });
  }
);

// Bulk exports (all users / all papers / by collection)
export const bulkExport = createAsyncThunk(
  'reports/bulkExport',
  async (payload) => {
    // payload: { type:'all-users'|'all-papers'|'by-collection', format:'xlsx'|'csv'|'pdf', filters:{...} }
    return await apiFetch('/reports/bulk-export', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' }
    });
  }
);

/** ───── Saved Reports CRUD & Actions ───── **/

// List saved report configs
export const loadSavedReports = createAsyncThunk('reports/loadSavedReports', async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return await apiFetch(`/reports/saved${qs ? `?${qs}` : ''}`, { method: 'GET' });
});

// Fetch single saved config
export const fetchSavedReport = createAsyncThunk('reports/fetchSavedReport', async (id) => {
  return await apiFetch(`/reports/saved/${id}`, { method: 'GET' });
});

// Create new saved config
export const createSavedReport = createAsyncThunk('reports/createSavedReport', async (payload) => {
  // payload: { name, template, format, filename, filters, selections }
  return await apiFetch('/reports/saved', {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Update saved config
export const updateSavedReport = createAsyncThunk('reports/updateSavedReport', async ({ id, ...payload }) => {
  return await apiFetch(`/reports/saved/${id}`, {
    method: 'PUT',
    body: payload,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Delete saved config
export const deleteSavedReport = createAsyncThunk('reports/deleteSavedReport', async (id) => {
  await apiFetch(`/reports/saved/${id}`, { method: 'DELETE' });
  return { id };
});

// Preview a saved config (server builds outline from stored payload)
export const previewSavedReport = createAsyncThunk('reports/previewSavedReport', async ({ id, payload }) => {
  return await apiFetch(`/reports/saved/${id}/preview`, {
    method: 'POST',
    body: { name: payload.name, format: payload.format, template: payload.template, filters: payload.filters, selections: payload.selections },
    headers: { 'Content-Type': 'application/json' }
  });
});

// Generate file from saved config
export const generateSavedReport = createAsyncThunk('reports/generateSavedReport', async ({ id, payload }) => {
  return await apiFetch(`/reports/saved/${id}/generate`, {
    method: 'POST',
    body: { name: payload.name, format: payload.format, template: payload.template, filters: payload.filters, selections: payload.selections },
    headers: { 'Content-Type': 'application/json' }
  });
});

const slice = createSlice({
  name: 'reports',
  initialState: {
    // existing
    literature: [],
    rol: [],
    loading: false,
    error: null,
    // new
    chapters: [],
    users: [],
    preview: null,
    loadingPreview: false,
    generating: false,
    bulkLoading: false,
    lastDownloadUrl: null,

    // saved reports state
    saved: [],
    savedLoading: false,
    currentSaved: null,
    saving: false,
    deleting: false,
  },
  reducers: {
    clearReportsState: (s) => {
      s.preview = null;
      s.lastDownloadUrl = null;
      s.error = null;
    }
  },
  extraReducers: (b) => {
    b
      /** ─── Literature ─── */
      .addCase(loadLiteratureReviews.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadLiteratureReviews.fulfilled, (s, a) => {
        s.loading = false;
        s.literature = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadLiteratureReviews.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load literature reviews';
      })

      /** ─── ROL ─── */
      .addCase(loadROL.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadROL.fulfilled, (s, a) => {
        s.loading = false;
        s.rol = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadROL.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load ROL';
      })

      /** ─── Chapters ─── */
      .addCase(loadChapters.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadChapters.fulfilled, (s, a) => {
        s.loading = false;
        s.chapters = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadChapters.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load chapters';
      })

      /** ─── Users ─── */
      .addCase(loadUsers.pending, (s)=>{ s.loading = true; s.error = null; })
      .addCase(loadUsers.fulfilled, (s,a)=>{ s.loading = false; s.users = a.payload?.data ?? a.payload ?? []; })
      .addCase(loadUsers.rejected, (s,a)=>{ s.loading = false; s.error = a.error?.message || 'Failed to load users'; })

      /** ─── Ad-hoc Preview ─── */
      .addCase(fetchReportPreview.pending, (s) => { s.loadingPreview = true; s.error = null; s.preview = null; })
      .addCase(fetchReportPreview.fulfilled, (s, a) => {
        s.loadingPreview = false;
        s.preview = a.payload?.data ?? a.payload ?? null;
      })
      .addCase(fetchReportPreview.rejected, (s, a) => {
        s.loadingPreview = false;
        s.error = a.error?.message || 'Failed to load preview';
      })

      /** ─── Ad-hoc Generate ─── */
      .addCase(generateReport.pending, (s) => { s.generating = true; s.error = null; s.lastDownloadUrl = null; })
      .addCase(generateReport.fulfilled, (s, a) => {
        s.generating = false;
        const res = a.payload?.data ?? a.payload ?? {};
        s.lastDownloadUrl = res.downloadUrl || res.url || null;
      })
      .addCase(generateReport.rejected, (s, a) => {
        s.generating = false;
        s.error = a.error?.message || 'Failed to generate report';
      })

      /** ─── Bulk Export ─── */
      .addCase(bulkExport.pending, (s) => { s.bulkLoading = true; s.error = null; s.lastDownloadUrl = null; })
      .addCase(bulkExport.fulfilled, (s, a) => {
        s.bulkLoading = false;
        const res = a.payload?.data ?? a.payload ?? {};
        s.lastDownloadUrl = res.downloadUrl || res.url || null;
      })
      .addCase(bulkExport.rejected, (s, a) => {
        s.bulkLoading = false;
        s.error = a.error?.message || 'Failed to run bulk export';
      })

      /** ─── Saved Reports: list & fetch ─── */
      .addCase(loadSavedReports.pending, (s)=>{ s.savedLoading = true; s.error=null; })
      .addCase(loadSavedReports.fulfilled, (s,a)=>{ s.savedLoading = false; s.saved = a.payload?.data ?? a.payload ?? []; })
      .addCase(loadSavedReports.rejected, (s,a)=>{ s.savedLoading = false; s.error = a.error?.message || 'Failed to load saved reports'; })

      .addCase(fetchSavedReport.pending, (s)=>{ s.loading = true; s.error=null; s.currentSaved=null; })
      .addCase(fetchSavedReport.fulfilled, (s,a)=>{ s.loading = false; s.currentSaved = a.payload?.data ?? a.payload ?? null; })
      .addCase(fetchSavedReport.rejected, (s,a)=>{ s.loading = false; s.error = a.error?.message || 'Failed to load report'; })

      /** ─── Saved Reports: create/update/delete ─── */
      .addCase(createSavedReport.pending, (s)=>{ s.saving = true; s.error=null; })
      .addCase(createSavedReport.fulfilled, (s,a)=>{ s.saving = false; s.currentSaved = a.payload?.data ?? a.payload ?? null; })
      .addCase(createSavedReport.rejected, (s,a)=>{ s.saving = false; s.error = a.error?.message || 'Failed to save report'; })

      .addCase(updateSavedReport.pending, (s)=>{ s.saving = true; s.error=null; })
      .addCase(updateSavedReport.fulfilled, (s,a)=>{ s.saving = false; s.currentSaved = a.payload?.data ?? a.payload ?? null; })
      .addCase(updateSavedReport.rejected, (s,a)=>{ s.saving = false; s.error = a.error?.message || 'Failed to update report'; })

      .addCase(deleteSavedReport.pending, (s)=>{ s.deleting = true; s.error=null; })
      .addCase(deleteSavedReport.fulfilled, (s,a)=>{ s.deleting = false; s.saved = s.saved.filter(r => String(r.id) !== String(a.payload.id)); })
      .addCase(deleteSavedReport.rejected, (s,a)=>{ s.deleting = false; s.error = a.error?.message || 'Failed to delete report'; })

      /** ─── Saved Reports: preview & generate ─── */
      .addCase(previewSavedReport.pending, (s)=>{ s.loadingPreview = true; s.preview=null; s.error=null; })
      .addCase(previewSavedReport.fulfilled, (s,a)=>{ s.loadingPreview = false; s.preview = a.payload?.data ?? a.payload ?? null; })
      .addCase(previewSavedReport.rejected, (s,a)=>{ s.loadingPreview = false; s.error = a.error?.message || 'Failed to preview report'; })

      .addCase(generateSavedReport.pending, (s)=>{ s.generating = true; s.lastDownloadUrl=null; s.error=null; })
      .addCase(generateSavedReport.fulfilled, (s,a)=>{
        s.generating = false;
        const res = a.payload?.data ?? a.payload ?? {};
        s.lastDownloadUrl = res.downloadUrl || res.url || null;
      })
      .addCase(generateSavedReport.rejected, (s,a)=>{ s.generating = false; s.error = a.error?.message || 'Failed to generate report'; });
  }
});

export const { clearReportsState } = slice.actions;
export default slice.reducer;
