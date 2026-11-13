import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { resetStore } from '../src/store/memoryStore';
import { resetPos, setDelay, getPosTransactions } from '../src/pos/posSimulator';

const app = createApp();
const request = supertest(app);

function makeEvent(eventId: string) {
  return {
    eventId,
    type: 'payment.succeeded',
    order: {
      id: 'order-1',
      venueId: 'venue-1',
      currency: 'EUR',
      items: [{ productId: 'prod-1', quantity: 1, price: 300 }],
      total: 300,
    },
  };
}

describe('Concurrency', () => {
  beforeEach(() => {
    resetStore();
    resetPos();
  });

  it('overlapping payment events for the same order do not create duplicate transactions', async () => {
    setDelay(50);

    const [res1, res2] = await Promise.all([
      request.post('/payment-events').send(makeEvent('evt-1')),
      request.post('/payment-events').send(makeEvent('evt-2')),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 201]);

    expect(res1.body.id).toBe('order-1');
    expect(res2.body.id).toBe('order-1');
  });

  it('overlapping sync requests do not create duplicate POS transactions', async () => {
    await request.post('/payment-events').send(makeEvent('evt-1'));

    setDelay(50);

    const [sync1, sync2] = await Promise.all([
      request.post('/orders/order-1/sync').send(),
      request.post('/orders/order-1/sync').send(),
    ]);

    const order = await request.get('/orders/order-1');
    expect(order.body.posStatus).toBe('synced');
    expect(getPosTransactions().size).toBe(1);
  });
});
