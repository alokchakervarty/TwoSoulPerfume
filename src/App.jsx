import { useEffect, useMemo, useState } from "react";
import { api, clearAuth, getSavedAuth, saveAuth } from "./api";
import AdminPanel from "./components/admin/AdminPanel";
import AddressBook from "./components/AddressBook";
import AddressForm from "./components/AddressForm";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
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
  const [addresses, setAddresses] = useState([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
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
    if (!auth) {
      setAddresses([]);
      setSelectedShippingAddressId("");
      setLoadingAddresses(false);
      return;
    }

    const pendingCheckoutAtStart = pendingCheckout;
    setLoadingAddresses(true);
    const [nextOrders, nextCart, nextAddresses] = await Promise.all([
      api.myOrders().catch(() => ({ items: [] })),
      api.cart().catch(() => emptyCart),
      api.addresses().catch(() => []),
    ]);

    const addressesResult = nextAddresses || [];
    const defaultShipping =
      addressesResult.find((address) => address.isDefaultShipping) || addressesResult[0] || null;

    setOrders(nextOrders || { items: [] });
    setCart(nextCart || emptyCart);
    setAddresses(addressesResult);
    setSelectedShippingAddressId(defaultShipping?.id || "");
    setLoadingAddresses(false);

    if (pendingCheckoutAtStart) {
      setPendingCheckout(false);

      if (defaultShipping) {
        doCheckout(defaultShipping.id);
        return;
      }

      setNotice("No saved shipping address found. Please add one before checkout.");
      setView("address");
    }
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
    setAddresses([]);
    setSelectedShippingAddressId("");
    setView("store");
  }

  function toAddressPayload(address, overrides = {}) {
    return {
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      countryId: address.countryId,
      isDefaultShipping: Boolean(address.isDefaultShipping),
      isDefaultBilling: Boolean(address.isDefaultBilling),
      type: address.type || 2,
      ...overrides,
    };
  }

  async function doCheckout(shippingAddressId) {
    try {
      const order = await api.checkout({
        shippingAddressId,
        billingAddressId: null,
        couponCode: null,
        paymentMethod: "Offline",
      });

      setCart(emptyCart);
      setOrders((current) => ({ items: [order, ...(current.items || [])] }));
      setView("orders");
      setNotice(`Order ${order.orderNumber} created successfully.`);
    } catch (error) {
      setNotice(`Checkout failed: ${error.message}`);
      if (error.message.toLowerCase().includes("invalid shipping address")) {
        loadPrivateData();
        setView("address");
      }
    }
  }

  function handleCheckout() {
    if (!auth) {
      setNotice("Please log in before proceeding to checkout.");
      setPendingCheckout(true);
      setView("login");
      return;
    }

    if (loadingAddresses) {
      setNotice("Loading saved addresses, please wait...");
      return;
    }

    if (addresses.length > 0) {
      const selectedAddress =
        addresses.find((address) => address.id === selectedShippingAddressId) ||
        addresses.find((address) => address.isDefaultShipping) ||
        addresses[0];
      doCheckout(selectedAddress.id);
      return;
    }

    setNotice("No saved shipping address found. Please add one before checkout.");
    setPendingCheckout(true);
    setView("address");
  }

  function refreshAll() {
    loadCatalog();
    loadPrivateData();
  }

  async function setDefaultAddress(address) {
    try {
      await api.updateAddress(address.id, toAddressPayload(address, { isDefaultShipping: true }));
      await loadPrivateData();
      setNotice("Default shipping address updated.");
    } catch (error) {
      setNotice(`Unable to update default address: ${error.message}`);
    }
  }

  async function deleteAddress(addressId) {
    try {
      await api.deleteAddress(addressId);
      setAddresses((current) => current.filter((item) => item.id !== addressId));
      setSelectedShippingAddressId((current) => (current === addressId ? "" : current));
      setNotice("Address removed.");
    } catch (error) {
      setNotice(`Unable to remove address: ${error.message}`);
    }
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

      {view === "address" && (
        <AddressForm
          onCreated={(address) => {
            setAddresses((current) => [address, ...(current || [])]);
            setSelectedShippingAddressId(address.id);
            setNotice("Shipping address saved. You can now proceed to checkout.");
            if (pendingCheckout) {
              setPendingCheckout(false);
              doCheckout(address.id);
              return;
            }

            setView("account");
          }}
          onCancel={() => setView(auth ? "account" : "store")}
        />
      )}

      {view === "account" && (
        <AddressBook
          addresses={addresses}
          loading={loadingAddresses}
          selectedShippingAddressId={selectedShippingAddressId}
          onSelect={setSelectedShippingAddressId}
          onAddNew={() => setView("address")}
          onSetDefault={setDefaultAddress}
          onDelete={deleteAddress}
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
          onRefresh={refreshAll}
          onNotice={setNotice}
        />
      )}

      <Footer />

      <CartDrawer
        open={drawerOpen}
        cart={cart}
        auth={auth}
        addressesCount={addresses.length}
        loadingAddresses={loadingAddresses}
        onClose={() => setDrawerOpen(false)}
        onLogin={() => {
          setDrawerOpen(false);
          setView("login");
        }}
        onManageAddress={() => {
          setDrawerOpen(false);
          setView("account");
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
