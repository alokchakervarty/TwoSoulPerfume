import { useState } from "react";
import { BarChart3, Boxes, LayoutDashboard, PackagePlus } from "lucide-react";
import CategoryAdmin from "./CategoryAdmin";
import Metric from "./Metric";
import OrderAdmin from "./OrderAdmin";
import ProductAdmin from "./ProductAdmin";

export default function AdminPanel({
  isAdmin,
  products,
  categories,
  orders,
  onRefresh,
  onNotice,
}) {
  const [tab, setTab] = useState("overview");

  if (!isAdmin) {
    return <main className="state">Admin access is required.</main>;
  }

  return (
    <main className="admin-layout reveal">
      <aside className="admin-nav">
        <h2>Admin</h2>
        {[
          ["overview", LayoutDashboard, "Overview"],
          ["products", PackagePlus, "Products"],
          ["categories", Boxes, "Categories"],
          ["orders", BarChart3, "Orders"],
        ].map(([key, Icon, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            type="button"
            onClick={() => setTab(key)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </aside>
      <section className="admin-content">
        <div className="admin-heading">
          <p>Control Center</p>
          <h2>Store Operations</h2>
        </div>
        {tab === "overview" && (
          <div className="metrics">
            <Metric label="Products" value={products.length} />
            <Metric label="Categories" value={categories.length} />
            <Metric label="Orders" value={orders.items?.length || 0} />
          </div>
        )}
        {tab === "products" && (
          <ProductAdmin
            products={products}
            categories={categories}
            onRefresh={onRefresh}
            onNotice={onNotice}
          />
        )}
        {tab === "categories" && (
          <CategoryAdmin
            categories={categories}
            onRefresh={onRefresh}
            onNotice={onNotice}
          />
        )}
        {tab === "orders" && (
          <OrderAdmin orders={orders} onRefresh={onRefresh} onNotice={onNotice} />
        )}
      </section>
    </main>
  );
}
