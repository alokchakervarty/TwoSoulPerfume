import { Trash2, X } from "lucide-react";
import { api } from "../api";
import { currency, validImage } from "../utils/format";

export default function CartDrawer({
  open,
  cart,
  auth,
  onClose,
  onLogin,
  onCheckout,
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

  function getItemQuantity(item) {
    return Number(item.quantity ?? 1);
  }

  function getItemUnitPrice(item) {
    const quantity = getItemQuantity(item);
    const priceValue = item.price ?? item.unitPrice;
    if (priceValue != null) return Number(priceValue);
    if (item.lineTotal != null && quantity) {
      return Number(item.lineTotal) / quantity;
    }
    return 0;
  }

  function handleCheckout() {
    if (!items.length) return;
    if (!auth) {
      onNotice("Please log in before proceeding to checkout.");
      onLogin?.();
      return;
    }
    if (onCheckout) {
      onCheckout();
      return;
    }
    onNotice(
      "Please add a saved shipping address in CommerceCore before checkout."
    );
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
      {items.map((item) => {
        const quantity = getItemQuantity(item);
        const unitPrice = getItemUnitPrice(item);

        return (
          <div className="cart-line" key={item.id || item.cartItemId}>
            <img src={validImage(item.imageUrl)} alt={item.productName || "Cart item"} />
            <div>
              <strong>{item.productName || item.name || "Product"}</strong>
              <span>
                {currency(unitPrice)} x {quantity}
              </span>
            </div>
            <button className="icon-button" type="button" onClick={() => remove(item)}>
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}
      <div className="drawer-total">
        <span>Subtotal</span>
        <strong>{currency(cart.subTotal)}</strong>
      </div>
      <button
        className="primary full"
        disabled={!items.length}
        type="button"
        onClick={handleCheckout}
      >
        Checkout
      </button>
    </aside>
  );
}
