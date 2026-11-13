import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { resetStore } from '../src/store/memoryStore';
import { resetPos, getPosTransactions } from '../src/pos/posSimulator';

const app = createApp();
const request = supertest(app);

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'evt-1',
    type: 'payment.succeeded',
    order: {
      id: 'order-1',
      venueId: 'venue-1',
      currency: 'EUR',
      items: [{ productId: 'prod-1', quantity: 2, price: 500 }],
      total: 1000,
    },
    ...overrides,
  };
}

describe('Payment events', () => {
  beforeEach(() => {
    resetStore();
    resetPos();
  });

  it('valid event creates a paid order and one POS transaction', async () => {
    const res = await request.post('/payment-events').send(makeEvent());

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('order-1');
    expect(res.body.paymentStatus).toBe('paid');
    expect(res.body.posStatus).toBe('failed');
    expect(res.body.posAttemptCount).toBe(1);

    const retry = await request.post(`/orders/order-1/sync`).send();
    expect(retry.status).toBe(200);
    expect(retry.body.posStatus).toBe('synced');
    expect(retry.body.posTransactionRef).toBeTruthy();

    expect(getPosTransactions().size).toBe(1);
  });

  it('duplicate eventId returns 200 without creating another transaction', async () => {
    await request.post('/payment-events').send(makeEvent());
    await request.post('/orders/order-1/sync').send();
    const txCountBefore = getPosTransactions().size;

    const res = await request.post('/payment-events').send(makeEvent());

    expect(res.status).toBe(200);
    expect(getPosTransactions().size).toBe(txCountBefore);
  });

  it('different eventId with same order data returns 200 without duplicate transaction', async () => {
    await request.post('/payment-events').send(makeEvent());
    await request.post('/orders/order-1/sync').send();
    const txCountBefore = getPosTransactions().size;

    const res = await request
      .post('/payment-events')
      .send(makeEvent({ eventId: 'evt-2' }));

    expect(res.status).toBe(200);
    expect(getPosTransactions().size).toBe(txCountBefore);
  });

  it('rejects invalid total', async () => {
    const res = await request
      .post('/payment-events')
      .send(makeEvent({ order: { ...makeEvent().order, total: 9999 } }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/total/i);
  });

  it('rejects conflicting order data for existing order', async () => {
    await request.post('/payment-events').send(makeEvent());

    const conflicting = makeEvent({
      eventId: 'evt-2',
      order: { ...makeEvent().order, total: 2000, items: [{ productId: 'prod-1', quantity: 4, price: 500 }] },
    });
    const res = await request.post('/payment-events').send(conflicting);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/conflict/i);
  });

  it('conflicting event does not change existing order', async () => {
    await request.post('/payment-events').send(makeEvent());
    const before = await request.get('/orders/order-1');

    const conflicting = makeEvent({
      eventId: 'evt-2',
      order: { ...makeEvent().order, venueId: 'different-venue' },
    });
    await request.post('/payment-events').send(conflicting);

    const after = await request.get('/orders/order-1');
    expect(after.body.venueId).toBe(before.body.venueId);
  });
});
