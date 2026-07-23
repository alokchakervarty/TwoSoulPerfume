import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  PackagePlus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { api, clearAuth, getSavedAuth, saveAuth } from "./api";

const fallbackImage =
  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=85";

const categoriesFallback = [
  "Perfumes",
  "Gift Sets",
  "Premium",
  "Oud",
  "Unisex",
  "Bestsellers",
];

const emptyCart = { items: [], subTotal: 0, totalItemCount: 0 };

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function validImage(url) {
  return url && /^https?:\/\//i.test(url) ? url : fallbackImage;
}

function normalizeProduct(product) {
  const variant = product.variants?.find((item) => item.isActive) || product.variants?.[0];
  return {
    ...product,
    image: validImage(product.imageUrls?.[0] || variant?.imageUrl),
    variantId: variant?.id,
    price: variant?.price || product.basePrice,
    mrp: variant?.compareAtPrice || product.compareAtPrice,
  };
}

export default function App() {
  const [view, setView] = useState("store");
  const [auth, setAuth] = useState(getSavedAuth());
  const [productsState, setProductsState] = useState({ items: [], loading: true });
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(emptyCart);
  const [orders, setOrders] = useState({ items: [] });
  const [filters, setFilters] = useState({ Search: "", CategoryId: "" });
  const [notice, setNotice] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = auth?.roles?.includes("Admin");
  const products = useMemo(
    () => productsState.items.map(normalizeProduct),
    [productsState.items]
  );

  async function loadCatalog(nextFilters = filters) {
    setProductsState((current) => ({ ...current, loading: true }));
    try {
      const [productPage, categoryList] = await Promise.all([
        api.products({ ...nextFilters, PageSize: 24 }),
        api.categories(),
      ]);
      setProductsState({ ...productPage, items: productPage.items || [], loading: false });
      setCategories(categoryList || []);
    } catch (error) {
      setProductsState({ items: [], loading: false, error: error.message });
    }
  }

  async function loadPrivateData() {
    if (!auth) return;
    const nextOrders = await api.myOrders().catch(() => ({ items: [] }));
    const nextCart = await api.cart().catch(() => emptyCart);
    setOrders(nextOrders || { items: [] });
    setCart(nextCart || emptyCart);
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    loadPrivateData();
  }, [auth?.accessToken]);

  async function addProductToCart(product) {
    if (!auth) {
      setView("login");
      setNotice("Login with email OTP to add products to your cart.");
      return;
    }
    if (!product.variantId) {
      setNotice("This product has no active variant yet.");
      return;
    }
    try {
      const nextCart = await api.addToCart(product.variantId, 1);
      setCart(nextCart);
      setDrawerOpen(true);
      setNotice(`${product.name} added to cart.`);
    } catch (error) {
      setNotice(`Cart API is unavailable: ${error.message}`);
    }
  }

  function logout() {
    clearAuth();
    setAuth(null);
    setCart(emptyCart);
    setOrders({ items: [] });
    setView("store");
  }

  return (
    <div className="app">
      <Header
        auth={auth}
        cartCount={cart.totalItemCount || cart.items?.length || 0}
        isAdmin={isAdmin}
        view={view}
        onNavigate={setView}
        onOpenCart={() => setDrawerOpen(true)}
        onLogout={logout}
      />

      {notice && (
        <button className="notice" type="button" onClick={() => setNotice("")}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <X size={16} />
        </button>
      )}

      {view === "store" && (
        <Storefront
          products={products}
          categories={categories}
          filters={filters}
          loading={productsState.loading}
          error={productsState.error}
          onFilter={(next) => {
            setFilters(next);
            loadCatalog(next);
          }}
          onAdd={addProductToCart}
          onProduct={(product) => setView(`product:${product.id}`)}
        />
      )}

      {view.startsWith("product:") && (
        <ProductDetail
          product={products.find((item) => item.id === view.split(":")[1])}
          onBack={() => setView("store")}
          onAdd={addProductToCart}
        />
      )}

      {view === "login" && (
        <OtpLogin
          onLogin={(nextAuth) => {
            saveAuth(nextAuth);
            setAuth(nextAuth);
            setView("store");
          }}
        />
      )}

      {view === "orders" && (
        <OrdersPanel orders={orders} onRefresh={loadPrivateData} />
      )}

      {view === "admin" && (
        <AdminPanel
          isAdmin={isAdmin}
          products={products}
          categories={categories}
          orders={orders}
          onRefresh={() => {
            loadCatalog();
            loadPrivateData();
          }}
          onNotice={setNotice}
        />
      )}

      <CartDrawer
        open={drawerOpen}
        cart={cart}
        auth={auth}
        onClose={() => setDrawerOpen(false)}
        onLogin={() => {
          setDrawerOpen(false);
          setView("login");
        }}
        onChanged={(nextCart) => setCart(nextCart)}
        onNotice={setNotice}
      />
    </div>
  );
}

function Header({ auth, cartCount, isAdmin, view, onNavigate, onOpenCart, onLogout }) {
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
        <button className="icon-button mobile-only" type="button" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
        <button className="brand" type="button" onClick={() => onNavigate("store")}>
          <span className="brand-mark">TS</span>
          <span>TwoSoul</span>
        </button>
        <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
          <button className="icon-button mobile-only close" type="button" onClick={() => setMobileOpen(false)}>
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
          <button className="icon-button" type="button" onClick={onOpenCart} aria-label="Open cart">
            <ShoppingBag size={21} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          {auth ? (
            <>
              <button className="account" type="button" onClick={() => onNavigate("orders")}>
                <UserRound size={18} />
                {auth.firstName || "Account"}
              </button>
              <button className="icon-button" type="button" onClick={onLogout} aria-label="Logout">
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

function Storefront({ products, categories, filters, loading, error, onFilter, onAdd, onProduct }) {
  const displayCategories = categories.length ? categories : categoriesFallback.map((name) => ({ name }));

  return (
    <main>
      <section className="hero">
        <img src={fallbackImage} alt="Luxury perfume bottles" />
        <div className="hero-copy">
          <p>Launch Offer</p>
          <h1>TwoSoul Perfumes</h1>
          <span>Signature scents, elevated gifting, and long-lasting daily wear.</span>
          <button type="button" onClick={() => document.getElementById("products")?.scrollIntoView()}>
            Shop Collection <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <section className="category-strip" aria-label="Featured categories">
        {displayCategories.slice(0, 8).map((category) => (
          <button
            key={category.id || category.name}
            type="button"
            onClick={() => onFilter({ ...filters, CategoryId: category.id || "" })}
          >
            <Sparkles size={16} />
            {category.name}
          </button>
        ))}
      </section>

      <section className="toolbar" id="products">
        <div>
          <h2>Bestsellers</h2>
          <p>{products.length} products ready from CommerceCore</p>
        </div>
        <label className="search">
          <Search size={18} />
          <input
            value={filters.Search}
            placeholder="Search perfumes"
            onChange={(event) => onFilter({ ...filters, Search: event.target.value })}
          />
        </label>
      </section>

      {error && <div className="state">API error: {error}</div>}
      {loading && <div className="grid skeleton-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton" key={index} />)}</div>}
      {!loading && !products.length && <div className="state">No products found.</div>}

      <section className="grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <button type="button" className="image-button" onClick={() => onProduct(product)}>
              <img src={product.image} alt={product.name} />
              {product.mrp > product.price && <span>{Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF</span>}
            </button>
            <div className="product-info">
              <p>{product.categoryName || "Perfume"}</p>
              <h3>{product.name}</h3>
              <div className="rating"><Star size={15} fill="currentColor" /> {product.averageRating || "4.7"} | ({product.reviewCount || 0})</div>
              <div className="price-row">
                <strong>{currency(product.price)}</strong>
                {product.mrp > product.price && <del>{currency(product.mrp)}</del>}
              </div>
              <button className="primary full" type="button" onClick={() => onAdd(product)}>
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function ProductDetail({ product, onBack, onAdd }) {
  if (!product) {
    return <main className="state">Product not found. <button type="button" onClick={onBack}>Back to shop</button></main>;
  }

  return (
    <main className="detail">
      <button className="text-button" type="button" onClick={onBack}>Back to shop</button>
      <div className="detail-media">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="detail-copy">
        <p>{product.brandName || "TwoSoul"}</p>
        <h1>{product.name}</h1>
        <div className="rating"><Star size={16} fill="currentColor" /> {product.averageRating || "4.7"} rating</div>
        <p>{product.description || product.shortDescription || "A refined perfume crafted for memorable everyday wear."}</p>
        <div className="price-row large">
          <strong>{currency(product.price)}</strong>
          {product.mrp > product.price && <del>{currency(product.mrp)}</del>}
        </div>
        <button className="primary" type="button" onClick={() => onAdd(product)}>
          <ShoppingBag size={19} /> Add to Cart
        </button>
      </div>
    </main>
  );
}

function OtpLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (step === "request") {
        await api.requestOtp(email);
        setStep("verify");
      } else {
        const auth = await api.loginWithOtp(email, code);
        onLogin(auth);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <ShieldCheck size={34} />
        <h1>Email OTP Login</h1>
        <p>Use your CommerceCore email account to access cart, orders, and admin tools.</p>
        <label>
          Email
          <input value={email} type="email" required onChange={(event) => setEmail(event.target.value)} />
        </label>
        {step === "verify" && (
          <label>
            OTP Code
            <input value={code} required onChange={(event) => setCode(event.target.value)} />
          </label>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={loading} type="submit">
          {loading ? "Please wait..." : step === "request" ? "Send OTP" : "Verify OTP"}
        </button>
      </form>
    </main>
  );
}

function CartDrawer({ open, cart, auth, onClose, onLogin, onChanged, onNotice }) {
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
        <button className="icon-button" type="button" onClick={onClose}><X size={21} /></button>
      </div>
      {!auth && (
        <div className="state small">
          Login to sync your CommerceCore cart.
          <button className="primary full" type="button" onClick={onLogin}>Login with OTP</button>
        </div>
      )}
      {auth && !items.length && <div className="state small">Your cart is empty.</div>}
      {items.map((item) => (
        <div className="cart-line" key={item.id || item.cartItemId}>
          <img src={validImage(item.imageUrl)} alt={item.productName || "Cart item"} />
          <div>
            <strong>{item.productName || item.name || "Product"}</strong>
            <span>{currency(item.lineTotal || item.price)} x {item.quantity || 1}</span>
          </div>
          <button className="icon-button" type="button" onClick={() => remove(item)}><Trash2 size={18} /></button>
        </div>
      ))}
      <div className="drawer-total">
        <span>Subtotal</span>
        <strong>{currency(cart.subTotal)}</strong>
      </div>
      <button className="primary full" disabled={!items.length} type="button" onClick={() => onNotice("Checkout form needs saved address IDs from CommerceCore.")}>
        Checkout
      </button>
    </aside>
  );
}

function OrdersPanel({ orders, onRefresh }) {
  return (
    <main className="panel">
      <div className="panel-head">
        <div>
          <h1>My Orders</h1>
          <p>CommerceCore order history</p>
        </div>
        <button className="secondary" type="button" onClick={onRefresh}>Refresh</button>
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

function AdminPanel({ isAdmin, products, categories, orders, onRefresh, onNotice }) {
  const [tab, setTab] = useState("overview");

  if (!isAdmin) {
    return <main className="state">Admin access is required.</main>;
  }

  return (
    <main className="admin-layout">
      <aside className="admin-nav">
        <h2>Admin</h2>
        {[
          ["overview", LayoutDashboard, "Overview"],
          ["products", PackagePlus, "Products"],
          ["categories", Boxes, "Categories"],
          ["orders", BarChart3, "Orders"],
        ].map(([key, Icon, label]) => (
          <button key={key} className={tab === key ? "active" : ""} type="button" onClick={() => setTab(key)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </aside>
      <section className="admin-content">
        {tab === "overview" && (
          <div className="metrics">
            <Metric label="Products" value={products.length} />
            <Metric label="Categories" value={categories.length} />
            <Metric label="Orders" value={orders.items?.length || 0} />
          </div>
        )}
        {tab === "products" && (
          <ProductAdmin products={products} categories={categories} onRefresh={onRefresh} onNotice={onNotice} />
        )}
        {tab === "categories" && (
          <CategoryAdmin categories={categories} onRefresh={onRefresh} onNotice={onNotice} />
        )}
        {tab === "orders" && (
          <OrderAdmin orders={orders} onRefresh={onRefresh} onNotice={onNotice} />
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductAdmin({ products, categories, onRefresh, onNotice }) {
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    sku: "",
    basePrice: "",
    compareAtPrice: "",
    costPrice: "",
    trackInventory: true,
    categoryId: categories[0]?.id || "",
    brandId: "",
    imageUrls: "",
  });

  async function submit(event) {
    event.preventDefault();
    try {
      await api.createProduct({
        ...form,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        brandId: form.brandId || null,
        imageUrls: form.imageUrls ? form.imageUrls.split(",").map((url) => url.trim()) : [],
      });
      onNotice("Product created.");
      onRefresh();
    } catch (error) {
      onNotice(`Product save failed: ${error.message}`);
    }
  }

  return (
    <div className="admin-grid">
      <form className="editor" onSubmit={submit}>
        <h2>Add Product</h2>
        <input placeholder="Product name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input placeholder="SKU" required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
        <input placeholder="Short description" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <div className="two-col">
          <input placeholder="Price" type="number" required value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} />
          <input placeholder="MRP" type="number" value={form.compareAtPrice} onChange={(event) => setForm({ ...form, compareAtPrice: event.target.value })} />
        </div>
        <select value={form.categoryId} required onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input placeholder="Brand ID optional" value={form.brandId} onChange={(event) => setForm({ ...form, brandId: event.target.value })} />
        <input placeholder="Image URLs comma separated" value={form.imageUrls} onChange={(event) => setForm({ ...form, imageUrls: event.target.value })} />
        <button className="primary full" type="submit">Create Product</button>
      </form>
      <DataTable
        columns={["Name", "Category", "Price", "Stock"]}
        rows={products.map((product) => [product.name, product.categoryName, currency(product.price), product.variants?.[0]?.availableStock ?? "-"])}
        empty="No products."
      />
    </div>
  );
}

function CategoryAdmin({ categories, onRefresh, onNotice }) {
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", parentCategoryId: "" });

  async function submit(event) {
    event.preventDefault();
    try {
      await api.createCategory({ ...form, parentCategoryId: form.parentCategoryId || null });
      onNotice("Category created.");
      setForm({ name: "", description: "", imageUrl: "", parentCategoryId: "" });
      onRefresh();
    } catch (error) {
      onNotice(`Category save failed: ${error.message}`);
    }
  }

  return (
    <div className="admin-grid">
      <form className="editor" onSubmit={submit}>
        <h2>Add Category</h2>
        <input placeholder="Category name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
        <button className="primary full" type="submit">Create Category</button>
      </form>
      <DataTable
        columns={["Name", "Slug", "Active"]}
        rows={categories.map((category) => [category.name, category.slug, category.isActive ? "Yes" : "No"])}
        empty="No categories."
      />
    </div>
  );
}

function OrderAdmin({ orders, onRefresh, onNotice }) {
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
        <button className="secondary" type="button" onClick={onRefresh}>Refresh</button>
      </div>
      {(orders.items || []).map((order) => (
        <div className="order-row" key={order.id}>
          <div>
            <strong>{order.orderNumber}</strong>
            <span>{currency(order.totalAmount)} · {order.status}</span>
          </div>
          <select value={order.status || "Pending"} onChange={(event) => update(order.id, event.target.value)}>
            {["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      ))}
      {!(orders.items || []).length && <div className="state small">No orders yet.</div>}
    </div>
  );
}

function DataTable({ columns, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell || "-"}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="state small">{empty}</div>}
    </div>
  );
}
