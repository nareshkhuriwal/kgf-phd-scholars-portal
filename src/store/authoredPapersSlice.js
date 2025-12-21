// src/store/authoredPapersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// -----------------------------
// Load list (My Research Papers)
// -----------------------------
export const loadMyPapers = createAsyncThunk(
  'authoredPapers/load',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiFetch('/my-papers', { params });
    } catch (e) {
      return rejectWithValue(e?.message || 'Failed to load papers');
    }
  }
);

// -----------------------------
// Create new paper (TITLE REQUIRED)
// -----------------------------
export const createPaper = createAsyncThunk(
  'authoredPapers/create',
  async ({ title }, { rejectWithValue }) => {
    try {
      return await apiFetch('/my-papers', {
        method: 'POST',
        body: { title },
      });
    } catch (e) {
      return rejectWithValue(e?.message || 'Failed to create paper');
    }
  }
);

// -----------------------------
// Fetch single paper with sections
// -----------------------------
export const fetchPaper = createAsyncThunk(
  'authoredPapers/fetch',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch(`/my-papers/${id}`);
    } catch (e) {
      return rejectWithValue(e?.message || 'Failed to fetch paper');
    }
  }
);

// -----------------------------
// Autosave paper (title + sections)
// -----------------------------
export const savePaper = createAsyncThunk(
  'authoredPapers/save',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await apiFetch(`/my-papers/${id}`, {
        method: 'PUT',
        body: payload,
      });
    } catch (e) {
      return rejectWithValue(e?.message || 'Failed to save paper');
    }
  }
);

// =============================
// SLICE
// =============================
const authoredPapersSlice = createSlice({
  name: 'authoredPapers',
  initialState: {
    list: [],
    current: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearCurrentPaper(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ---------- LOAD LIST ----------
      .addCase(loadMyPapers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMyPapers.fulfilled, (state, action) => {
        state.list = action.payload?.data || [];
        state.loading = false;
      })
      .addCase(loadMyPapers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------- CREATE ----------
      .addCase(createPaper.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPaper.fulfilled, (state, action) => {
        state.saving = false;
        // optional optimistic insert
        if (action.payload?.id) {
          state.list.unshift({
            id: action.payload.id,
            title: action.meta.arg.title,
            status: 'draft',
            updated_at: new Date().toISOString(),
          });
        }
      })
      .addCase(createPaper.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // ---------- FETCH SINGLE ----------
      .addCase(fetchPaper.pending, (state) => {
        state.loading = true;
        state.current = null;
        state.error = null;
      })
      .addCase(fetchPaper.fulfilled, (state, action) => {
        state.current = action.payload;
        state.loading = false;
      })
      .addCase(fetchPaper.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------- AUTOSAVE ----------
      .addCase(savePaper.pending, (state) => {
        state.saving = true;
      })
      .addCase(savePaper.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(savePaper.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentPaper } = authoredPapersSlice.actions;

export default authoredPapersSlice.reducer;
