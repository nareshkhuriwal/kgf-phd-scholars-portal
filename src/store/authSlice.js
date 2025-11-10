// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiFetch } from '../services/api'                 // <-- direct use
import { readAuth, writeAuth, clearAuth } from '../utils/authStorage'

// ---- Thunks (use apiFetch directly) ----
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // noAuth prevents sending stale Authorization header on login
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
        noAuth: true,
      })
      // Normalize different back-ends (JWT returns {token,user}, Sanctum may return {user})
      const token = res?.token ?? null
      const user  = res?.user  ?? res?.data ?? null
      writeAuth({ token, user })
      return { token, user }
    } catch (e) {
      return rejectWithValue(e?.message || 'Login failed')
    }
  }
)

export const meThunk = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/auth/me', { method: 'GET' })
      // Normalize
      return res?.user ?? res?.data ?? res
    } catch (e) {
      return rejectWithValue(e?.message || 'Unable to fetch profile')
    }
  }
)

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }) } catch {}
    clearAuth()
    return true
  }
)

// ---- Initial from storage ----
const stored = readAuth() || {}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: stored.token ?? null,
    user: stored.user ?? null,
    loading: false,
    error: null,
    hydrated: !!stored.token,
  },
  reducers: {
    hydrateFromStorage(state) {
      const s = readAuth() || {}
      state.token = s.token ?? null
      state.user = s.user ?? null
      state.hydrated = true
    },
    // optional instant client-side logout
    logout(state) {
      state.token = null
      state.user = null
      state.hydrated = true
      clearAuth()
    }
  },
  extraReducers: (b) => {
    b
      // LOGIN
      .addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false
        s.token = a.payload.token ?? null
        s.user = a.payload.user ?? null
        s.hydrated = true
        writeAuth({ token: s.token, user: s.user })
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload || 'Login failed'
      })

      // ME
      .addCase(meThunk.pending, (s) => { s.loading = true; s.error = null })
      .addCase(meThunk.fulfilled, (s, a) => {
        s.loading = false
        s.user = a.payload ?? null
        writeAuth({ token: s.token, user: s.user })
      })
      .addCase(meThunk.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload || 'Unable to fetch profile'
      })

      // LOGOUT
      .addCase(logoutThunk.fulfilled, (s) => {
        s.token = null
        s.user = null
        s.hydrated = true
        clearAuth()
      })
  }
})

export const { hydrateFromStorage, logout } = authSlice.actions
export default authSlice.reducer
