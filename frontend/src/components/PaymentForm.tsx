import { useState } from 'react';
import { useAppDispatch, useAppSelector, submitPayment } from '../store';

interface ItemRow {
  productId: string;
  quantity: string;
  price: string;
}

const emptyItem = (): ItemRow => ({ productId: '', quantity: '', price: '' });

export default function PaymentForm() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.order.loading);
  const [venueId, setVenueId] = useState('venue-1');
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const updateItem = (i: number, field: keyof ItemRow, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  const total = items.reduce((sum, item) => {
    const q = parseInt(item.quantity) || 0;
    const p = parseInt(item.price) || 0;
    return sum + q * p;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      submitPayment({
        eventId: crypto.randomUUID(),
        type: 'payment.succeeded',
        order: {
          id: crypto.randomUUID(),
          venueId,
          currency: 'EUR',
          items: items.map((item) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 0,
            price: parseInt(item.price) || 0,
          })),
          total,
        },
      }),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Submit Payment</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Venue ID</label>
        <input
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Items</label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-end">
            <input
              placeholder="Product ID"
              value={item.productId}
              onChange={(e) => updateItem(i, 'productId', e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              required
            />
            <input
              placeholder="Qty"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
              className="w-20 border rounded px-3 py-2"
              required
            />
            <input
              placeholder="Price (cents)"
              type="number"
              min="0"
              value={item.price}
              onChange={(e) => updateItem(i, 'price', e.target.value)}
              className="w-32 border rounded px-3 py-2"
              required
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="text-red-500 text-sm px-2"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, emptyItem()])}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Item
        </button>
      </div>

      <div className="text-sm font-medium">
        Total: &euro; {(total / 100).toFixed(2)}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Payment'}
      </button>
    </form>
  );
}
