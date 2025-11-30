// src/store/monitoringStatsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

export const loadMonitoringStats = createAsyncThunk(
  'monitoringStats/load',
  async (_, thunkAPI) => {
    try {
      const resp = await apiFetch('/monitoring/analytics');
      // apiFetch may return { data } or raw; handle both
      const data = resp?.data ?? resp;
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message || 'Failed to load monitoring stats');
    }
  }
);

const slice = createSlice({
  name: 'monitoringStats',
  initialState: { data: {}, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadMonitoringStats.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(loadMonitoringStats.fulfilled, (s, a) => { s.loading = false; s.data = a.payload || {}; });
    b.addCase(loadMonitoringStats.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error?.message; });
  },
});

export const selectMonitoringStats = (state) => state.monitoringStats || slice.getInitialState();
export default slice.reducer;
