import { v4 as uuidv4 } from 'uuid';
import { PosPayload, PosTransaction } from '../models/types';

const attemptCounts = new Map<string, number>();
const transactions = new Map<string, PosTransaction>();
let simulatedDelay = 0;

export class PosTemporaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PosTemporaryError';
  }
}

export async function sendToPos(payload: PosPayload): Promise<string> {
  if (simulatedDelay > 0) {
    await new Promise((r) => setTimeout(r, simulatedDelay));
  }

  const count = (attemptCounts.get(payload.orderId) ?? 0) + 1;
  attemptCounts.set(payload.orderId, count);

  if (count === 1) {
    throw new PosTemporaryError('POS temporarily unavailable');
  }

  const transactionRef = `pos-txn-${uuidv4()}`; // unique transaction reference
  const transaction: PosTransaction = {
    transactionRef,
    orderId: payload.orderId,
    venueId: payload.venueId,
    items: payload.items,
    currency: payload.currency,
    total: payload.total,
    timestamp: Date.now(),
  };
  transactions.set(transactionRef, transaction);

  return transactionRef;
}

export function getPosTransactions(): Map<string, PosTransaction> {
  return transactions;
}

export function setDelay(ms: number): void {
  simulatedDelay = ms;
}

export function resetPos(): void {
  attemptCounts.clear();
  transactions.clear();
  simulatedDelay = 0;
}
