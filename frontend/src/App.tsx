import PaymentForm from './components/PaymentForm';
import OrderLookup from './components/OrderLookup';
import OrderStatus from './components/OrderStatus';

export default function App() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Skippio — Payment to POS</h1>
      <PaymentForm />
      <hr />
      <OrderLookup />
      <OrderStatus />
    </div>
  );
}
