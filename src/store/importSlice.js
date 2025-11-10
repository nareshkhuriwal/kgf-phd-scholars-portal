import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

async function tryEndpoints(form) {
  // 1) preferred
  try {
    return await apiFetch('/library/import', { method: 'POST', body: form });
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  // 2) fallback (if your backend exposes this)
  return await apiFetch('/papers/import', { method: 'POST', body: form });
}

export const importFiles = createAsyncThunk(
  'import/files',
  async (files, { rejectWithValue }) => {
    try {
      const form = new FormData();
      files.forEach((f) => form.append('files[]', f, f.name));
      // you can append optional flags: form.append('parse', 'bibtex|ris|csv|pdf')
      const res = await tryEndpoints(form);
      // Normalize a bit: { created: [], skipped: [], errors: [] }
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
