import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/** Helper to build query string from scope + userId */
const buildQuery = (base, { scope, userId } = {}) => {
  const params = new URLSearchParams();
  if (scope) params.set('scope', scope);
  if (userId) params.set('user_id', userId);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

/** Thunks */
// SUMMARY (role-aware)
export const loadDashboardSummary = createAsyncThunk(
  'dashboard/loadSummary',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const url = buildQuery('/dashboard/summary', payload);
      const res = await apiFetch(url, { method: 'GET' });
      return res?.data ?? res;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load summary');
    }
  }
);

// DAILY SERIES (role-aware)
export const loadDashboardDaily = createAsyncThunk(
  'dashboard/loadDaily',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const url = buildQuery('/dashboard/series/daily', payload);
      const res = await apiFetch(url, { method: 'GET' });
      return res?.data ?? res; // { labels:[], added:[], reviewed:[] }
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load daily series');
    }
  }
);

// WEEKLY SERIES (role-aware)
export const loadDashboardWeekly = createAsyncThunk(
  'dashboard/loadWeekly',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const url = buildQuery('/dashboard/series/weekly', payload);
      const res = await apiFetch(url, { method: 'GET' });
      return res?.data ?? res; // { labels:[], added:[], reviewed:[] }
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load weekly series');
    }
  }
);

// FILTERS: supervisors + researchers (for dropdown)
export const loadDashboardFilters = createAsyncThunk(
  'dashboard/loadFilters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/dashboard/filters', { method: 'GET' });
      return res?.data ?? res; // { supervisors:[], researchers:[] }
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load dashboard filters');
    }
  }
);

const initialState = {
  // loading flags
  loadingSummary: false,
  loadingDaily: false,
  loadingWeekly: false,
  loadingFilters: false,

  // errors
  errorSummary: null,
  errorDaily: null,
  errorWeekly: null,
  errorFilters: null,

  // summary payload
  totals: {
    totalPapers: 0,
    reviewedPapers: 0,
    inQueue: 0,
    started: 0,
    collections: 0,
  },
  byCategory: [],

  // series
  daily: { labels: [], added: [], reviewed: [] },
  weekly: { labels: [], added: [], reviewed: [] },

  // filters for professional dropdown
  filters: {
    supervisors: [],
    researchers: [],
  },
};

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // one-shot reset
    resetDashboard(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (b) => {
    // SUMMARY
    b.addCase(loadDashboardSummary.pending, (s) => {
      s.loadingSummary = true;
      s.errorSummary = null;
    });
    b.addCase(loadDashboardSummary.fulfilled, (s, a) => {
      s.loadingSummary = false;
      const d = a.payload || {};
      if (d.totals) s.totals = { ...s.totals, ...d.totals };
      if (Array.isArray(d.byCategory)) s.byCategory = d.byCategory;
    });
    b.addCase(loadDashboardSummary.rejected, (s, a) => {
      s.loadingSummary = false;
      s.errorSummary =
        a.payload || a.error?.message || 'Failed to load summary';
    });

    // DAILY
    b.addCase(loadDashboardDaily.pending, (s) => {
      s.loadingDaily = true;
      s.errorDaily = null;
    });
    b.addCase(loadDashboardDaily.fulfilled, (s, a) => {
      s.loadingDaily = false;
      const d = a.payload || {};
      s.daily = {
        labels: Array.isArray(d.labels) ? d.labels : [],
        added: Array.isArray(d.added) ? d.added : [],
        reviewed: Array.isArray(d.reviewed) ? d.reviewed : [],
      };
    });
    b.addCase(loadDashboardDaily.rejected, (s, a) => {
      s.loadingDaily = false;
      s.errorDaily =
        a.payload || a.error?.message || 'Failed to load daily series';
    });

    // WEEKLY
    b.addCase(loadDashboardWeekly.pending, (s) => {
      s.loadingWeekly = true;
      s.errorWeekly = null;
    });
    b.addCase(loadDashboardWeekly.fulfilled, (s, a) => {
      s.loadingWeekly = false;
      const d = a.payload || {};
      s.weekly = {
        labels: Array.isArray(d.labels) ? d.labels : [],
        added: Array.isArray(d.added) ? d.added : [],
        reviewed: Array.isArray(d.reviewed) ? d.reviewed : [],
      };
    });
    b.addCase(loadDashboardWeekly.rejected, (s, a) => {
      s.loadingWeekly = false;
      s.errorWeekly =
        a.payload || a.error?.message || 'Failed to load weekly series';
    });

    // FILTERS (supervisors + researchers)
    b.addCase(loadDashboardFilters.pending, (s) => {
      s.loadingFilters = true;
      s.errorFilters = null;
    });
    b.addCase(loadDashboardFilters.fulfilled, (s, a) => {
      s.loadingFilters = false;
      const d = a.payload || {};
      s.filters = {
        supervisors: Array.isArray(d.supervisors) ? d.supervisors : [],
        researchers: Array.isArray(d.researchers) ? d.researchers : [],
      };
    });
    b.addCase(loadDashboardFilters.rejected, (s, a) => {
      s.loadingFilters = false;
      s.errorFilters =
        a.payload || a.error?.message || 'Failed to load dashboard filters';
    });
  },
});

export const { resetDashboard } = slice.actions;
export default slice.reducer;
