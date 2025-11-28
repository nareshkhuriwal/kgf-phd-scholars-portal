// src/store/papersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchPapers,
  fetchPaperById,
  createPaper,
  updatePaper,
  deletePaper,
  uploadPaperFile,
  deletePapersBulk
} from '../services/papersService';

const arr = (v) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);
const obj = (v) => (v && typeof v === 'object' && 'data' in v ? v.data : v);
const msg = (e) => e?.message || 'Request failed';

// ───────────────────────────── Thunks ─────────────────────────────

// Load list (normalized params; frontend callers can pass perPage or per_page)
export const loadPapers = createAsyncThunk(
  'papers/load',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Ensure a consistent default param shape.
      const finalParams = {
        page: params.page ?? 1,
        perPage: params.perPage ?? params.per_page ?? 25,
        // accept search/q/query from callers; service will normalize into `search`
        query: params.query ?? params.search ?? params.q ?? undefined,
        category: params.category ?? undefined,
        // forward any other params if present (filters, sorts)
        ...params
      };

      // remove potential large objects accidentally passed
      // Keep only primitives and arrays for safe serialization
      const safeParams = {};
      Object.entries(finalParams).forEach(([k, v]) => {
        if (v === undefined) return;
        if (typeof v === 'object' && !Array.isArray(v)) {
          // skip nested objects (unless you need JSON-encoding)
          return;
        }
        safeParams[k] = v;
      });

      return await fetchPapers(safeParams);
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// Load one (used by View/Edit pages)
export const loadPaper = createAsyncThunk(
  'papers/loadOne',
  async (id, { rejectWithValue }) => {
    try {
      return await fetchPaperById(id);
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// Create (accepts plain object OR FormData). Optional { onUploadProgress } callback.
export const addPaper = createAsyncThunk(
  'papers/add',
  async (formOrFD, { rejectWithValue }) => {
    try {
      const data = formOrFD?.data ?? formOrFD;
      const onUploadProgress = formOrFD?.onUploadProgress;
      return await createPaper(data, { onUploadProgress });
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// Update (accepts plain object OR FormData). Optional { onUploadProgress } callback.
export const editPaper = createAsyncThunk(
  'papers/edit',
  async ({ id, data, onUploadProgress }, { rejectWithValue }) => {
    try {
      return await updatePaper(id, data, { onUploadProgress });
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// Delete
export const removePaper = createAsyncThunk(
  'papers/remove',
  async (id, { rejectWithValue }) => {
    try {
      await deletePaper(id);
      return id;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// Attach/replace a PDF file for a paper (single-file)
export const attachPaperFile = createAsyncThunk(
  'papers/attachFile',
  async ({ id, file, onUploadProgress }, { rejectWithValue }) => {
    try {
      return await uploadPaperFile(id, file, { onUploadProgress });
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

// NEW: bulk remove
export const removePapersBulk = createAsyncThunk('papers/removeBulk', async (ids, { rejectWithValue }) => {
  try { 
    const res = await deletePapersBulk(ids);
    return res?.deleted ?? ids; 
  } catch (e) { 
    return rejectWithValue(msg(e)); 
  }
});

// ───────────────────────────── State ─────────────────────────────
const initial = {
  list: [],
  current: null,
  meta: null,
  loading: false,
  error: null,

  // upload states (for create/edit with file or attachFile)
  uploading: false,
  progress: null, // 0..100 (number) or null
};

const papersSlice = createSlice({
  name: 'papers',
  initialState: initial,
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    // allow services to dispatch progress updates if they wish
    setUploadProgress: (s, a) => { s.progress = typeof a.payload === 'number' ? a.payload : null; }
  },
  extraReducers: (b) => {
    b
      // ─── List ───
      .addCase(loadPapers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadPapers.fulfilled, (s, a) => {
        s.loading = false;
        s.list = arr(a.payload);
        // Backwards compatibility: some services return { data, meta } while others return top-level array
        s.meta = a.payload?.meta ?? null;
      })
      .addCase(loadPapers.rejected, (s, a) => { s.loading = false; s.error = a.payload; s.list = []; })

      // ─── One ───
      .addCase(loadPaper.pending, (s) => { s.error = null; })
      .addCase(loadPaper.fulfilled, (s, a) => { s.current = obj(a.payload) ?? null; })
      .addCase(loadPaper.rejected, (s, a) => { s.error = a.payload; })

      // ─── Create ───
      .addCase(addPaper.pending, (s) => { s.uploading = true; s.progress = 0; s.error = null; })
      .addCase(addPaper.fulfilled, (s, a) => {
        s.uploading = false; s.progress = null;
        const item = obj(a.payload);
        if (item) s.list = [item, ...s.list];
      })
      .addCase(addPaper.rejected, (s, a) => { s.uploading = false; s.progress = null; s.error = a.payload; })

      // ─── Update ───
      .addCase(editPaper.pending, (s) => { s.uploading = true; s.progress = 0; s.error = null; })
      .addCase(editPaper.fulfilled, (s, a) => {
        s.uploading = false; s.progress = null;
        const item = obj(a.payload);
        if (!item) return;
        s.list = s.list.map((p) => (p.id === item.id ? item : p));
        if (s.current?.id === item.id) s.current = item;
      })
      .addCase(editPaper.rejected, (s, a) => { s.uploading = false; s.progress = null; s.error = a.payload; })

      // ─── Delete ───
      .addCase(removePaper.fulfilled, (s, a) => {
        s.list = s.list.filter((p) => p.id !== a.payload);
        if (s.current?.id === a.payload) s.current = null;
      })

      // ─── Attach file ───
      .addCase(attachPaperFile.pending, (s) => { s.uploading = true; s.progress = 0; s.error = null; })
      .addCase(attachPaperFile.fulfilled, (s, a) => {
        s.uploading = false; s.progress = null;
        const updated = obj(a.payload);   // expect full Paper or at least file meta
        if (!updated) return;

        // If API returns the whole paper, replace it; else patch file fields into current
        if (updated.id) {
          s.list = s.list.map((p) => (p.id === updated.id ? updated : p));
          if (s.current?.id === updated.id) s.current = updated;
        } else if (s.current) {
          s.current = { ...s.current, ...updated };
        }
      })
      .addCase(attachPaperFile.rejected, (s, a) => { s.uploading = false; s.progress = null; s.error = a.payload; })


       // NEW: bulk
      .addCase(removePapersBulk.fulfilled, (s, a) => {
        const removedIds = a.payload || [];
        s.list = s.list.filter((p) => !removedIds.includes(p.id));
        if (s.current && removedIds.includes(s.current.id)) s.current = null;
      });
  }
});

export const { clearCurrent, setUploadProgress } = papersSlice.actions;
export default papersSlice.reducer;
