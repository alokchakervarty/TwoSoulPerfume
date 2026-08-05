const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://commercecore.onrender.com";
const STORE_ID = import.meta.env.VITE_STORE_ID || "";

const TOKEN_KEY = "twosoul.auth";
const GUEST_ID_KEY = "twosoul.guestId";

function getGuestId() {
  if (typeof window === "undefined") return "";

  try {
    const savedGuestId = window.localStorage.getItem(GUEST_ID_KEY);
    if (savedGuestId) return savedGuestId;
  } catch {}

  const guestId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  } catch {}

  return guestId;
}

export function getSavedAuth() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeader() {
  const auth = getSavedAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}

async function request(path, options = {}) {
  const guestId = getGuestId();
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(STORE_ID ? { "X-Store-Id": STORE_ID } : {}),
    ...(guestId ? { "X-Guest-Id": guestId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok || body?.success === false) {
    const error = new Error(body?.message || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body?.data ?? body;
}

async function requestWithFallback(paths, options = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await request(path, options);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Request failed.");
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
    method: "POST",
    headers: {
      ...authHeader(),
      ...(STORE_ID ? { "X-Store-Id": STORE_ID } : {}),
      ...(getGuestId() ? { "X-Guest-Id": getGuestId() } : {}),
    },
    body: formData,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || `Upload failed with ${response.status}`);
  }

  return body?.data ?? body;
}

export const api = {
  products: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value != null)
    );
    return request(`/api/v1/products${query.size ? `?${query}` : ""}`);
  },
  product: (id) => request(`/api/v1/products/${id}`),
  createProduct: (payload) =>
    request("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id, payload) =>
    request(`/api/v1/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) => request(`/api/v1/products/${id}`, { method: "DELETE" }),
  categories: () => request("/api/v1/categories?activeOnly=true"),
  createCategory: (payload) =>
    request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestOtp: (identifier) =>
    request("/api/v1/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ identifier, channel: "Email" }),
    }),
  loginWithOtp: (identifier, code) =>
    request("/api/v1/auth/otp/login", {
      method: "POST",
      body: JSON.stringify({ identifier, channel: "Email", code }),
    }),
  loginWithPassword: (email, password) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request("/api/v1/auth/me"),
  cart: () => request("/api/v1/cart"),
  addToCart: (productVariantId, quantity = 1) =>
    request("/api/v1/cart", {
      method: "POST",
      body: JSON.stringify({ productVariantId, quantity }),
    }),
  updateCartItem: (cartItemId, quantity) =>
    request(`/api/v1/cart/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (cartItemId) =>
    request(`/api/v1/cart/${cartItemId}`, { method: "DELETE" }),
  myOrders: () => request("/api/v1/orders/my"),
  orders: () => request("/api/v1/orders"),
  checkout: (payload) =>
    request("/api/v1/orders/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createRazorpayOrder: ({ amount, currency = "INR", receipt }) =>
    requestWithFallback(
      ["/api/create-order", "/api/v1/payments/create-order"],
      {
        method: "POST",
        body: JSON.stringify({ amount, currency, receipt }),
      }
    ),
  verifyRazorpayPayment: (payload) =>
    requestWithFallback(
      ["/api/verify-payment", "/api/v1/payments/verify-payment"],
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  addresses: () =>
    request("/api/v1/addresses").then((result) => {
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.data)
            ? result.data
            : [];

      return list.filter((item) => item && item.id);
    }),
  createAddress: (payload) =>
    request("/api/v1/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAddress: (id, payload) =>
    request(`/api/v1/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAddress: (id) =>
    request(`/api/v1/addresses/${id}`, {
      method: "DELETE",
    }),
  countries: () =>
    request("/api/v1/countries?pageNumber=1&pageSize=100").then(
      (result) => result?.items || result?.data?.items || []
    ),
  updateOrderStatus: (id, status) =>
    request(`/api/v1/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
    uploadFile,
};

