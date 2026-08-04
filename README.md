# TwoSoul Perfume Storefront Core

Production-ready ecommerce storefront built on top of CommerceCore.

This frontend now includes:

- Product catalog with category and search filtering
- Product detail and add-to-cart flow
- OTP login and session persistence
- Checkout with auto-login continuation
- Saved address creation, selection, default switching, and deletion
- Orders view and account area
- Admin panel integration
- Responsive premium brand UI

## Stack

- React + Vite
- CommerceCore REST APIs
- Local hash-based route state in app shell

## Environment

Create a .env file:

VITE_API_BASE_URL=https://commercecore.onrender.com
VITE_STORE_ID=your-store-guid

## Run

1. npm install
2. npm run dev

## Core Architecture For Reuse

You can use this as a base storefront for future ecommerce projects:

1. Keep CommerceCore as the backend core.
2. Rebrand the UI in src/styles.css, header, hero, and footer.
3. Replace product imagery under public/images.
4. Keep the application shell and data flow in src/App.jsx.
5. Reuse API integration in src/api.js.

## Important Reusable Files

- src/App.jsx: frontend orchestration and checkout funnel
- src/api.js: backend contract layer
- src/components/CartDrawer.jsx: cart and checkout readiness states
- src/components/AddressForm.jsx: address creation
- src/components/AddressBook.jsx: address management
- src/components/Footer.jsx: trust and conversion section
- src/components/admin/*: admin operations

## Checkout Flow

1. User clicks checkout from cart.
2. If unauthenticated, app switches to OTP login.
3. After login, app loads orders, cart, and addresses.
4. If address exists, default/selected shipping address is used.
5. If no address exists, user is moved to address creation.
6. Checkout is submitted to CommerceCore orders API.

## Future Enhancements

1. Add payment gateway integration (Razorpay/Stripe).
2. Add coupon application and validation UI.
3. Add wishlist persistence with dedicated storefront endpoints.
4. Add review submission and product recommendation blocks.
