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
    throw new Error(body?.message || `Request failed with ${response.status}`);
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
  updateOrderStatus: (id, status) =>
    request(`/api/v1/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

