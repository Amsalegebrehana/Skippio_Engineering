import type { OrderResponse, PaymentEventPayload, RefundResult } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  submitPayment: (payload: PaymentEventPayload) =>
    request<OrderResponse>('/payment-events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrder: (orderId: string) =>
    request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`),

  syncOrder: (orderId: string) =>
    request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}/sync`, { method: 'POST' }),

  refundOrder: (orderId: string) =>
    request<RefundResult>(`/orders/${encodeURIComponent(orderId)}/refund`, { method: 'POST' }),
};
