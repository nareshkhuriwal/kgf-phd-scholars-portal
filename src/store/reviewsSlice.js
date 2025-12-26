import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/* ---------- Queue APIs ---------- */

export const loadReviewQueue = createAsyncThunk('reviews/loadQueue', async () => {
  return await apiFetch('/reviews/queue', { method: 'GET' });
});

export const addToQueue = createAsyncThunk('reviews/addToQueue', async (paperId) => {
  return await apiFetch('/reviews/queue', { method: 'POST', body: { paperId } });
});

export const removeFromQueue = createAsyncThunk('reviews/removeFromQueue', async (paperId) => {
  await apiFetch(`/reviews/queue/${paperId}`, { method: 'DELETE' });
  return paperId;
});

/* ---------- Review: load & save ---------- */

export const loadReview = createAsyncThunk('reviews/loadReview', async (paperId) => {
  return await apiFetch(`/reviews/${paperId}`, { method: 'GET' });
});

export const saveReview = createAsyncThunk(
  'reviews/saveReview',
  async ({ paperId, review_sections, html }) => {
    return await apiFetch(`/reviews/${paperId}`, {
      method: 'PUT',
      body: { review_sections, html }
    });
  }
);

export const saveReviewSection = createAsyncThunk(
  'reviews/saveReviewSection',
  async ({ paperId, section_key, html }) => {
    return await apiFetch(`/reviews/${paperId}/sections`, {
      method: 'PUT',
      body: { section_key, html }
    });
  }
);

export const setReviewStatus = createAsyncThunk(
  'reviews/setReviewStatus',
  async ({ paperId, status }) => {
    return await apiFetch(`/reviews/${paperId}/status`, {
      method: 'PUT',
      body: { status }
    });
  }
);

/* ---------- Citations ---------- */

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
  'reviews/loadCitations',
  async ({ paperId, style = 'mla' }, { rejectWithValue }) => {
    try {
      console.log('API call - paperId:', paperId, 'style:', style);

      // ✅ FIX: Remove duplicate params, just use URL with query string
      const response = await apiFetch(`/reviews/${paperId}/citations?style=${encodeURIComponent(style)}`);

      console.log('API response:', response);

      return response; // Returns { style, count, citations }
    } catch (error) {
      console.error('Load citations error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Keep for backward compatibility
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
    current: null,
    
    // Citations state
    citations: [],
    citationRefs: [],
    currentStyle: 'mla',
    citationsCount: 0,
    citationsLoading: false,
    citationsError: null,
    
    loading: false,
    error: null
  },
  reducers: {
    clearCurrentReview: (s) => { s.current = null; },
    clearCitations: (s) => { 
      s.citations = [];
      s.citationsCount = 0;
      s.currentStyle = 'mla';
    }
  },
  extraReducers: (b) => {
    b
      /* Queue */
      .addCase(loadReviewQueue.pending, (s) => { 
        s.loading = true; 
        s.error = null; 
      })
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
      .addCase(loadReview.pending, (s) => { 
        s.loading = true; 
        s.error = null; 
      })
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
          s.current = resp;
        } else if (s.current) {
          const { review_sections } = a.meta.arg || {};
          if (review_sections) {
            s.current.review_sections = { 
              ...(s.current.review_sections || {}), 
              ...review_sections 
            };
          }
        }
      })

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

      /* Set status */
      .addCase(setReviewStatus.fulfilled, (s, a) => {
        const resp = a.payload?.data ?? a.payload;
        if (!s.current) s.current = {};
        s.current.status = (resp?.status ?? a.meta.arg.status);
      })
      .addCase(setReviewStatus.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to set status';
      })

      /* ---------- Citations ---------- */
      
      // Sync citations
      .addCase(syncReviewCitations.pending, (s) => {
        s.error = null;
      })
      .addCase(syncReviewCitations.rejected, (s, a) => {
        s.error = a.error?.message || 'Failed to sync citations';
      })

      // Load citations (dynamic style)
      .addCase(loadReviewCitations.pending, (s) => {
        s.citationsLoading = true;
        s.citationsError = null;
      })
      .addCase(loadReviewCitations.fulfilled, (s, a) => {
        s.citationsLoading = false;
        s.currentStyle = a.payload.style || 'mla';
        s.citations = a.payload.citations || [];
        s.citationsCount = a.payload.count || 0;
        console.log('Citations loaded into state:', s.citations.length);
      })
      .addCase(loadReviewCitations.rejected, (s, a) => {
        s.citationsLoading = false;
        s.citationsError = a.error?.message || 'Failed to load citations';
      })

      // Load IEEE citations (backward compatibility)
      .addCase(loadReviewCitationsIEEE.pending, (s) => {
        s.citationsLoading = true;
        s.citationsError = null;
      })
      .addCase(loadReviewCitationsIEEE.fulfilled, (s, a) => {
        s.citationsLoading = false;
        s.citationRefs = a.payload?.data ?? a.payload ?? [];
      })
      .addCase(loadReviewCitationsIEEE.rejected, (s, a) => {
        s.citationsLoading = false;
        s.citationsError = a.error?.message || 'Failed to load references';
      });
  }
});

export const { clearCurrentReview, clearCitations } = slice.actions;
export default slice.reducer;