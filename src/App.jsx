import { useEffect, useMemo, useState } from "react";
import { api, clearAuth, getSavedAuth, saveAuth } from "./api";
import AdminPanel from "./components/admin/AdminPanel";
import CartDrawer from "./components/CartDrawer";
import Header from "./components/Header";
import Notice from "./components/Notice";
import OrdersPanel from "./components/OrdersPanel";
import OtpLogin from "./components/OtpLogin";
import ProductDetail from "./components/ProductDetail";
import Storefront from "./components/Storefront";
import { emptyCart } from "./constants";
import { normalizeProduct } from "./utils/products";

function getInitialView() {
  if (typeof window === "undefined") return "store";

  const hash = window.location.hash;
  if (hash.startsWith("#/product/")) {
    const productId = decodeURIComponent(hash.replace("#/product/", ""));
    return productId ? `product:${productId}` : "store";
  }

  return "store";
}

function getProductHash(productId) {
  return `#/product/${encodeURIComponent(productId)}`;
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [auth, setAuth] = useState(getSavedAuth());
  const [productsState, setProductsState] = useState({
    items: [],
    loading: true,
  });
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
      setProductsState({
        ...productPage,
        items: productPage.items || [],
        loading: false,
      });
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
    if (typeof window === "undefined") return undefined;

    function handleHashChange() {
      const hash = window.location.hash;
      if (hash.startsWith("#/product/")) {
        const productId = decodeURIComponent(hash.replace("#/product/", ""));
        if (productId) {
          setView(`product:${productId}`);
        }
        return;
      }

      setView("store");
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (view === "store") {
      if (window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
      return;
    }

    if (view.startsWith("product:")) {
      const nextHash = getProductHash(view.split(":")[1]);
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
      }
    }
  }, [view]);

  useEffect(() => {
    loadPrivateData();
  }, [auth?.accessToken]);

  async function addProductToCart(product) {
    if (!product?.variantId) {
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

  function handleLogin(nextAuth) {
    saveAuth(nextAuth);
    setAuth(nextAuth);
    setView("store");
  }

  function logout() {
    clearAuth();
    setAuth(null);
    setCart(emptyCart);
    setOrders({ items: [] });
    setView("store");
  }

  function handleCheckout() {
    if (!auth) {
      setNotice("Please log in before proceeding to checkout.");
      setView("login");
      return;
    }

    setNotice(
      "You are logged in. Add a saved shipping address in CommerceCore to complete checkout."
    );
  }

  function refreshAll() {
    loadCatalog();
    loadPrivateData();
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

      <Notice message={notice} onClose={() => setNotice("")} />

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

      {view === "login" && <OtpLogin onLogin={handleLogin} />}

      {view === "orders" && (
        <OrdersPanel orders={orders} onRefresh={loadPrivateData} />
      )}

      {view === "admin" && (
        <AdminPanel
          isAdmin={isAdmin}
          products={products}
          categories={categories}
          orders={orders}
          onRefresh={refreshAll}
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
        onCheckout={() => {
          setDrawerOpen(false);
          handleCheckout();
        }}
        onChanged={setCart}
        onNotice={setNotice}
      />
    </div>
  );
}
