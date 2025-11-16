// src/store/supervisorsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// ⚠️ adjust this import if your api helper lives elsewhere
import { apiFetch } from '../services/api';

// --- Thunks ---------------------------------------------------------------

export const loadSupervisors = createAsyncThunk(
  'supervisors/loadSupervisors',
  async (_, thunkAPI) => {
    try {
      const res = await apiFetch('/supervisors', { method: 'GET' });
      // expect: { data: [...], meta: { total: n } } or just array
      if (Array.isArray(res)) {
        return { rows: res, total: res.length };
      }
      return {
        rows: res.data || [],
        total: res.meta?.total ?? (res.data?.length ?? 0),
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to load supervisors');
    }
  }
);

export const createSupervisor = createAsyncThunk(
  'supervisors/createSupervisor',
  async (payload, thunkAPI) => {
    try {
      // payload: { name, email, notes? } etc.
      const res = await apiFetch('/supervisors', {
        method: 'POST',
        body: payload,
      });
      return res.data || res;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to create supervisor');
    }
  }
);

export const updateSupervisor = createAsyncThunk(
  'supervisors/updateSupervisor',
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await apiFetch(`/supervisors/${id}`, {
        method: 'PUT',
        body: data,
      });
      return res.data || res;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to update supervisor');
    }
  }
);

export const deleteSupervisor = createAsyncThunk(
  'supervisors/deleteSupervisor',
  async (id, thunkAPI) => {
    try {
      await apiFetch(`/supervisors/${id}`, { method: 'DELETE' });
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to delete supervisor');
    }
  }
);

// --- Slice ----------------------------------------------------------------

const supervisorsSlice = createSlice({
  name: 'supervisors',
  initialState: {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    saving: false,
    saveError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Load
    builder
      .addCase(loadSupervisors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSupervisors.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(loadSupervisors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Error';
      });

    // Create
    builder
      .addCase(createSupervisor.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createSupervisor.fulfilled, (state, action) => {
        state.saving = false;
        const item = action.payload;
        if (item && item.id) {
          state.rows.unshift(item);
          state.total += 1;
        }
      })
      .addCase(createSupervisor.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload || action.error?.message || 'Error';
      });

    // Update
    builder
      .addCase(updateSupervisor.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateSupervisor.fulfilled, (state, action) => {
        state.saving = false;
        const item = action.payload;
        if (!item || !item.id) return;
        const idx = state.rows.findIndex((r) => r.id === item.id);
        if (idx !== -1) {
          state.rows[idx] = item;
        }
      })
      .addCase(updateSupervisor.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload || action.error?.message || 'Error';
      });

    // Delete
    builder
      .addCase(deleteSupervisor.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(deleteSupervisor.fulfilled, (state, action) => {
        state.saving = false;
        const id = action.payload;
        state.rows = state.rows.filter((r) => r.id !== id);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteSupervisor.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload || action.error?.message || 'Error';
      });
  },
});

export const selectSupervisorsState = (state) => state.supervisors || {};
export default supervisorsSlice.reducer;
