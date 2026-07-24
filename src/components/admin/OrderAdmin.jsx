import { api } from "../../api";
import { currency } from "../../utils/format";

const orderStatuses = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function OrderAdmin({ orders, onRefresh, onNotice }) {
  async function update(id, status) {
    try {
      await api.updateOrderStatus(id, status);
      onNotice("Order status updated.");
      onRefresh();
    } catch (error) {
      onNotice(`Order update failed: ${error.message}`);
    }
  }

  return (
    <div>
      <div className="panel-head">
        <h2>Orders</h2>
        <button className="secondary" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      {(orders.items || []).map((order) => (
        <div className="order-row" key={order.id}>
          <div>
            <strong>{order.orderNumber}</strong>
            <span>
              {currency(order.totalAmount)} - {order.status}
            </span>
          </div>
          <select
            value={order.status || "Pending"}
            onChange={(event) => update(order.id, event.target.value)}
          >
            {orderStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      ))}
      {!(orders.items || []).length && <div className="state small">No orders yet.</div>}
    </div>
  );
}
