// src/store/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../services/api';

// Create payment order
export const createPaymentOrderThunk = createAsyncThunk(
  'order/createPaymentOrder',
  async (planKey, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/payment/create-order', {
        method: 'POST',
        body: {
          plan_key: planKey,
        },
      });
      return res; // { orderId, amount, currency, key }
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to create payment order');
    }
  }
);

// Verify payment
export const verifyPaymentThunk = createAsyncThunk(
  'order/verifyPayment',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/payment/verify', {
        method: 'POST',
        body: payload,
      });
      return res; // e.g. { message, plan_key, plan_expires_at }
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to verify payment');
    }
  }
);

const initialState = {
  creating: false,
  verifying: false,
  lastOrder: null,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetOrderState(state) {
      state.creating = false;
      state.verifying = false;
      state.lastOrder = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createPaymentOrder
      .addCase(createPaymentOrderThunk.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createPaymentOrderThunk.fulfilled, (state, action) => {
        state.creating = false;
        state.lastOrder = action.payload;
      })
      .addCase(createPaymentOrderThunk.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create payment order';
      })

      // verifyPayment
      .addCase(verifyPaymentThunk.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyPaymentThunk.fulfilled, (state, action) => {
        state.verifying = false;
      })
      .addCase(verifyPaymentThunk.rejected, (state, action) => {
        state.verifying = false;
        state.error = action.payload || 'Failed to verify payment';
      });
  },
});

export const { resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
