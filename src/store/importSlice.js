import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

async function tryEndpoints(form) {
  try {
    return await apiFetch('/library/import', { method: 'POST', body: form });
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  return await apiFetch('/papers/import', { method: 'POST', body: form });
}

export const importFiles = createAsyncThunk(
  'import/files',
  async (payload, { rejectWithValue }) => {
    try {
      const form = new FormData();

      let files = [];
      let sources = {};
      let options = {};

      // -------------------------------
      // ✅ NORMALIZE PAYLOAD
      // -------------------------------
      if (Array.isArray(payload)) {
        files = payload;
      } else if (payload && typeof payload === 'object') {
        files = payload.files || [];
        sources = payload.sources || {};
        options = payload.options || {};
      }

      if (!Array.isArray(files)) {
        throw new Error('Invalid import payload');
      }

      // -------------------------------
      // Files
      // -------------------------------
      files.forEach(f => {
        if (f instanceof File) {
          form.append('files[]', f, f.name);
        }
      });

      // -------------------------------
      // CSV
      // -------------------------------
      if (sources.csv instanceof File) {
        form.append('csv', sources.csv, sources.csv.name);
      }

      // -------------------------------
      // URLs
      // -------------------------------
      if (Array.isArray(sources.urls) && sources.urls.length) {
        form.append('urls', JSON.stringify(sources.urls));
      }

      // -------------------------------
      // BibTeX / RIS
      // -------------------------------
      if (typeof sources.bibtex === 'string' && sources.bibtex.trim()) {
        form.append('bibtex', sources.bibtex);
      }

      // -------------------------------
      // Options (future-proof)
      // -------------------------------
      Object.entries(options).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });

      const res = await tryEndpoints(form);

      const data = res?.data ?? res ?? {};

      return {
        created: data.created ?? data.papers ?? [],
        skipped: data.skipped ?? [],
        errors: data.errors ?? [],
      };
    } catch (e) {
      return rejectWithValue(e?.message || 'Import failed');
    }
  }
);


const slice = createSlice({
  name: 'importer',
  initialState: {
    uploading: false,
    result: null,  // { created, skipped, errors }
    error: null,
  },
  reducers: {
    clearImportState: (s) => { s.uploading = false; s.result = null; s.error = null; }
  },
  extraReducers: (b) => {
    b
      .addCase(importFiles.pending, (s) => { s.uploading = true; s.error = null; s.result = null; })
      .addCase(importFiles.fulfilled, (s, a) => { s.uploading = false; s.result = a.payload; })
      .addCase(importFiles.rejected, (s, a) => { s.uploading = false; s.error = a.payload || 'Import failed'; });
  }
});

export const { clearImportState } = slice.actions;
export default slice.reducer;
