import { useState } from "react";
import { LogOut, Menu, ShoppingBag, UserRound, X } from "lucide-react";

export default function Header({
  auth,
  cartCount,
  isAdmin,
  view,
  onNavigate,
  onOpenCart,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    ["store", "Shop All"],
    ["orders", "Orders"],
    ...(isAdmin ? [["admin", "Admin"]] : []),
  ];

  return (
    <header className="site-header">
      <div className="ticker">GET 5% OFF ON PREPAID ORDERS</div>
      <nav className="nav">
        <button
          className="icon-button mobile-only"
          type="button"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
        <button className="brand" type="button" onClick={() => onNavigate("store")}>
          <span className="brand-mark">TS</span>
          <span>TwoSoul</span>
        </button>
        <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
          <button
            className="icon-button mobile-only close"
            type="button"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
          {nav.map(([target, label]) => (
            <button
              key={target}
              className={view === target ? "active" : ""}
              type="button"
              onClick={() => {
                onNavigate(target);
                setMobileOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="icon-button"
            type="button"
            onClick={onOpenCart}
            aria-label="Open cart"
          >
            <ShoppingBag size={21} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          {auth ? (
            <>
              <button
                className="account"
                type="button"
                onClick={() => onNavigate("orders")}
              >
                <UserRound size={18} />
                {auth.firstName || "Account"}
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={onLogout}
                aria-label="Logout"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <button className="text-button" type="button" onClick={() => onNavigate("login")}>
              Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
