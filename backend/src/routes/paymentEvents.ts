import { Router, Request, Response } from 'express';
import { validatePaymentEvent } from '../validation';
import { processPaymentEvent } from '../services/order';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const validation = validatePaymentEvent(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const { order, created } = await processPaymentEvent(validation.event);
    res.status(created ? 201 : 200).json(order);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
