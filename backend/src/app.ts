import express from 'express';
import cors from 'cors';
import paymentEventsRouter from './routes/paymentEvents';
import ordersRouter from './routes/orders';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/payment-events', paymentEventsRouter);
  app.use('/orders', ordersRouter);

  return app;
}
