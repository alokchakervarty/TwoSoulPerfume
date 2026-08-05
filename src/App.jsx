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
import PasswordLogin from "./components/PasswordLogin";
import ProductDetail from "./components/ProductDetail";
import Storefront from "./components/Storefront";
import { emptyCart } from "./constants";
import { normalizeProduct } from "./utils/products";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise;

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

const hashViewMap = {
  "#/login": "login",
  "#/account": "account",
  "#/orders": "orders",
  "#/admin": "admin",
  "#/address": "address",
  "#/password-login": "password-login",
  "#/store": "store",
};

const viewHashMap = {
  login: "#/login",
  account: "#/account",
  orders: "#/orders",
  admin: "#/admin",
  address: "#/address",
  "password-login": "#/password-login",
  store: "#/store",
};

function getViewFromHash(hash) {
  if (!hash) return "store";

  if (hash.startsWith("#/product/")) {
    const productId = decodeURIComponent(hash.replace("#/product/", ""));
    return productId ? `product:${productId}` : "store";
  }

  return hashViewMap[hash] || "store";
}

function getInitialView() {
  if (typeof window === "undefined") return "store";

  return getViewFromHash(window.location.hash);
}

function getProductHash(productId) {
  return `#/product/${encodeURIComponent(productId)}`;
}

function isAuthError(error) {
  return String(error?.message || "").includes("401");
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
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState("Razorpay");
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
    const me = await api.me().catch((error) => error);
    if (me instanceof Error && isAuthError(me)) {
      clearAuth();
      setAuth(null);
      setCart(emptyCart);
      setOrders({ items: [] });
      setAddresses([]);
      setSelectedShippingAddressId("");
      setLoadingAddresses(false);
      setPendingCheckout(false);
      setNotice("Session expired. Please log in again.");
      setView("login");
      return;
    }

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
      const checkoutPaymentMethod = pendingPaymentMethod || "Razorpay";
      setPendingPaymentMethod("Razorpay");

      if (defaultShipping) {
        if (checkoutPaymentMethod === "COD") {
          doCheckout(defaultShipping.id, "Offline");
        } else {
          startRazorpayCheckout(defaultShipping.id);
        }
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
      setView(getViewFromHash(window.location.hash));
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
      return;
    }

    const nextHash = viewHashMap[view];
    if (nextHash && window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
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
      type: String(address.type || "2"),
      ...overrides,
    };
  }

  async function doCheckout(shippingAddressId, paymentMethod = "Offline") {
    try {
      const order = await api.checkout({
        shippingAddressId,
        billingAddressId: null,
        couponCode: null,
        paymentMethod,
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

  async function startRazorpayCheckout(shippingAddressId) {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      setNotice("Payment is not configured. Missing Razorpay key.");
      return;
    }

    const amountPaise = Math.round(Number(cart.subTotal || 0) * 100);
    if (amountPaise < 100) {
      setNotice("Minimum payable amount is Rs 1.");
      return;
    }

    try {
      const order = await api.createRazorpayOrder({
        amount: amountPaise,
        currency: "INR",
        receipt: `twosoul_${Date.now()}`,
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay !== "function") {
        setNotice("Unable to load payment gateway. Please try again.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "TwoSoul Perfume",
        description: "Order Payment",
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: false,
        },
        prefill: {
          name: auth ? `${auth.firstName || ""} ${auth.lastName || ""}`.trim() : "",
          email: auth?.email || "",
        },
        modal: {
          ondismiss: () => {
            setNotice("Payment cancelled by user.");
          },
        },
        handler: async (response) => {
          try {
            await api.verifyRazorpayPayment(response);
            await doCheckout(shippingAddressId, "Razorpay");
          } catch (error) {
            setNotice(`Payment verification failed: ${error.message}`);
          }
        },
      });

      razorpay.on("payment.failed", (event) => {
        const reason =
          event?.error?.description || event?.error?.reason || "Payment failed. Please try again.";
        setNotice(reason);
      });

      razorpay.open();
    } catch (error) {
      if (String(error?.message || "").includes("401")) {
        setNotice("Payment authentication failed on server. Please contact support.");
        return;
      }
      setNotice(`Unable to start payment: ${error.message}`);
    }
  }

  function handleCheckout(paymentMethod = "Razorpay") {
    if (!auth) {
      setNotice("Please log in before proceeding to checkout.");
      setPendingCheckout(true);
      setPendingPaymentMethod(paymentMethod);
      setView("login");
      return;
    }

    const runCheckout = async () => {
      if (loadingAddresses) {
        setNotice("Loading saved addresses, please wait...");
        return;
      }

      if (addresses.length > 0) {
        const selectedAddress =
          addresses.find((address) => address.id === selectedShippingAddressId) ||
          addresses.find((address) => address.isDefaultShipping) ||
          addresses[0];
        if (paymentMethod === "COD") {
          doCheckout(selectedAddress.id, "Offline");
        } else {
          startRazorpayCheckout(selectedAddress.id);
        }
        return;
      }

      // If local state is empty, fetch fresh addresses before sending user to add new address.
      setLoadingAddresses(true);
      const latestAddresses = await api.addresses().catch(() => []);
      setLoadingAddresses(false);

      const normalizedAddresses = Array.isArray(latestAddresses) ? latestAddresses : [];
      setAddresses(normalizedAddresses);

      if (normalizedAddresses.length > 0) {
        const selectedAddress =
          normalizedAddresses.find((address) => address.id === selectedShippingAddressId) ||
          normalizedAddresses.find((address) => address.isDefaultShipping) ||
          normalizedAddresses[0];

        setSelectedShippingAddressId(selectedAddress.id || "");
        if (paymentMethod === "COD") {
          doCheckout(selectedAddress.id, "Offline");
        } else {
          startRazorpayCheckout(selectedAddress.id);
        }
        return;
      }

      setNotice("No saved shipping address found. Please add one before checkout.");
      setPendingCheckout(true);
      setPendingPaymentMethod(paymentMethod);
      setView("address");
    };

    runCheckout();
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

      {view === "login" && (
        <OtpLogin onLogin={handleLogin} onPasswordLogin={() => setView("password-login")} />
      )}

      {view === "password-login" && (
        <PasswordLogin onLogin={handleLogin} onBackToOtp={() => setView("login")} />
      )}

      {view === "address" && (
        <AddressForm
          onCreated={(address) => {
            setAddresses((current) => [address, ...(current || [])]);
            setSelectedShippingAddressId(address.id);
            setNotice("Shipping address saved. You can now proceed to checkout.");
            if (pendingCheckout) {
              setPendingCheckout(false);
              const checkoutPaymentMethod = pendingPaymentMethod || "Razorpay";
              setPendingPaymentMethod("Razorpay");
              if (checkoutPaymentMethod === "COD") {
                doCheckout(address.id, "Offline");
              } else {
                startRazorpayCheckout(address.id);
              }
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
        onCheckout={(paymentMethod) => {
          setDrawerOpen(false);
          handleCheckout(paymentMethod);
        }}
        onChanged={setCart}
        onNotice={setNotice}
      />
    </div>
  );
}
