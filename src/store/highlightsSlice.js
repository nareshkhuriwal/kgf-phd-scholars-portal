import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/**
 * Optional: if you’re on Laravel Sanctum and your apiFetch
 * does NOT already ensure the CSRF cookie, uncomment this.
 */
// async function ensureCsrf() {
//   try { await apiFetch('/sanctum/csrf-cookie', { method: 'GET' }); } catch (_) {}
// }

export const saveHighlights = createAsyncThunk(
  'highlights/save',
  /**
   * payload: { paperId: number|string, highlights: Array<{page:number, rects:Array<...>}>,
   *           replace?: boolean }
   */
  async ({ paperId, highlights, replace = false }, { rejectWithValue }) => {
    try {
      if (!paperId) throw new Error('paperId is required');
      if (!highlights?.length) throw new Error('No highlights to save');

      // If needed for Sanctum, uncomment:
      // await ensureCsrf();

      // apiFetch should already set base URL, JSON headers, credentials, etc.
      // If your apiFetch expects body as plain object, just pass it:
      const res = await apiFetch(`/papers/${paperId}/highlights/apply`, {
        method: 'POST',
        body: { replace, highlights },
      });

      // Support either { file_url } or { data: { file_url } }
      const fileUrl =
        res?.file_url ??
        res?.data?.file_url ??
        res?.url ??
        res?.data?.url;

      if (!fileUrl) {
        throw new Error('Server did not return file_url');
      }

      return { fileUrl };
    } catch (err) {
      return rejectWithValue(err?.message || 'Save highlights failed');
    }
  }
);

const highlightsSlice = createSlice({
  name: 'highlights',
  initialState: {
    saving: false,
    fileUrl: null,
    error: null,
  },
  reducers: {
    clearHighlightsState(state) {
      state.saving = false;
      state.fileUrl = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveHighlights.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.fileUrl = null;
      })
      .addCase(saveHighlights.fulfilled, (state, action) => {
        state.saving = false;
        state.fileUrl = action.payload.fileUrl;
      })
      .addCase(saveHighlights.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || 'Save highlights failed';
      });
  },
});

export const { clearHighlightsState } = highlightsSlice.actions;
export default highlightsSlice.reducer;
