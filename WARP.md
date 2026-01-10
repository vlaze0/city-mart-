# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key commands

This is a Node.js + Express + MongoDB backend with a static HTML/JS frontend.

From the repository root:

- Install dependencies:
  - `npm install`
- Run the backend server (production mode):
  - `npm start`
- Run the backend server with auto-reload during development (requires `nodemon` which is already a devDependency):
  - `npm run dev`
- Explicit script alias used by some helpers:
  - `npm run start-city-mart-server`
- Seed the MongoDB database with demo products and a demo vendor user (requires `MONGODB_URI` to be set in `.env`):
  - `node seed.js`

Environment expectations:

- `.env` (not committed) should define at least:
  - `MONGODB_URI` – MongoDB connection string
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` – Razorpay API credentials
  - Optionally `PORT` – HTTP port (defaults to `3000`)

## High-level architecture

### Overview

This project is a single-process Express application that both:

1. Serves static frontend assets (HTML/CSS/JS) for the City Mart ecommerce UI.
2. Exposes a JSON API for products, users, orders, reviews, and payments.

There is no formal module system or directory separation; most backend logic lives in `server.js`, with authentication middleware in `middleware.js` and seed data logic in `seed.js`. The browser-side app logic is in `script.js` and is used by multiple HTML pages.

### Backend structure

**Entry point: `server.js`**

- Creates the Express app, configures CORS, JSON body parsing, and static file serving from the project root and `/uploads`.
- Connects to MongoDB using `mongoose` and `process.env.MONGODB_URI`.
- Initializes a Razorpay client using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Defines all Mongoose models inline:
  - `Product` – core catalog entity with pricing, legacy `category`, and newer `mainCategory`/`subCategory`/`brand` fields plus image URLs and vendor ownership (`vendorId`).
  - `User` – accounts with roles (`admin`, `vendor`, `customer`), verification state, and governance fields (`isBlocked`, `createdAt`, `lastLogin`).
  - `Order` – line-item based orders (array of `{ productId, quantity, price }`) with `totalAmount` and `status` (`pending`, `confirmed`, `cancelled`).
  - `Review` – product reviews with rating and optional comment.
- Uses authentication and authorization middleware imported from `middleware.js` to protect role-specific routes.
- Groups of routes:
  - **Product APIs**
    - Public listing and detail: `GET /api/products`, `GET /api/products/:id`.
    - Vendor/admin product management (file uploads via `multer`):
      - `POST /api/products` – create product, attaches `vendorId` for vendors and stores up to 4 image URLs.
      - `PUT /api/products/:id` – update product; vendors can only update their own products.
      - `DELETE /api/products/:id` – delete product; vendors restricted to their own products.
      - `GET /api/vendor/products` – vendor’s own products.
  - **User & auth APIs**
    - `POST /api/users/register` – direct registration path, marks users verified immediately.
    - Two-step signup with verification code:
      - `POST /api/users/request-signup-code` – creates unverified user with a random verification code and returns it in the response.
      - `POST /api/users/verify-signup` – validates the code and flips `isVerified`.
    - `POST /api/users/login` – login with special admin backdoor that creates/forces a specific admin account if the configured email/password are used. Issues JWT tokens signed with a shared secret and updates `lastLogin`. Blocked users (`isBlocked`) cannot log in.
  - **Order APIs**
    - `POST /api/orders` – create order (used from the frontend for COD and as a generic entry point).
    - `GET /api/orders/:userId` – list a customer’s orders.
    - `GET /api/orders` – list all orders (used for admin and vendor dashboards; filtering is done partly on the frontend).
    - Admin and vendor flows to confirm/cancel orders:
      - `PUT /api/orders/:id/confirm` – admin confirms any order.
      - `PUT /api/vendor/orders/:id/confirm` – vendor can confirm orders only when all items belong to that vendor.
      - `PUT /api/orders/:id/cancel` – admin cancels any order.
      - `PUT /api/customer/orders/:id/cancel` and `PUT /api/my-orders/:id/cancel` – customers cancel their own orders.
  - **Vendor and admin analytics APIs**
    - `GET /api/vendor/profile` – vendor profile, linked products, and count of customer orders that include their products.
    - `GET /api/admin/vendor-stats` – per-vendor aggregates (orders count, revenue, products count) with optional date range via `from`/`to` query params.
    - `GET /api/admin/summary` – global admin dashboard metrics (counts of users, vendors, products, and orders plus revenue breakdown by status).
    - `GET /api/admin/users` + `PUT /api/admin/users/:id/block`/`unblock` – user governance.
    - `GET /api/admin/customer-stats` – per-customer aggregates (ordersCount, totalSpent, lastOrderAt, plus block state).
  - **Reviews APIs**
    - `POST /api/reviews` – customers create reviews but only for products they have ordered (server-side check against `Order`).
    - `GET /api/products/:id/reviews` – public list of reviews for a product.
    - `GET /api/admin/reviews` and `DELETE /api/admin/reviews/:id` – admin review moderation.
  - **Payments APIs (Razorpay)**
    - `POST /api/payments/create-order` – creates a Razorpay order in INR and returns `orderId`, `amount`, `currency`, and the public key.
    - `POST /api/payments/verify` – verifies Razorpay signatures and, on success, creates a confirmed `Order` document with normalized product line items.
- Binds `app.listen(PORT)` at the end of `server.js`.

**Authentication / authorization: `middleware.js`**

- Stateless JWT-based auth using the same shared secret as in `server.js`.
- Exports middleware used widely across the API layer:
  - `authenticateToken` – validates `Authorization: Bearer <token>` and attaches `{ userId, role }` to `req.user`.
  - `requireAdmin`, `requireVendor`, `requireCustomer` – role guards for respective areas.
  - `requireAdminOrVendor` – used for product management endpoints shared between admins and vendors.

**Database seeding: `seed.js`**

- Independent script to populate MongoDB with demo catalog data and a demo vendor user.
- Defines small `Product` and `User` schemas similar to those in `server.js`.
- Builds a large set of products grouped by human-readable vendor-style categories (e.g. `"Local pet shops (food, toys, accessories)"`) from `vendorProducts` (mirrors frontend vendor tiles).
- For each group, inserts `Product` documents with that category and basic fields.
- Ensures a demo vendor user exists (email `demo.vendor@citymart.com`, password and role configured in this file) and marks it verified.

### Frontend structure

The frontend is a static multi-page app served from the project root. Key files (non-exhaustive):

- `index.html` – landing page with vendor tiles and entry into the mart.
- `products.html` – product listing page that reads query parameters such as `category`, `mainCategory`, `subCategory`, or `productId`.
- `admin.html`, `vendor.html`, `customer-dashboard.html`, `profile.html` – role-specific dashboards and profile views.
- `script.js` – shared JS used across pages to manage cart, auth, and API integration.
- `styles.css` – shared styling for layouts, modals, cart, dashboard components, etc.

**Core frontend responsibilities (in `script.js`)**

`script.js` contains a large amount of UI and integration logic; important clusters to know about:

- **Cart system**
  - Global `cart` array with helpers like `addToCart`, `updateCartCount`, `updateCartDisplay`, and functions for increasing/decreasing quantities and removing items.
  - Persists cart in `localStorage` under `citymart_cart`.
  - Supports extra attributes for certain products (e.g. gender for pet birds, size for clothing/shoes), handled via modals and additional metadata in cart items.
  - Checkout flow reads totals from the cart UI and applies a bill-time discount rule (10% off orders ≥ ₹1000) at the point of payment/ordering.

- **Authentication & session management**
  - Tracks `currentUser`, `authToken`, `loginContext` (customer vs vendor), and `authMode` (login vs signup) in JS globals.
  - `handleLoginSubmit` interacts with `/api/users/login` and `/api/users/request-signup-code`/`verify-signup` (signup flow is abstracted into helpers in this file).
  - On successful login, stores `citymart_token` and `citymart_user` in `localStorage`.
  - `updateAuthUI` updates header login button text and the user menu dropdown; menu content is role-aware (admin vs vendor vs customer) and dispatches to appropriate pages or modals.
  - `logout` clears session state and storage, then updates the UI.

- **Orders UI**
  - `showOrdersModal` / `loadOrders` fetch orders from the backend:
    - Customers hit `GET /api/orders/:userId`.
    - Vendors hit `GET /api/orders` and filter client-side to those containing their products via `productId.vendorId`.
  - Supports filtering by status and date range on the client, plus per-order cards listing items and showing status badges.
  - Customers can cancel orders from this UI via `cancelCustomerOrder`, which calls `PUT /api/customer/orders/:id/cancel` with the JWT token.

- **Checkout & payments**
  - `checkout` opens a checkout modal, builds an order summary list, and populates totals.
  - `handleCheckoutFormSubmission`:
    - Validates basic customer details and ensures a logged-in customer.
    - Computes discounts, respects a simple wallet balance if stored in `citymart_profile`, and builds a bill-style summary string.
    - For Cash on Delivery (`paymentMethod === 'cod'`), directly POSTs `/api/orders` and on success clears the cart and redirects to `payment-success.html`.
    - For online payments, orchestrates a Razorpay payment:
      - Calls `POST /api/payments/create-order` to get a Razorpay order.
      - Triggers Razorpay Checkout on the client (requires Razorpay JS script on the page).
      - On success, calls `POST /api/payments/verify` with Razorpay callback payload and the cart contents to create a confirmed order.

- **Vendor dashboard helpers**
  - Handles vendor product creation/editing via `handleVendorProductSubmit` using `FormData` and multiple `image` files (up to 4), calling the corresponding `/api/products` endpoints with the JWT token.
  - Maps UI-friendly main/sub categories into the legacy string categories used by the seed data so vendor-created products show up under the same vendor tiles used on the static homepage.
  - Provides helper functions like `initVendorSizeOptions`, `refreshVendorProductsList` (referenced), and navigation helpers for vendor pages.

- **Navigation helpers**
  - `navigateToProducts(mainCategoryOrCategory, subCategory?)` builds the correct query string for `products.html` based on either legacy `category` or the newer main/sub-category model.
  - `openProductFromOrder` constructs a URL that includes `productId` and category hints, used when clicking items from order cards.

### How pieces fit together

- The **static frontend** always talks to the backend on the same origin, but when loaded from `file://` (e.g., opening `index.html` in a browser without a dev server) it falls back to `http://localhost:3000` for all API calls.
- **Authentication state** is maintained purely in the browser via `localStorage` and JWTs. The backend relies on `authenticateToken` and `role` claims to authorize requests.
- **Catalog data** originates from `seed.js` (initial categories and demo vendor) and is extended at runtime by vendor-created products written via the `/api/products` endpoints.
- **Dashboards** (admin & vendor) are mostly powered by dedicated API endpoints in `server.js` and present data via `script.js` helpers tied to specific HTML templates.

When modifying behavior, prefer to:

- Keep backend route contracts (`/api/...` paths, request/response shapes) stable where possible, as `script.js` and multiple HTML pages depend on them.
- Consider both legacy `category` strings and the newer `mainCategory`/`subCategory` fields when changing product-related logic, since mapping functions in `script.js` and data in `seed.js` assume both forms.
