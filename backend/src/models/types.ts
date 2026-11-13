export interface PaymentItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface PaymentEventPayload {
  eventId: string;
  type: string;
  order: {
    id: string;
    venueId: string;
    currency: string;
    items: PaymentItem[];
    total: number;
  };
}

export type PaymentStatus = 'paid' | 'refunded';
export type PosStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface Order {
  id: string;
  venueId: string;
  currency: string;
  items: PaymentItem[];
  total: number;
  eventIds: Set<string>;
  paymentStatus: PaymentStatus;
  posStatus: PosStatus;
  posAttemptCount: number;
  posTransactionRef: string | null;
  lastPosError: string | null;
  refundedAmount: number | null;
}

export interface PosTransaction {
  transactionRef: string;
  orderId: string;
  venueId: string;
  items: PaymentItem[];
  currency: string;
  total: number;
  timestamp: number;
}

export interface PosPayload {
  orderId: string;
  venueId: string;
  items: PaymentItem[];
  currency: string;
  total: number;
}

export interface OrderResponse {
  id: string;
  venueId: string;
  currency: string;
  items: PaymentItem[];
  total: number;
  paymentStatus: PaymentStatus;
  posStatus: PosStatus;
  posAttemptCount: number;
  posTransactionRef: string | null;
  lastPosError: string | null;
  refundedAmount: number | null;
}

export interface RefundResponse {
  status: PaymentStatus;
  amount: number;
}
