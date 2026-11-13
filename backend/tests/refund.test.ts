import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { resetStore } from '../src/store/memoryStore';
import { resetPos, setDelay } from '../src/pos/posSimulator';

const app = createApp();
const request = supertest(app);

function makeEvent(eventId = 'evt-1') {
  return {
    eventId,
    type: 'payment.succeeded',
    order: {
      id: 'order-1',
      venueId: 'venue-1',
      currency: 'EUR',
      items: [{ productId: 'prod-1', quantity: 2, price: 500 }],
      total: 1000,
    },
  };
}

async function createSyncedOrder() {
  await request.post('/payment-events').send(makeEvent());
  await request.post('/orders/order-1/sync').send();
}

describe('Refund', () => {
  beforeEach(() => {
    resetStore();
    resetPos();
  });

  it('full refund returns correct amount and status', async () => {
    await createSyncedOrder();

    const res = await request.post('/orders/order-1/refund').send();

    expect(res.status).toBe(200);
    expect(res.body.order.paymentStatus).toBe('refunded');
    expect(res.body.refund.status).toBe('refunded');
    expect(res.body.refund.amount).toBe(1000);
    expect(res.body.order.refundedAmount).toBe(1000);
  });

  it('duplicate refund request returns same result without double-refunding', async () => {
    await createSyncedOrder();

    const first = await request.post('/orders/order-1/refund').send();
    const second = await request.post('/orders/order-1/refund').send();

    expect(second.status).toBe(200);
    expect(second.body.refund.amount).toBe(first.body.refund.amount);
    expect(second.body.order.paymentStatus).toBe('refunded');
  });

  it('concurrent refund requests do not refund twice', async () => {
    await createSyncedOrder();

    const [r1, r2] = await Promise.all([
      request.post('/orders/order-1/refund').send(),
      request.post('/orders/order-1/refund').send(),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.refund.amount).toBe(1000);
    expect(r2.body.refund.amount).toBe(1000);

    const order = await request.get('/orders/order-1');
    expect(order.body.refundedAmount).toBe(1000);
  });

  it('repeated payment event after refund preserves the refund', async () => {
    await createSyncedOrder();
    await request.post('/orders/order-1/refund').send();

    const res = await request.post('/payment-events').send(makeEvent('evt-2'));

    expect(res.status).toBe(200);
    const order = await request.get('/orders/order-1');
    expect(order.body.paymentStatus).toBe('refunded');
  });

  it('rejects refund on unknown order', async () => {
    const res = await request.post('/orders/nonexistent/refund').send();

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('rejects refund on order not yet synced with POS', async () => {
    await request.post('/payment-events').send(makeEvent());

    const res = await request.post('/orders/order-1/refund').send();

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/synced/i);
  });
});
