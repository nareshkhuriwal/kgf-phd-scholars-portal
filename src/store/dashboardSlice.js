import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/** Thunks */
export const loadDashboardSummary = createAsyncThunk(
  'dashboard/loadSummary',
  async () => {
    const res = await apiFetch('/dashboard/summary', { method: 'GET' });
    return res?.data ?? res;
  }
);

export const loadDashboardDaily = createAsyncThunk(
  'dashboard/loadDaily',
  async () => {
    const res = await apiFetch('/dashboard/series/daily', { method: 'GET' });
    return res?.data ?? res; // { labels:[], added:[], reviewed:[] }
  }
);

export const loadDashboardWeekly = createAsyncThunk(
  'dashboard/loadWeekly',
  async () => {
    const res = await apiFetch('/dashboard/series/weekly', { method: 'GET' });
    return res?.data ?? res; // { labels:[], added:[], reviewed:[] }
  }
);

const initialState = {
  // loading flags
  loadingSummary: false,
  loadingDaily: false,
  loadingWeekly: false,
  errorSummary: null,
  errorDaily: null,
  errorWeekly: null,

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
};

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // optional: one-shot reset
    resetDashboard(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (b) => {
    // SUMMARY
    b.addCase(loadDashboardSummary.pending, (s) => {
      s.loadingSummary = true; s.errorSummary = null;
    });
    b.addCase(loadDashboardSummary.fulfilled, (s, a) => {
      s.loadingSummary = false;
      const d = a.payload || {};
      if (d.totals) s.totals = { ...s.totals, ...d.totals };
      if (Array.isArray(d.byCategory)) s.byCategory = d.byCategory;
    });
    b.addCase(loadDashboardSummary.rejected, (s, a) => {
      s.loadingSummary = false; s.errorSummary = a.error?.message || 'Failed to load summary';
    });

    // DAILY
    b.addCase(loadDashboardDaily.pending, (s) => {
      s.loadingDaily = true; s.errorDaily = null;
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
      s.loadingDaily = false; s.errorDaily = a.error?.message || 'Failed to load daily series';
    });

    // WEEKLY
    b.addCase(loadDashboardWeekly.pending, (s) => {
      s.loadingWeekly = true; s.errorWeekly = null;
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
      s.loadingWeekly = false; s.errorWeekly = a.error?.message || 'Failed to load weekly series';
    });
  }
});

export const { resetDashboard } = slice.actions;
export default slice.reducer;
