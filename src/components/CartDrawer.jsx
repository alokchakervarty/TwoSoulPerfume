import { Trash2, X } from "lucide-react";
import { api } from "../api";
import { currency, validImage } from "../utils/format";

export default function CartDrawer({
  open,
  cart,
  auth,
  onClose,
  onLogin,
  onChanged,
  onNotice,
}) {
  const items = cart.items || [];

  async function remove(item) {
    try {
      const nextCart = await api.removeCartItem(item.id || item.cartItemId);
      onChanged(nextCart);
    } catch (error) {
      onNotice(`Cart update failed: ${error.message}`);
    }
  }

  return (
    <aside className={`cart-drawer ${open ? "open" : ""}`}>
      <div className="drawer-head">
        <h2>Your Cart</h2>
        <button className="icon-button" type="button" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {!auth && (
        <div className="state small">
          Login to sync your CommerceCore cart.
          <button className="primary full" type="button" onClick={onLogin}>
            Login with OTP
          </button>
        </div>
      )}
      {auth && !items.length && <div className="state small">Your cart is empty.</div>}
      {items.map((item) => (
        <div className="cart-line" key={item.id || item.cartItemId}>
          <img src={validImage(item.imageUrl)} alt={item.productName || "Cart item"} />
          <div>
            <strong>{item.productName || item.name || "Product"}</strong>
            <span>
              {currency(item.lineTotal || item.price)} x {item.quantity || 1}
            </span>
          </div>
          <button className="icon-button" type="button" onClick={() => remove(item)}>
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <div className="drawer-total">
        <span>Subtotal</span>
        <strong>{currency(cart.subTotal)}</strong>
      </div>
      <button
        className="primary full"
        disabled={!items.length}
        type="button"
        onClick={() => onNotice("Checkout form needs saved address IDs from CommerceCore.")}
      >
        Checkout
      </button>
    </aside>
  );
}
