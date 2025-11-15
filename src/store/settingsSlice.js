// src/store/settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// ─────────────────────────────────────────────────────────────
// Existing settings thunks
// ─────────────────────────────────────────────────────────────

// server returns { settings: { ... } }
export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const res = await apiFetch('/settings');
  return res.settings || {}; // <- IMPORTANT
});

export const saveSettings = createAsyncThunk(
  'settings/save',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/settings', {
        method: 'PUT',
        body: payload,
      });
      return res.settings || payload; // <- server echoes { settings }
    } catch (e) {
      return rejectWithValue(e.message || 'Save failed');
    }
  }
);

// ─────────────────────────────────────────────────────────────
// NEW: change password thunk
// Adjust endpoint `/auth/change-password` if your API uses a different path
// Expects Laravel route to accept: current_password, password, password_confirmation
// and return { message: "..."} on success.
// ─────────────────────────────────────────────────────────────

export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: payload,
      });
      // You can shape this based on your API; keep it simple:
      return res.message || 'Password updated successfully.';
    } catch (e) {
      return rejectWithValue(e.message || 'Password change failed');
    }
  }
);

const DEFAULTS = {
  citationStyle: 'chicago-note-bibliography-short',
  noteFormat: 'markdown+richtext',
  language: 'en-US',
  quickCopyAsHtml: false,
  includeUrls: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: DEFAULTS,
    loading: false,
    error: null,
    savedAt: null,

    // NEW: change-password specific state
    changePasswordLoading: false,
    changePasswordError: null,
    changePasswordSuccess: null,
  },
  reducers: {
    resetSettings(state) {
      state.data = DEFAULTS;
    },
    // NEW: helper to clear change-password status when dialog closes
    resetChangePasswordStatus(state) {
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = null;
    },
  },
  extraReducers: (b) => {
    // ── existing settings fetch/save ──
    b.addCase(fetchSettings.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload }; // <- MERGE defaults + server
    });
    b.addCase(fetchSettings.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message;
    });

    b.addCase(saveSettings.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(saveSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload }; // <- keep store in sync
      s.savedAt = Date.now();
    });
    b.addCase(saveSettings.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || a.error.message;
    });

    // ── NEW: change password reducers ──
    b.addCase(changePassword.pending, (s) => {
      s.changePasswordLoading = true;
      s.changePasswordError = null;
      s.changePasswordSuccess = null;
    });
    b.addCase(changePassword.fulfilled, (s, a) => {
      s.changePasswordLoading = false;
      s.changePasswordSuccess =
        a.payload || 'Password updated successfully.';
      s.changePasswordError = null;
    });
    b.addCase(changePassword.rejected, (s, a) => {
      s.changePasswordLoading = false;
      s.changePasswordError =
        a.payload || a.error.message || 'Password change failed';
      s.changePasswordSuccess = null;
    });
  },
});

export const { resetSettings, resetChangePasswordStatus } = settingsSlice.actions;
export default settingsSlice.reducer;
