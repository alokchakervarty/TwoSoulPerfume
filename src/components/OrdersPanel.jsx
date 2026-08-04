import { currency } from "../utils/format";
import DataTable from "./DataTable";

export default function OrdersPanel({ orders, onRefresh }) {
  return (
    <main className="panel">
      <div className="panel-head">
        <div>
          <h1>My Orders</h1>
          <p>Your TwoSoul order history</p>
        </div>
        <button className="secondary" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <DataTable
        columns={["Order", "Status", "Payment", "Total", "Placed"]}
        rows={(orders.items || []).map((order) => [
          order.orderNumber,
          order.status,
          order.paymentStatus,
          currency(order.totalAmount),
          order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "-",
        ])}
        empty="No orders yet."
      />
    </main>
  );
}
