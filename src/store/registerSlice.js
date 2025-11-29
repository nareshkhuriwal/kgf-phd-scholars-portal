// src/store/registerSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

/**
 * sendRegisterOtp
 * payload: { email: string }
 * backend endpoint: POST /auth/send-register-otp
 */
export const sendRegisterOtp = createAsyncThunk(
  'register/sendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/auth/send-register-otp', {
        method: 'POST',
        body: { email },
      });
      // apiFetch should throw on non-2xx or return parsed JSON
      return { email, ...res };
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to send OTP');
    }
  }
);

/**
 * verifyRegisterOtp
 * payload: { email: string, otp: string }
 * backend endpoint: POST /auth/verify-register-otp
 */
export const verifyRegisterOtp = createAsyncThunk(
  'register/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/auth/verify-register-otp', {
        method: 'POST',
        body: { email, otp },
      });
      return { email, ...res };
    } catch (err) {
      return rejectWithValue(err?.message || 'OTP verification failed');
    }
  }
);

const initialState = {
  email: '',
  sending: false,
  verifying: false,
  otpSent: false,
  emailVerified: false,
  sendError: null,
  verifyError: null,
  lastResponse: null,
  resendCooldown: 0,
};

const slice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setEmail(state, action) {
      state.email = action.payload || '';
    },
    markVerified(state) {
      state.emailVerified = true;
      state.otpSent = false;
      state.sendError = null;
      state.verifyError = null;
      state.resendCooldown = 0;
    },
    clearErrors(state) {
      state.sendError = null;
      state.verifyError = null;
    },
    setResendCooldown(state, action) {
      state.resendCooldown = Number(action.payload) || 0;
    },
    tickCooldown(state) {
      if (state.resendCooldown > 0) state.resendCooldown -= 1;
      if (state.resendCooldown < 0) state.resendCooldown = 0;
    },
    resetState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // send OTP
    builder.addCase(sendRegisterOtp.pending, (s) => {
      s.sending = true;
      s.sendError = null;
      s.lastResponse = null;
    });
    builder.addCase(sendRegisterOtp.fulfilled, (s, action) => {
      s.sending = false;
      s.lastResponse = action.payload || null;

      if (action.payload?.already_verified) {
        s.emailVerified = true;
        s.otpSent = false;
        s.resendCooldown = 0;
      } else {
        s.otpSent = true;
        if (action.payload?.email) s.email = action.payload.email;
        s.resendCooldown = action.payload?.cooldown_seconds ?? 30;
      }
    });
    builder.addCase(sendRegisterOtp.rejected, (s, action) => {
      s.sending = false;
      s.sendError = action.payload || action.error?.message || 'Failed to send OTP';
    });

    // verify OTP
    builder.addCase(verifyRegisterOtp.pending, (s) => {
      s.verifying = true;
      s.verifyError = null;
      s.lastResponse = null;
    });
    builder.addCase(verifyRegisterOtp.fulfilled, (s, action) => {
      s.verifying = false;
      s.lastResponse = action.payload || null;
      s.emailVerified = true;
      s.otpSent = false;
      s.verifyError = null;
      s.resendCooldown = 0;
      if (action.payload?.email) s.email = action.payload.email;
    });
    builder.addCase(verifyRegisterOtp.rejected, (s, action) => {
      s.verifying = false;
      s.verifyError = action.payload || action.error?.message || 'OTP verification failed';
    });
  },
});

export const {
  setEmail,
  markVerified,
  clearErrors,
  setResendCooldown,
  tickCooldown,
  resetState,
} = slice.actions;

export const selectRegisterState = (state) => state.register || initialState;

export default slice.reducer;
