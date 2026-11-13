import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { resetStore } from '../src/store/memoryStore';
import { resetPos, getPosTransactions } from '../src/pos/posSimulator';

const app = createApp();
const request = supertest(app);

function makeEvent() {
  return {
    eventId: 'evt-1',
    type: 'payment.succeeded',
    order: {
      id: 'order-1',
      venueId: 'venue-1',
      currency: 'EUR',
      items: [{ productId: 'prod-1', quantity: 1, price: 750 }],
      total: 750,
    },
  };
}

describe('POS retry', () => {
  beforeEach(() => {
    resetStore();
    resetPos();
  });

  it('first POS attempt fails but payment is preserved', async () => {
    const res = await request.post('/payment-events').send(makeEvent());

    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('paid');
    expect(res.body.posStatus).toBe('failed');
    expect(res.body.posAttemptCount).toBe(1);
    expect(res.body.lastPosError).toBeTruthy();
  });

  it('retry sync succeeds on second attempt', async () => {
    await request.post('/payment-events').send(makeEvent());

    const res = await request.post('/orders/order-1/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.posStatus).toBe('synced');
    expect(res.body.posTransactionRef).toBeTruthy();
    expect(res.body.posAttemptCount).toBe(2);
    expect(res.body.lastPosError).toBeNull();
    expect(getPosTransactions().size).toBe(1);
  });

  it('retry after success does not create additional transaction', async () => {
    await request.post('/payment-events').send(makeEvent());
    await request.post('/orders/order-1/sync').send();
    const txCountBefore = getPosTransactions().size;

    const res = await request.post('/orders/order-1/sync').send();

    expect(res.status).toBe(200);
    expect(res.body.posStatus).toBe('synced');
    expect(getPosTransactions().size).toBe(txCountBefore);
  });
});
