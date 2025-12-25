import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/* ---------- Queue APIs (unchanged) ---------- */

// queue to review (IDs + basic metadata)
export const loadReviewQueue = createAsyncThunk('reviews/loadQueue', async () => {
  return await apiFetch('/reviews/queue', { method: 'GET' });
});

// add/remove to queue
export const addToQueue = createAsyncThunk('reviews/addToQueue', async (paperId) => {
  return await apiFetch('/reviews/queue', { method: 'POST', body: { paperId } });
});
export const removeFromQueue = createAsyncThunk('reviews/removeFromQueue', async (paperId) => {
  await apiFetch(`/reviews/queue/${paperId}`, { method: 'DELETE' });
  return paperId;
});

/* ---------- Review: load & save ---------- */

// Load review for a paper (expects { review_sections?: {}, html?: string, ...meta })
export const loadReview = createAsyncThunk('reviews/loadReview', async (paperId) => {
  return await apiFetch(`/reviews/${paperId}`, { method: 'GET' });
});

// FULL save (all tabs). Body includes structured sections and optional legacy html.
export const saveReview = createAsyncThunk(
  'reviews/saveReview',
  async ({ paperId, review_sections, html }) => {
    return await apiFetch(`/reviews/${paperId}`, {
      method: 'PUT',
      body: { review_sections, html }
    });
  }
);

// PARTIAL save (active tab only). Sends tab name + html.
export const saveReviewSection = createAsyncThunk(
  'reviews/saveReviewSection',
  async ({ paperId, section_key, html }) => {
    return await apiFetch(`/reviews/${paperId}/sections`, {
      method: 'PUT',
      body: { section_key, html }   // html may be base64 here (OK)
    });
  }
);


// NEW: mark complete / change status
export const setReviewStatus = createAsyncThunk(
  'reviews/setReviewStatus',
  async ({ paperId, status }) => {
    // backend route below: PUT /reviews/{paper}/status
    return await apiFetch(`/reviews/${paperId}/status`, {
      method: 'PUT',
      body: { status }   // 'done' | 'pending'
    });
  }
);

export const syncReviewCitations = createAsyncThunk(
  'reviews/syncReviewCitations',
  async ({ reviewId, citation_keys }) => {
    return await apiFetch(`/reviews/${reviewId}/citations/sync`, {
      method: 'POST',
      body: { citation_keys }
    });
  }
);

export const loadReviewCitations = createAsyncThunk(
  'reviews/loadReviewCitations',
  async (reviewId) => {
    return await apiFetch(`/reviews/${reviewId}/citations`, {
      method: 'GET'
    });
  }
);

export const loadReviewCitationsIEEE = createAsyncThunk(
  'reviews/loadReviewCitationsIEEE',
  async (reviewId) => {
    return await apiFetch(`/reviews/${reviewId}/citations/ieee`, {
      method: 'GET'
    });
  }
);



/* ---------- Slice ---------- */

const slice = createSlice({
  name: 'reviews',
  initialState: {
    queue: [],
    current: null, // { paperId, review_sections, html, ... }
    citations: [],          // raw citation objects
    citationRefs: [],       // formatted references (IEEE)
    loading: false,
    error: null
  },
  reducers: {
    clearCurrentReview: (s) => { s.current = null; }
  },
  extraReducers: (b) => {
    b
      /* Queue */
      .addCase(loadReviewQueue.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadReviewQueue.fulfilled, (s, a) => {
        s.loading = false;
        s.queue = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadReviewQueue.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load queue';
      })
      .addCase(addToQueue.fulfilled, (s, a) => {
        const item = a.payload?.data ?? a.payload;
        if (item) s.queue.unshift(item);
      })
      .addCase(removeFromQueue.fulfilled, (s, a) => {
        s.queue = s.queue.filter(q => q.id !== a.payload && q.paperId !== a.payload);
      })

      /* Load review */
      .addCase(loadReview.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadReview.fulfilled, (s, a) => {
        s.loading = false;
        s.current = a.payload?.data ?? a.payload ?? null;
      })
      .addCase(loadReview.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || 'Failed to load review';
      })

      /* Full save */
      .addCase(saveReview.fulfilled, (s, a) => {
        const resp = a.payload?.data ?? a.payload;
        if (resp) {
          // If server returns the full object, replace; else merge review_sections we sent
          s.current = resp;
        } else if (s.current) {
          const { review_sections } = a.meta.arg || {};
          if (review_sections) {
            s.current.review_sections = { ...(s.current.review_sections || {}), ...review_sections };
          }
        }
      })

      /* Partial (per-tab) save */
      /* Partial (per-tab) save */
      .addCase(saveReviewSection.pending, (s) => {
        s.error = null;
      })
      .addCase(saveReviewSection.fulfilled, (s, a) => {
        const resp = a.payload?.data ?? a.payload;

        if (!s.current) s.current = {};

        if (resp?.review_sections) {
          s.current.review_sections = resp.review_sections;
        }

        if (resp?.status) {
          s.current.status = resp.status;
        }
      })
      .addCase(saveReviewSection.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to save section';
      })


      // …in extraReducers:
      .addCase(setReviewStatus.fulfilled, (s, a) => {
        const resp = a.payload?.data ?? a.payload;
        if (!s.current) s.current = {};
        s.current.status = (resp?.status ?? a.meta.arg.status);
      })
      .addCase(setReviewStatus.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to set status';
      })

      /* ---------- Citations ---------- */

      .addCase(syncReviewCitations.pending, (s) => {
        s.error = null;
      })

      .addCase(syncReviewCitations.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to sync citations';
      })


      .addCase(loadReviewCitations.fulfilled, (s, a) => {
        s.citations = a.payload?.data ?? a.payload ?? [];
      })

      .addCase(loadReviewCitations.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to load citations';
      })


      .addCase(loadReviewCitationsIEEE.fulfilled, (s, a) => {
        s.citationRefs = a.payload?.data ?? a.payload ?? [];
      })

      .addCase(loadReviewCitationsIEEE.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to load references';
      });


  }
});

export const { clearCurrentReview } = slice.actions;
export default slice.reducer;
