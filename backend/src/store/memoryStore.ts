import { Order, PosTransaction } from '../models/types';

export const orders = new Map<string, Order>();
export const posTransactions = new Map<string, PosTransaction>();

export function resetStore(): void {
  orders.clear();
  posTransactions.clear();
}
