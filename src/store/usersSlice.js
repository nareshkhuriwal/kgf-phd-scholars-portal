import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/**
 * params: { search, page, per_page, role }
 * Note: build query string here because apiFetch may not accept `params` like axios.
 */
export const loadUsers = createAsyncThunk(
  'users/load',
  async (params = {}, thunkAPI) => {
    try {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.page) qs.set('page', params.page);
      if (params.per_page) qs.set('per_page', params.per_page);
      if (params.role) qs.set('role', params.role);

      const url = `/monitoring/users${qs.toString() ? `?${qs.toString()}` : ''}`;
      const resp = await apiFetch(url);
      // apiFetch likely returns parsed JSON already; adapt if resp.data exists
      const data = resp?.data ?? resp;
      return data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message || 'Failed to load users');
    }
  }
);

const slice = createSlice({
  name: 'users',
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
      .addCase(loadUsers.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loadUsers.fulfilled, (s, a) => {
        s.loading = false;
        const p = a.payload || {};
        // Laravel style paginator: { data: [...], total, current_page, per_page, ... }
        s.rows = Array.isArray(p.data) ? p.data : (Array.isArray(p) ? p : []);
        s.total = p.total ?? (p.meta?.total) ?? s.rows.length;
        s.current_page = p.current_page ?? (p.meta?.current_page) ?? 1;
        s.per_page = p.per_page ?? (p.meta?.per_page) ?? 25;
      })
      .addCase(loadUsers.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      });
  },
});

export const selectUsersState = (s) => s.users || slice.getInitialState();
export default slice.reducer;
