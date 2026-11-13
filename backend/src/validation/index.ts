import { PaymentEventPayload } from '../models/types';

type ValidationResult =
  | { valid: true; event: PaymentEventPayload }
  | { valid: false; error: string };

export function validatePaymentEvent(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.eventId !== 'string' || b.eventId.trim() === '') {
    return { valid: false, error: 'eventId is required and must be a non-empty string' };
  }

  if (b.type !== 'payment.succeeded') {
    return { valid: false, error: 'type must be "payment.succeeded"' };
  }

  if (!b.order || typeof b.order !== 'object') {
    return { valid: false, error: 'order is required and must be an object' };
  }

  const order = b.order as Record<string, unknown>;

  if (typeof order.id !== 'string' || order.id.trim() === '') {
    return { valid: false, error: 'order.id is required and must be a non-empty string' };
  }

  if (typeof order.venueId !== 'string' || order.venueId.trim() === '') {
    return { valid: false, error: 'order.venueId is required and must be a non-empty string' };
  }

  if (order.currency !== 'EUR') {
    return { valid: false, error: 'order.currency must be "EUR"' };
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { valid: false, error: 'order.items must be a non-empty array' };
  }

  let calculatedTotal = 0;

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i] as Record<string, unknown>;

    if (typeof item.productId !== 'string' || item.productId.trim() === '') {
      return { valid: false, error: `items[${i}].productId is required and must be a non-empty string` };
    }

    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: `items[${i}].quantity must be a positive integer` };
    }

    if (typeof item.price !== 'number' || !Number.isInteger(item.price) || item.price < 0) {
      return { valid: false, error: `items[${i}].price must be a non-negative integer` };
    }

    calculatedTotal += item.price * item.quantity;
  }

  if (typeof order.total !== 'number' || !Number.isInteger(order.total) || order.total < 0) {
    return { valid: false, error: 'order.total must be a non-negative integer' };
  }

  if (order.total !== calculatedTotal) {
    return { valid: false, error: `order.total (${order.total}) does not match calculated total (${calculatedTotal})` };
  }

  return {
    valid: true,
    event: {
      eventId: b.eventId as string,
      type: b.type as string,
      order: {
        id: order.id as string,
        venueId: order.venueId as string,
        currency: order.currency as string,
        items: (order.items as Array<Record<string, unknown>>).map((item) => ({
          productId: item.productId as string,
          quantity: item.quantity as number,
          price: item.price as number,
        })),
        total: order.total as number,
      },
    },
  };
}
