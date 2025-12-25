// src/store/settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// Fetch available citation styles from backend
export const fetchCitationStyles = createAsyncThunk(
  'settings/fetchCitationStyles',
  async () => {
    const res = await apiFetch('/citation-styles');
    return res.styles || {};
  }
);

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const res = await apiFetch('/settings');
  return res.settings || {};
});

export const saveSettings = createAsyncThunk(
  'settings/save',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/settings', {
        method: 'PUT',
        body: payload,
      });
      return res.settings || payload;
    } catch (e) {
      return rejectWithValue(e.message || 'Save failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: payload,
      });
      return res.message || 'Password updated successfully.';
    } catch (e) {
      return rejectWithValue(e.message || 'Password change failed');
    }
  }
);

const DEFAULTS = {
  citationStyle: 'ieee',
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

    // Citation styles
    citationStyles: {},
    citationStylesLoading: false,
    citationStylesError: null,

    // Change password
    changePasswordLoading: false,
    changePasswordError: null,
    changePasswordSuccess: null,
  },
  reducers: {
    resetSettings(state) {
      state.data = DEFAULTS;
    },
    resetChangePasswordStatus(state) {
      state.changePasswordLoading = false;
      state.changePasswordError = null;
      state.changePasswordSuccess = null;
    },
  },
  extraReducers: (b) => {
    // Fetch citation styles
    b.addCase(fetchCitationStyles.pending, (s) => {
      s.citationStylesLoading = true;
      s.citationStylesError = null;
    });
    b.addCase(fetchCitationStyles.fulfilled, (s, a) => {
      s.citationStylesLoading = false;
      s.citationStyles = a.payload;
    });
    b.addCase(fetchCitationStyles.rejected, (s, a) => {
      s.citationStylesLoading = false;
      s.citationStylesError = a.error.message;
    });

    // Fetch settings
    b.addCase(fetchSettings.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload };
    });
    b.addCase(fetchSettings.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message;
    });

    // Save settings
    b.addCase(saveSettings.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(saveSettings.fulfilled, (s, a) => {
      s.loading = false;
      s.data = { ...DEFAULTS, ...a.payload };
      s.savedAt = Date.now();
    });
    b.addCase(saveSettings.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || a.error.message;
    });

    // Change password
    b.addCase(changePassword.pending, (s) => {
      s.changePasswordLoading = true;
      s.changePasswordError = null;
      s.changePasswordSuccess = null;
    });
    b.addCase(changePassword.fulfilled, (s, a) => {
      s.changePasswordLoading = false;
      s.changePasswordSuccess = a.payload || 'Password updated successfully.';
      s.changePasswordError = null;
    });
    b.addCase(changePassword.rejected, (s, a) => {
      s.changePasswordLoading = false;
      s.changePasswordError = a.payload || a.error.message || 'Password change failed';
      s.changePasswordSuccess = null;
    });
  },
});

export const { resetSettings, resetChangePasswordStatus } = settingsSlice.actions;
export default settingsSlice.reducer;