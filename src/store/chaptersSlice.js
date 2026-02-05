// -------------------------------------------------
// src/store/chaptersSlice.js  (user-based, no sections)
// -------------------------------------------------
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

const chaptersAdapter = createEntityAdapter({
  sortComparer: (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
});

const normalizeItems = (res) =>
  Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);

// ---------- Thunks ----------
/** If your API infers user from auth, call with no args. If it requires user_id, pass it. */
export const fetchChapters = createAsyncThunk('chapters/fetchAll', async (user_id) => {
  const qs = user_id ? `?user_id=${encodeURIComponent(user_id)}` : '';
  const res = await apiFetch(`/chapters${qs}`);
  return {
    items: normalizeItems(res),
    meta: !Array.isArray(res)
      ? { total: res?.total, page: res?.current_page, perPage: res?.per_page, lastPage: res?.last_page }
      : null,
  };
});

export const createChapter = createAsyncThunk(
  'chapters/create',
  async ({ title, chapter_type, chapter_section, order_index = 0, body_html = '', user_id }) => {
    const body = {
      title,
      chapter_type,        // ✅ FIX
      chapter_section,
      order_index,
      body_html,
    };

    if (user_id) body.user_id = user_id;

    return await apiFetch(`/chapters`, {
      method: 'POST',
      body,
    });
  }
);

export const updateChapter = createAsyncThunk(
  'chapters/update',
  async ({ id, changes }) => {
    return await apiFetch(`/chapters/${id}`, {
      method: 'PUT',
      body: changes,
    });
  }
);


export const deleteChapter = createAsyncThunk(
  'chapters/delete',
  async (id) => {
    await apiFetch(`/chapters/${id}`, { method: 'DELETE' });
    return id;
  }
);

export const reorderChapters = createAsyncThunk('chapters/reorder', async (orderedIds) => {
  const res = await apiFetch(`/chapters/reorder`, {
    method: 'POST',
    body: { items: orderedIds.map((id, i) => ({ id, order_index: i })) },
  });
  return normalizeItems(res);
});

// ---------- Slice ----------
const chaptersSlice = createSlice({
  name: 'chapters',
  initialState: {
    ...chaptersAdapter.getInitialState(),
    loading: false,
    error: null,
    meta: null,
    user_id: null,
  },
  reducers: {
    setUserId(state, action) { state.user_id = action.payload; },
    clearChapters(state) {
      chaptersAdapter.removeAll(state);
      state.loading = false;
      state.error = null;
      state.meta = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChapters.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchChapters.fulfilled, (state, action) => {
        state.loading = false;
        chaptersAdapter.setAll(state, action.payload?.items ?? []);
        state.meta = action.payload?.meta || null;
      })
      .addCase(fetchChapters.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message;
      })
      .addCase(createChapter.fulfilled, (state, action) => {
        chaptersAdapter.addOne(state, action.payload);
      })
      .addCase(updateChapter.fulfilled, (state, action) => {
        const resp = action.payload?.data ?? action.payload;

        if (!resp?.id) return;

        // Store ONLY server-returned decoded content
        chaptersAdapter.upsertOne(state, resp);
      })

      .addCase(deleteChapter.fulfilled, (state, action) => {
        chaptersAdapter.removeOne(state, action.payload);
      })
      .addCase(reorderChapters.fulfilled, (state, action) => {
        chaptersAdapter.setAll(state, action.payload);
      });
  },
});

export const { selectAll: selectAllChapters } = chaptersAdapter.getSelectors((s) => s.chapters);
export const { setUserId, clearChapters } = chaptersSlice.actions;
export default chaptersSlice.reducer;
