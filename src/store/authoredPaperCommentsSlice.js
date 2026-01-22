import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

const msg = (e) => e?.message || 'Request failed';

/* =======================
   THUNKS
======================= */

export const loadAuthoredPaperComments = createAsyncThunk(
  'authoredPaperComments/load',
  async (paperId, { rejectWithValue }) => {
    try {
      return await apiFetch(
        `/authored-papers/${paperId}/comments`,
        { method: 'GET' }
      );
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const addAuthoredPaperComment = createAsyncThunk(
  'authoredPaperComments/add',
  async ({ paperId, body, parent_id = null }, { rejectWithValue }) => {
    try {
      return await apiFetch(
        `/authored-papers/${paperId}/comments`,
        { method: 'POST', body: { body, parent_id } }
      );
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const editAuthoredPaperComment = createAsyncThunk(
  'authoredPaperComments/edit',
  async ({ paperId, id, body }, { rejectWithValue }) => {
    try {
      return await apiFetch(
        `/authored-papers/${paperId}/comments/${id}`,
        { method: 'PUT', body: { body } }
      );
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const deleteAuthoredPaperComment = createAsyncThunk(
  'authoredPaperComments/delete',
  async ({ paperId, id }, { rejectWithValue }) => {
    try {
      await apiFetch(
        `/authored-papers/${paperId}/comments/${id}`,
        { method: 'DELETE' }
      );
      return id;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

/* =======================
   HELPERS
======================= */

const toArr = (v) => (Array.isArray(v) ? v : v?.data ?? []);
const byId = (arr) => Object.fromEntries(arr.map((c) => [c.id, c]));

/* =======================
   SLICE
======================= */

const slice = createSlice({
  name: 'authoredPaperComments',
  initialState: {
    byId: {},
    order: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAuthoredPaperComments: (s) => {
      s.byId = {};
      s.order = [];
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadAuthoredPaperComments.pending, (s) => {
      s.loading = true;
      s.error = null;
    });

    b.addCase(loadAuthoredPaperComments.fulfilled, (s, a) => {
      s.loading = false;
      const rows = toArr(a.payload);
      s.byId = byId(rows);
      s.order = rows.map((r) => r.id);
    });

    b.addCase(loadAuthoredPaperComments.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
    });

    b.addCase(addAuthoredPaperComment.fulfilled, (s, a) => {
      const c = a.payload?.data ?? a.payload;
      s.byId[c.id] = c;
      s.order.push(c.id);
    });

    b.addCase(editAuthoredPaperComment.fulfilled, (s, a) => {
      const c = a.payload?.data ?? a.payload;
      s.byId[c.id] = c;
    });

    b.addCase(deleteAuthoredPaperComment.fulfilled, (s, a) => {
      const id = a.payload;
      delete s.byId[id];
      s.order = s.order.filter((x) => x !== id);
    });
  },
});

export const {
  clearAuthoredPaperComments,
} = slice.actions;

export default slice.reducer;
