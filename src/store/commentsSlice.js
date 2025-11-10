import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

const msg = (e) => e?.message || 'Request failed';

export const loadComments = createAsyncThunk(
  'comments/load',
  async (paperId, { rejectWithValue }) => {
    try { return await apiFetch(`/papers/${paperId}/comments`, { method: 'GET' }); }
    catch (e) { return rejectWithValue(msg(e)); }
  }
);

export const addComment = createAsyncThunk(
  'comments/add',
  async ({ paperId, body, parent_id = null }, { rejectWithValue }) => {
    try { return await apiFetch(`/papers/${paperId}/comments`, { method: 'POST', body: { body, parent_id } }); }
    catch (e) { return rejectWithValue(msg(e)); }
  }
);

export const editComment = createAsyncThunk(
  'comments/edit',
  async ({ paperId, id, body }, { rejectWithValue }) => {
    try { return await apiFetch(`/papers/${paperId}/comments/${id}`, { method: 'PUT', body: { body } }); }
    catch (e) { return rejectWithValue(msg(e)); }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/delete',
  async ({ paperId, id }, { rejectWithValue }) => {
    try { await apiFetch(`/papers/${paperId}/comments/${id}`, { method: 'DELETE' }); return id; }
    catch (e) { return rejectWithValue(msg(e)); }
  }
);

const toArr = (v) => (Array.isArray(v) ? v : v?.data ?? []);
const byId = (arr) => Object.fromEntries(arr.map((c) => [c.id, c]));

const slice = createSlice({
  name: 'comments',
  initialState: { byId: {}, order: [], loading: false, error: null },
  reducers: { clearComments: (s) => { s.byId = {}; s.order = []; s.error = null; } },
  extraReducers: (b) => {
    b.addCase(loadComments.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(loadComments.fulfilled, (s, a) => {
      s.loading = false;
      const rows = toArr(a.payload);
      s.byId = byId(rows);
      s.order = rows.map((r) => r.id);
    });
    b.addCase(loadComments.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(addComment.fulfilled, (s, a) => {
      const c = a.payload?.data ?? a.payload;
      s.byId[c.id] = c;
      s.order.push(c.id);
    });
    b.addCase(editComment.fulfilled, (s, a) => {
      const c = a.payload?.data ?? a.payload;
      s.byId[c.id] = c;
    });
    b.addCase(deleteComment.fulfilled, (s, a) => {
      const id = a.payload;
      delete s.byId[id];
      s.order = s.order.filter((x) => x !== id);
    });
  }
});

export const { clearComments } = slice.actions;
export default slice.reducer;
