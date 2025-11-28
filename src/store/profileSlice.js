// RTK slice to load/update profile
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

export const fetchMe = createAsyncThunk('profile/fetchMe', async () => {
  const res = await apiFetch('/auth/me');
  return res.user || res; // controller returns {user:...} or resource
});

export const updateProfile = createAsyncThunk('profile/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/profile/me', {
      method: 'PUT',
      body: payload,
    });
    return res.user || res;
  } catch (e) { return rejectWithValue(e.message || 'Update failed'); }
});

// 👇 NEW: Avatar Upload Thunk
export const uploadAvatar = createAsyncThunk('profile/uploadAvatar', async (formData, { rejectWithValue }) => {
  try {
    // Usually file uploads use POST. FormData is automatically handled by apiFetch if it doesn't force JSON.
    const res = await apiFetch('/profile/avatar', {
      method: 'POST',
      body: formData,
    });
    return res.user || res;
  } catch (e) { return rejectWithValue(e.message || 'Avatar upload failed'); }
});

const slice = createSlice({
  name: 'profile',
  initialState: { me: null, loading: false, error: null, updatedAt: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchMe.fulfilled, (s, a) => { s.loading = false; s.me = a.payload; });
    b.addCase(fetchMe.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });

    b.addCase(updateProfile.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(updateProfile.fulfilled, (s, a) => { s.loading = false; s.me = a.payload; s.updatedAt = Date.now(); });
    b.addCase(updateProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; });

    // 👇 NEW: Avatar Upload Handlers
    b.addCase(uploadAvatar.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(uploadAvatar.fulfilled, (s, a) => { s.loading = false; s.me = a.payload; s.updatedAt = Date.now(); });
    b.addCase(uploadAvatar.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; });
  }
});

export default slice.reducer;