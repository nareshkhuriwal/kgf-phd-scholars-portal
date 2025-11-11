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
      body: JSON.stringify(payload),
    });
    return res.user || res;
  } catch (e) { return rejectWithValue(e.message || 'Update failed'); }
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
  }
});

export default slice.reducer;
