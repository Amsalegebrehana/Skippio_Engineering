export interface PaymentItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface PaymentEventPayload {
  eventId: string;
  type: 'payment.succeeded';
  order: {
    id: string;
    venueId: string;
    currency: 'EUR';
    items: PaymentItem[];
    total: number;
  };
}

export interface OrderResponse {
  id: string;
  venueId: string;
  currency: string;
  items: PaymentItem[];
  total: number;
  paymentStatus: 'paid' | 'refunded';
  posStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  posAttemptCount: number;
  posTransactionRef: string | null;
  lastPosError: string | null;
  refundedAmount: number | null;
}

export interface RefundResult {
  order: OrderResponse;
  refund: { status: string; amount: number };
}
