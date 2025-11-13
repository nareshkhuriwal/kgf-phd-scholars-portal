// src/store/researchersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// ---------------------------------------------
// Thunks
// ---------------------------------------------

export const loadInvites = createAsyncThunk(
  'researchers/loadInvites',
  async ({ page = 1, perPage = 10 } = {}) => {
    const res = await apiFetch(`/researchers/invites?page=${page}&perPage=${perPage}`);
    // Expecting something like:
    // { data: [...], meta: { total, page/perPage OR current_page/per_page } }
    return res;
  }
);

export const sendInvite = createAsyncThunk(
  'researchers/sendInvite',
  async (payload) => {
    // payload: { researcher_email, researcher_name?, supervisor_name, message?, role?, expires_in_days, allowed_domain?, notes? }
    const res = await apiFetch('/researchers/invites', {
      method: 'POST',
      body: payload,
    });
    return res;
  }
);

export const revokeInvite = createAsyncThunk(
  'researchers/revokeInvite',
  async (id) => {
    await apiFetch(`/researchers/invites/${id}`, {
      method: 'DELETE',
    });
    return id;
  }
);

export const resendInvite = createAsyncThunk(
  'researchers/resendInvite',
  async (id) => {
    const res = await apiFetch(`/researchers/invites/${id}/resend`, {
      method: 'POST',
    });
    return res; // optional updated invite
  }
);

// NOTE: You have bulkLoading/linkLoading/lastLink in state.
// If you also have thunks like generateInviteLink / getInviteLink / sendBulkInvites,
// wire them here and update those flags in extraReducers.

// ---------------------------------------------
// Slice
// ---------------------------------------------

const initialState = {
  rows: [],
  loading: false,
  error: null,
  page: 1,
  perPage: 10,
  total: 0,

  sent: false,
  bulkLoading: false,
  linkLoading: false,
  lastLink: null,
};

const researchersSlice = createSlice({
  name: 'researchers',
  initialState,
  reducers: {
    // If you ever want a manual reset:
    // resetInviteState(state) {
    //   state.sent = false;
    //   state.error = null;
    // }
  },
  extraReducers: (builder) => {
    builder
      // loadInvites
      .addCase(loadInvites.pending, (state) => {
        state.loading = true;
        state.error = null;
        // When reloading list, we can safely clear "sent" so UI doesn't show stale success.
        state.sent = false;
      })
      .addCase(loadInvites.fulfilled, (state, { payload }) => {
        state.loading = false;

        const data = payload?.data ?? [];
        const meta = payload?.meta ?? {};

        state.rows = data;
        state.total = meta.total ?? data.length;

        // Be robust to both { page, perPage } and { current_page, per_page }
        state.page = meta.page ?? meta.current_page ?? 1;
        state.perPage = meta.perPage ?? meta.per_page ?? state.perPage;
      })
      .addCase(loadInvites.rejected, (state, { error }) => {
        state.loading = false;
        state.error = error?.message || 'Failed to load invites';
      })

      // sendInvite
      .addCase(sendInvite.pending, (state) => {
        // You might also want a dedicated sending flag, but keeping it minimal:
        state.sent = false;
        state.error = null;
      })
      .addCase(sendInvite.fulfilled, (state) => {
        state.sent = true;
        // NOTE: we don't append to rows here on purpose.
        // Usually you call loadInvites() again after a successful send.
      })
      .addCase(sendInvite.rejected, (state, { error }) => {
        state.sent = false;
        state.error = error?.message || 'Failed to send invite';
      })

      // revokeInvite
      .addCase(revokeInvite.fulfilled, (state, { payload: id }) => {
        state.rows = state.rows.filter((r) => r.id !== id);
        state.total = Math.max(0, state.total - 1);
      })

      // resendInvite
      .addCase(resendInvite.pending, (state) => {
        state.error = null;
        // We don’t touch `sent` here; this is a separate action from sendInvite.
      })
      .addCase(resendInvite.fulfilled, (state, { payload }) => {
        // If API returns updated invite, you can merge it into rows:
        if (payload && payload.id) {
          const idx = state.rows.findIndex((r) => r.id === payload.id);
          if (idx !== -1) {
            state.rows[idx] = { ...state.rows[idx], ...payload };
          }
        }
      })
      .addCase(resendInvite.rejected, (state, { error }) => {
        state.error = error?.message || 'Failed to resend invite';
      });
  },
});

// Selector used in Researchers.jsx
export const selectResearchersState = (state) => state.researchers;

// If you ever enable the manual reset reducer, export it here:
// export const { resetInviteState } = researchersSlice.actions;

// Default reducer export for store
export default researchersSlice.reducer;
