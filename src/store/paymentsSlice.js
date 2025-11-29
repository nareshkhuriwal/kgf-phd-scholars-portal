import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/**
 * params: { q, page, per_page }
 * Note: payments endpoint in your backend expects `q` param (from earlier examples).
 */
export const loadPayments = createAsyncThunk(
  'payments/load',
  async (params = {}, thunkAPI) => {
    try {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.page) qs.set('page', params.page);
      if (params.per_page) qs.set('per_page', params.per_page);

      const url = `/monitoring/payments${qs.toString() ? `?${qs.toString()}` : ''}`;
      const resp = await apiFetch(url);
      const data = resp?.data ?? resp;
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message || 'Failed to load payments');
    }
  }
);

const slice = createSlice({
  name: 'payments',
  initialState: {
    rows: [],
    total: 0,
    current_page: 1,
    per_page: 25,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadPayments.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loadPayments.fulfilled, (s, a) => {
        s.loading = false;
        const p = a.payload || {};
        s.rows = Array.isArray(p.data) ? p.data : (Array.isArray(p) ? p : []);
        s.total = p.total ?? (p.meta?.total) ?? s.rows.length;
        s.current_page = p.current_page ?? (p.meta?.current_page) ?? 1;
        s.per_page = p.per_page ?? (p.meta?.per_page) ?? 25;
      })
      .addCase(loadPayments.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      });
  },
});

export const selectPaymentsState = (s) => s.payments || slice.getInitialState();
export default slice.reducer;
