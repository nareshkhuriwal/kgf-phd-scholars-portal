// src/store/inviteNotificationsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// ------------------------------------------------------------------
// Thunks
// ------------------------------------------------------------------

// Load all invite notifications for the logged-in user
export const loadInviteNotifications = createAsyncThunk(
  'inviteNotifications/load',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/me/invite-notifications');
      // Expecting: { data: [ { id, message, status, is_read, created_at, ... } ] }
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load notifications');
    }
  }
);

// Accept / Decline invite
export const respondToInvite = createAsyncThunk(
  'inviteNotifications/respond',
  async ({ id, action }, { rejectWithValue }) => {
    try {
      // action: 'accept' | 'decline'
      await apiFetch(`/me/invite-notifications/${id}/${action}`, {
        method: 'POST',
      });
      return { id, action };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to respond to invite');
    }
  }
);

// Mark single notification as read
export const markInviteNotificationRead = createAsyncThunk(
  'inviteNotifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await apiFetch(`/me/invite-notifications/${id}/read`, {
        method: 'POST',
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark as read');
    }
  }
);

// Optionally: mark all as read
export const markAllInviteNotificationsRead = createAsyncThunk(
  'inviteNotifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiFetch('/me/invite-notifications/mark-all-read', {
        method: 'POST',
      });
      return;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark all as read');
    }
  }
);

// ------------------------------------------------------------------
// Slice
// ------------------------------------------------------------------

const inviteNotificationsSlice = createSlice({
  name: 'inviteNotifications',
  initialState: {
    items: [],        // array of notifications
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // load
      .addCase(loadInviteNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadInviteNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadInviteNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load notifications';
      })

      // respond accept/decline
      .addCase(respondToInvite.fulfilled, (state, action) => {
        const { id, action: act } = action.payload;
        const n = state.items.find((x) => x.id === id);
        if (n) {
          n.status = act === 'accept' ? 'accepted' : 'declined';
          n.is_read = true;
        }
      })

      // mark single read
      .addCase(markInviteNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const n = state.items.find((x) => x.id === id);
        if (n) {
          n.is_read = true;
        }
      })

      // mark all read
      .addCase(markAllInviteNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.is_read = true;
        });
      });
  },
});

// ------------------------------------------------------------------
// Selectors
// ------------------------------------------------------------------

export const selectInviteNotifications = (state) => state.inviteNotifications;

export const selectUnreadInviteCount = (state) =>
  state.inviteNotifications.items.filter((n) => !n.is_read).length;

export default inviteNotificationsSlice.reducer;
