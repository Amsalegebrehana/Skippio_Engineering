import { useAppDispatch, useAppSelector, syncOrder, refundOrder } from '../store';

const fmt = (cents: number) => `€ ${(cents / 100).toFixed(2)}`;

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  syncing: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  synced: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-orange-100 text-orange-800',
};

function Badge({ label }: { label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[label] ?? 'bg-gray-100'}`}>
      {label}
    </span>
  );
}

export default function OrderStatus() {
  const dispatch = useAppDispatch();
  const { currentOrder: order, loading, error } = useAppSelector((s) => s.order);

  if (!order) return null;

  const canRetry = order.posStatus === 'failed' || order.posStatus === 'pending';
  const canRefund = order.posStatus === 'synced' && order.paymentStatus === 'paid';

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h2 className="text-xl font-semibold">Order Details</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="font-medium">Order ID:</span> {order.id}</div>
        <div><span className="font-medium">Venue:</span> {order.venueId}</div>
        <div><span className="font-medium">Payment:</span> <Badge label={order.paymentStatus} /></div>
        <div><span className="font-medium">POS:</span> <Badge label={order.posStatus} /></div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1">Product</th>
            <th className="py-1">Qty</th>
            <th className="py-1">Price</th>
            <th className="py-1">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">{item.productId}</td>
              <td className="py-1">{item.quantity}</td>
              <td className="py-1">{fmt(item.price)}</td>
              <td className="py-1">{fmt(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-sm space-y-1">
        <div><span className="font-medium">Total:</span> {fmt(order.total)}</div>
        <div><span className="font-medium">POS Attempts:</span> {order.posAttemptCount}</div>
        {order.posTransactionRef && (
          <div><span className="font-medium">Transaction Ref:</span> {order.posTransactionRef}</div>
        )}
        {order.lastPosError && (
          <div className="text-red-600"><span className="font-medium">POS Error:</span> {order.lastPosError}</div>
        )}
        {order.refundedAmount != null && order.paymentStatus === 'refunded' && (
          <div><span className="font-medium">Refunded:</span> {fmt(order.refundedAmount)}</div>
        )}
      </div>

      <div className="flex gap-2">
        {canRetry && (
          <button
            onClick={() => dispatch(syncOrder(order.id))}
            disabled={loading}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Retry POS Sync'}
          </button>
        )}
        {canRefund && (
          <button
            onClick={() => dispatch(refundOrder(order.id))}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Refund'}
          </button>
        )}
      </div>
    </div>
  );
}
