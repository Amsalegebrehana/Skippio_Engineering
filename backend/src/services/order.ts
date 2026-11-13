import { Order, PaymentEventPayload, PaymentItem, OrderResponse, RefundResponse } from '../models/types';
import { orders, posTransactions } from '../store/memoryStore';
import { withLock } from '../utils';
import { sendToPos } from '../pos/posSimulator';

class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    venueId: order.venueId,
    currency: order.currency,
    items: order.items,
    total: order.total,
    paymentStatus: order.paymentStatus,
    posStatus: order.posStatus,
    posAttemptCount: order.posAttemptCount,
    posTransactionRef: order.posTransactionRef,
    lastPosError: order.lastPosError,
    refundedAmount: order.refundedAmount,
  };
}

function itemsMatch(a: PaymentItem[], b: PaymentItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].productId !== b[i].productId) return false;
    if (a[i].quantity !== b[i].quantity) return false;
    if (a[i].price !== b[i].price) return false;
  }
  return true;
}

function ordersMatch(existing: Order, incoming: PaymentEventPayload): boolean {
  return (
    existing.venueId === incoming.order.venueId &&
    existing.currency === incoming.order.currency &&
    existing.total === incoming.order.total &&
    itemsMatch(existing.items, incoming.order.items)
  );
}

async function attemptPosSync(order: Order): Promise<void> {
  order.posStatus = 'syncing';
  order.posAttemptCount++;

  try {
    const transactionRef = await sendToPos({
      orderId: order.id,
      venueId: order.venueId,
      items: order.items,
      currency: order.currency,
      total: order.total,
    });

    order.posStatus = 'synced';
    order.posTransactionRef = transactionRef;
    order.lastPosError = null;
  } catch (err: any) {
    order.posStatus = 'failed';
    order.lastPosError = err.message ?? 'Unknown POS error';
  }
}

export async function processPaymentEvent(
  event: PaymentEventPayload
): Promise<{ order: OrderResponse; created: boolean }> {
  return withLock(event.order.id, async () => {
    const existing = orders.get(event.order.id);

    if (existing) {
      if (existing.eventIds.has(event.eventId)) {
        return { order: toOrderResponse(existing), created: false };
      }

      if (!ordersMatch(existing, event)) {
        throw new ServiceError(409, 'Conflicting order data for existing order');
      }

      existing.eventIds.add(event.eventId);
      return { order: toOrderResponse(existing), created: false };
    }

    const order: Order = {
      id: event.order.id,
      venueId: event.order.venueId,
      currency: event.order.currency,
      items: event.order.items,
      total: event.order.total,
      eventIds: new Set([event.eventId]),
      paymentStatus: 'paid',
      posStatus: 'pending',
      posAttemptCount: 0,
      posTransactionRef: null,
      lastPosError: null,
      refundedAmount: null,
    };

    orders.set(order.id, order);
    await attemptPosSync(order);

    return { order: toOrderResponse(order), created: true };
  });
}

export async function getOrder(orderId: string): Promise<OrderResponse> {
  const order = orders.get(orderId);
  if (!order) {
    throw new ServiceError(404, 'Order not found');
  }
  return toOrderResponse(order);
}

export async function syncOrder(orderId: string): Promise<OrderResponse> {
  return withLock(orderId, async () => {
    const order = orders.get(orderId);
    if (!order) {
      throw new ServiceError(404, 'Order not found');
    }

    if (order.posStatus === 'synced') {
      return toOrderResponse(order);
    }

    if (order.posStatus === 'syncing') {
      throw new ServiceError(409, 'Sync already in progress');
    }

    await attemptPosSync(order);
    return toOrderResponse(order);
  });
}

export async function refundOrder(
  orderId: string
): Promise<{ order: OrderResponse; refund: RefundResponse }> {
  return withLock(orderId, async () => {
    const order = orders.get(orderId);
    if (!order) {
      throw new ServiceError(404, 'Order not found');
    }

    if (order.paymentStatus === 'refunded') {
      return {
        order: toOrderResponse(order),
        refund: { status: order.paymentStatus, amount: order.refundedAmount! },
      };
    }

    if (order.posStatus !== 'synced') {
      throw new ServiceError(400, 'Order must be synced with POS before refunding');
    }

    order.paymentStatus = 'refunded';
    order.refundedAmount = order.total;

    return {
      order: toOrderResponse(order),
      refund: { status: order.paymentStatus, amount: order.refundedAmount },
    };
  });
}
