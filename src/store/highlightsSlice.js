// src/store/highlightsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/**
 * UPDATED: Server-side apply (JSON -> /papers/:id/highlights/apply)
 * Supports RECT + BRUSH highlights (backward compatible)
 */
export const saveHighlights = createAsyncThunk(
  'highlights/save',
  /**
   * payload:
   * {
   *   paperId: number|string,
   *   highlights?: Array<{ page:number, rects:Array<{x,y,w,h}> }>,
   *   brushHighlights?: Array<{ page:number, strokes:Array<{points,size}> }>,
   *   replace?: boolean,
   *   sourceUrl?: string,
   *   style?: { color?: string, alpha?: number }
   * }
   */
  async (
    {
      paperId,
      highlights,
      brushHighlights,
      replace = false,
      sourceUrl,
      style,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!paperId) {
        throw new Error('paperId is required');
      }

      const hasRects =
        Array.isArray(highlights) && highlights.length > 0;

      const hasBrushes =
        Array.isArray(brushHighlights) && brushHighlights.length > 0;

      // ✅ IMPORTANT: allow rect-only OR brush-only
      if (!hasRects && !hasBrushes) {
        throw new Error('No highlights to save');
      }

      // Build payload conditionally (do NOT send empty arrays)
      const body = { replace };

      if (sourceUrl) body.sourceUrl = sourceUrl;
      if (style) body.style = style;
      if (hasRects) body.highlights = highlights;
      if (hasBrushes) body.brushHighlights = brushHighlights;

      const res = await apiFetch(
        `/papers/${paperId}/highlights/apply`,
        {
          method: 'POST',
          body,
        }
      );

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
      return rejectWithValue(
        err?.message || 'Save highlights failed'
      );
    }
  }
);

/**
 * NEW: Reset all highlights - restore original PDF
 * Removes all highlights and returns the original unhighlighted PDF
 */
export const resetHighlights = createAsyncThunk(
  'highlights/reset',
  async ({ paperId }, { rejectWithValue }) => {
    try {
      if (!paperId) {
        throw new Error('paperId is required');
      }

      const res = await apiFetch(
        `/papers/${paperId}/highlights/reset`,
        {
          method: 'POST',
        }
      );

      const fileUrl =
        res?.file_url ??
        res?.data?.file_url ??
        res?.url ??
        res?.data?.url ??
        res?.raw_url ??
        res?.data?.raw_url;

      if (!fileUrl) {
        throw new Error('Server did not return file_url');
      }

      return { fileUrl, success: true };
    } catch (err) {
      return rejectWithValue(
        err?.message || 'Reset highlights failed'
      );
    }
  }
);

/**
 * Client-side burned PDF upload (multipart -> /pdfs/upload or /papers/:id/highlights/upload)
 * Use this when you generate a PDF with pdf-lib and want to overwrite same file (dest_url).
 *
 * args:
 *  - blob: Blob (required)
 *  - uploadUrl: string (required)
 *  - destUrl?: string (to overwrite same URL)
 *  - destPath?: string (alternative to destUrl)
 *  - overwrite?: boolean (default true if dest provided)
 *  - keepName?: boolean
 *  - label?: string
 *  - fetchInit?: RequestInit (e.g., { credentials: 'include' })
 */
export const uploadHighlightedPdf = createAsyncThunk(
  'highlights/upload',
  async (args, { rejectWithValue }) => {
    try {
      const {
        blob,
        uploadUrl,
        destUrl,
        destPath,
        overwrite = (Boolean(destUrl) || Boolean(destPath)),
        keepName = false,
        label,
        fetchInit
      } = args || {};

      if (!blob) throw new Error('blob is required');
      if (!uploadUrl) throw new Error('uploadUrl is required');

      const fd = new FormData();
      fd.append('file', blob, 'highlighted.pdf');
      if (destUrl) fd.append('dest_url', destUrl);
      if (destPath) fd.append('dest_path', destPath);
      if (overwrite) fd.append('overwrite', '1');
      if (keepName) fd.append('keep_name', '1');
      if (label) fd.append('label', label);

      // IMPORTANT: apiFetch returns parsed JSON (or throws on !ok)
      const data = await apiFetch(uploadUrl, { method: 'POST', body: fd });

      const url = data?.url ?? data?.file_url ?? null;
      const path = data?.path ?? data?.file_path ?? null;
      if (!url) throw new Error('Server did not return url');

      return { url, path, raw: data };

    } catch (err) {
      return rejectWithValue(err?.message || 'Upload failed');
    }
  }
);

const highlightsSlice = createSlice({
  name: 'highlights',
  initialState: {
    // ORIGINAL flow state
    saving: false,
    fileUrl: null,
    error: null,

    // NEW reset flow state
    resetting: false,
    resetError: null,

    // Upload flow state
    uploading: false,
    uploadedUrl: null,
    uploadedPath: null,
    uploadError: null,
    lastResponse: null,
  },
  reducers: {
    clearHighlightsState(state) {
      // original keys
      state.saving = false;
      state.fileUrl = null;
      state.error = null;
      // reset keys
      state.resetting = false;
      state.resetError = null;
      // upload keys
      state.uploading = false;
      state.uploadedUrl = null;
      state.uploadedPath = null;
      state.uploadError = null;
      state.lastResponse = null;
    },
    clearResetError(state) {
      state.resetError = null;
    },
  },
  extraReducers: (builder) => {
    // ---- ORIGINAL saveHighlights ----
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

    // ---- NEW resetHighlights ----
    builder
      .addCase(resetHighlights.pending, (state) => {
        state.resetting = true;
        state.resetError = null;
      })
      .addCase(resetHighlights.fulfilled, (state, action) => {
        state.resetting = false;
        state.fileUrl = action.payload.fileUrl; // Update to original PDF URL
        state.resetError = null;
      })
      .addCase(resetHighlights.rejected, (state, action) => {
        state.resetting = false;
        state.resetError = action.payload || 'Reset highlights failed';
      });

    // ---- uploadHighlightedPdf ----
    builder
      .addCase(uploadHighlightedPdf.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
        state.uploadedUrl = null;
        state.uploadedPath = null;
        state.lastResponse = null;
      })
      .addCase(uploadHighlightedPdf.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadedUrl = action.payload.url;
        state.uploadedPath = action.payload.path;
        state.lastResponse = action.payload.raw;
      })
      .addCase(uploadHighlightedPdf.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload || 'Upload failed';
      });
  },
});

export const { clearHighlightsState, clearResetError } = highlightsSlice.actions;

// Selectors
export const selectHighlightSave = (s) => ({
  saving: s.highlights?.saving ?? false,
  fileUrl: s.highlights?.fileUrl ?? null,
  error: s.highlights?.error ?? null,
});

export const selectHighlightReset = (s) => ({
  resetting: s.highlights?.resetting ?? false,
  resetError: s.highlights?.resetError ?? null,
});

export const selectHighlightUpload = (s) => ({
  uploading: s.highlights?.uploading ?? false,
  uploadedUrl: s.highlights?.uploadedUrl ?? null,
  uploadedPath: s.highlights?.uploadedPath ?? null,
  uploadError: s.highlights?.uploadError ?? null,
  lastResponse: s.highlights?.lastResponse ?? null,
});

export default highlightsSlice.reducer;