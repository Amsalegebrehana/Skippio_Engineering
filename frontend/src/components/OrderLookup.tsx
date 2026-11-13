import { useState } from 'react';
import { useAppDispatch, useAppSelector, fetchOrder } from '../store';

export default function OrderLookup() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.order.loading);
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) dispatch(fetchOrder(orderId.trim()));
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Order Lookup</label>
        <input
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !orderId.trim()}
        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        Look Up
      </button>
    </form>
  );
}
