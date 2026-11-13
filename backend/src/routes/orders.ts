import { Router, Request, Response } from 'express';
import { getOrder, syncOrder, refundOrder } from '../services/order';

const router = Router();

router.get('/:orderId', async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  try {
    const order = await getOrder(orderId);
    res.status(200).json(order);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:orderId/sync', async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  try {
    
    const order = await syncOrder(orderId);
    res.status(200).json(order);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:orderId/refund', async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  try {
    const order = await refundOrder(orderId);
    res.status(200).json(order);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
