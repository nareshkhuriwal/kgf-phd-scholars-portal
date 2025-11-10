// src/store/collectionsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/* =========================
   Thunks
========================= */

// List all collections
export const loadCollections = createAsyncThunk('collections/loadAll', async () => {
  return await apiFetch('/collections', { method: 'GET' });
});

// Create
export const createCollection = createAsyncThunk('collections/create', async (payload) => {
  return await apiFetch('/collections', { method: 'POST', body: payload });
});

// Update meta (name/description, etc.)
export const updateCollection = createAsyncThunk('collections/update', async ({ id, data }) => {
  return await apiFetch(`/collections/${id}`, { method: 'PUT', body: data });
});

// Delete collection
export const deleteCollection = createAsyncThunk('collections/delete', async (id) => {
  await apiFetch(`/collections/${id}`, { method: 'DELETE' });
  return id;
});

// Load a single collection (with papers & meta)
export const loadCollection = createAsyncThunk('collections/loadOne', async (id) => {
  return await apiFetch(`/collections/${id}`, { method: 'GET' });
});

/* ---- Legacy (still supported) list papers for a collection ---- */
export const loadCollectionPapers = createAsyncThunk('collections/loadPapers', async (id) => {
  return await apiFetch(`/collections/${id}/papers`, { method: 'GET' });
});

/* ---- Add/Remove papers ---- */
// Single add (legacy compatibility)
export const addPaperToCollection = createAsyncThunk('collections/addPaper', async ({ collectionId, paperId }) => {
  return await apiFetch(`/collections/${collectionId}/papers`, { method: 'POST', body: { paperId } });
});

// Bulk add (preferred)
export const addPapersToCollection = createAsyncThunk('collections/addPapers', async ({ id, paper_ids }) => {
  return await apiFetch(`/collections/${id}/papers`, { method: 'POST', body: { paper_ids } });
});

// Single remove (legacy compatibility)
export const removePaperFromCollection = createAsyncThunk('collections/removePaper', async ({ collectionId, paperId }) => {
  await apiFetch(`/collections/${collectionId}/papers/${paperId}`, { method: 'DELETE' });
  return { collectionId, paperId };
});

// Bulk remove (preferred)
export const removePapersFromCollection = createAsyncThunk('collections/removePapers', async ({ id, paper_ids }) => {
  // NOTE: apiFetch should support a JSON body with DELETE. If not, switch to POST /delete with body.
  await apiFetch(`/collections/${id}/papers`, { method: 'DELETE', body: { paper_ids } });
  return { id, paper_ids };
});

/* =========================
   Slice
========================= */

const slice = createSlice({
  name: 'collections',
  initialState: {
    list: [],
    current: null,          // { id, name, description, papers: [...] }
    currentPapers: [],      // kept for backward-compat with old UI
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      /* ---- List ---- */
      .addCase(loadCollections.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadCollections.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadCollections.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load collections';
      })

      /* ---- Create / Update / Delete ---- */
      .addCase(createCollection.pending, (s)=>{ s.saving = true; s.error = null; })
      .addCase(createCollection.fulfilled, (s, a) => {
        s.saving = false;
        const item = a.payload?.data ?? a.payload;
        if (item) s.list.unshift(item);
      })
      .addCase(createCollection.rejected, (s, a)=>{ s.saving = false; s.error = a.error?.message || 'Create failed'; })

      .addCase(updateCollection.pending, (s)=>{ s.saving = true; s.error = null; })
      .addCase(updateCollection.fulfilled, (s, a) => {
        s.saving = false;
        const item = a.payload?.data ?? a.payload;
        const i = s.list.findIndex(x => x.id === item?.id);
        if (i >= 0) s.list[i] = item;
        // keep current in sync if we have it open
        if (s.current && s.current.id === item?.id) {
          s.current = { ...s.current, ...item };
        }
      })
      .addCase(updateCollection.rejected, (s, a)=>{ s.saving = false; s.error = a.error?.message || 'Update failed'; })

      .addCase(deleteCollection.fulfilled, (s, a) => {
        s.list = s.list.filter(x => x.id !== a.payload);
        if (s.current?.id === a.payload) {
          s.current = null;
          s.currentPapers = [];
        }
      })

      /* ---- Load one collection ---- */
      .addCase(loadCollection.pending, (s)=>{ s.loading = true; s.error = null; })
      .addCase(loadCollection.fulfilled, (s, a) => {
        s.loading = false;
        const col = a.payload?.data ?? a.payload ?? null;
        s.current = col;
        s.currentPapers = Array.isArray(col?.papers) ? col.papers : [];
      })
      .addCase(loadCollection.rejected, (s, a)=>{ s.loading = false; s.error = a.error?.message || 'Failed to load collection'; })

      /* ---- Legacy papers list (still works) ---- */
      .addCase(loadCollectionPapers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadCollectionPapers.fulfilled, (s, a) => {
        s.loading = false;
        s.currentPapers = a.payload?.data ?? a.payload ?? [];
        if (s.current) s.current = { ...s.current, papers: s.currentPapers };
      })
      .addCase(loadCollectionPapers.rejected, (s, a) => { s.loading = false; s.error = a.error?.message || 'Failed to load collection papers'; })

      /* ---- Add (single + bulk) ---- */
      .addCase(addPaperToCollection.fulfilled, (s, a) => {
        const row = a.payload?.data ?? a.payload;
        if (!row) return;
        s.currentPapers.unshift(row);
        if (s.current) s.current = { ...s.current, papers: s.currentPapers };
      })
      .addCase(addPapersToCollection.fulfilled, (s, a) => {
        const rows = a.payload?.data ?? a.payload ?? [];
        if (Array.isArray(rows) && rows.length) {
          s.currentPapers = [...rows, ...s.currentPapers];
          if (s.current) s.current = { ...s.current, papers: s.currentPapers };
        }
      })

      /* ---- Remove (single + bulk) ---- */
      .addCase(removePaperFromCollection.fulfilled, (s, a) => {
        const { paperId } = a.payload;
        s.currentPapers = s.currentPapers.filter(p => p.id !== paperId);
        if (s.current) s.current = { ...s.current, papers: s.currentPapers };
      })
      .addCase(removePapersFromCollection.fulfilled, (s, a) => {
        const ids = new Set(a.payload.paper_ids || []);
        s.currentPapers = s.currentPapers.filter(p => !ids.has(p.id));
        if (s.current) s.current = { ...s.current, papers: s.currentPapers };
      });
  }
});

export default slice.reducer;
