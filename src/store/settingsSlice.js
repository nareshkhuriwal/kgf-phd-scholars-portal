// src/store/settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// server returns { settings: { ... } }
export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const res = await apiFetch('/settings');
  return res.settings || {}; // <- IMPORTANT
});

export const saveSettings = createAsyncThunk('settings/save', async (payload, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/settings', {
      method: 'PUT',
      body: payload,
    });
    return res.settings || payload; // <- server echoes { settings }
  } catch (e) {
    return rejectWithValue(e.message || 'Save failed');
  }
});

const DEFAULTS = {
  citationStyle: 'chicago-note-bibliography-short',
  noteFormat: 'markdown+richtext',
  language: 'en-US',
  quickCopyAsHtml: false,
  includeUrls: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { data: DEFAULTS, loading: false, error: null, savedAt: null },
  reducers: {
    resetSettings(state) { state.data = DEFAULTS; },
  },
  extraReducers: (b) => {
    b.addCase(fetchSettings.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload }; // <- MERGE defaults + server
    });
    b.addCase(fetchSettings.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });

    b.addCase(saveSettings.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(saveSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload }; // <- keep store in sync
      s.savedAt = Date.now();
    });
    b.addCase(saveSettings.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; });
  },
});

export const { resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
