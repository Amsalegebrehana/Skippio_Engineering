import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './api';
import type { OrderResponse, PaymentEventPayload } from './types';

interface OrderState {
  currentOrder: OrderResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  currentOrder: null,
  loading: false,
  error: null,
};

export const submitPayment = createAsyncThunk(
  'order/submitPayment',
  async (payload: PaymentEventPayload) => api.submitPayment(payload),
);

export const fetchOrder = createAsyncThunk(
  'order/fetchOrder',
  async (orderId: string) => api.getOrder(orderId),
);

export const syncOrder = createAsyncThunk(
  'order/syncOrder',
  async (orderId: string) => api.syncOrder(orderId),
);

export const refundOrder = createAsyncThunk(
  'order/refundOrder',
  async (orderId: string) => {
    const result = await api.refundOrder(orderId);
    return result.order;
  },
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [submitPayment, fetchOrder, syncOrder, refundOrder]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.currentOrder = action.payload as OrderResponse;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message ?? 'Unknown error';
        });
    }
  },
});

export const store = configureStore({ reducer: { order: orderSlice.reducer } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
