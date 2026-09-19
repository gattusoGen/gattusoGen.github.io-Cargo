# CARGO Architecture

## Existing boundaries

- `ecommerce.html`, `admin.html`, and `styles.css`: existing presentation layer. No UI replacement.
- `server.js`: Express composition root, security middleware, static delivery, and route registration.
- `db.js`: SQLite connection, schema migrations, and seed data.
- `routes/products.js`: public catalog and product detail API.
- `routes/orders.js`: server-authoritative checkout, order tracking, inventory reservation, and payment initiation.
- `routes/payments.js`: PayFast notification processing.
- `routes/admin.js`: authenticated operations for orders, products, stock, and contact messages.
- `utils/payfast.js`, `utils/email.js`: payment payload and notification infrastructure.

## Production domain foundation

- Products: existing `products` table and `/api/products` route.
- Categories: `categories`, seeded from current catalog categories.
- Product variants: existing `product_variants`, with `order_items.variant_id` added for exact inventory identity.
- Users: `users` stores customer identity separately from admin users.
- Customer addresses: `customer_addresses` belongs to `users` and supports defaults.
- Shopping carts: `carts` and `cart_items`; guest carts use cryptographically random session tokens.
- Orders: existing `orders` and `order_items`, retained for compatibility with current checkout.
- Payments: `payments` records provider, amount, status, and provider identifiers.
- Inventory: `product_variants.stock_count` remains the current balance; `inventory_movements` records reservations and future releases/adjustments.
- Shipping: `shipping_methods` stores rates and free-shipping thresholds; `shipments` belongs to orders and stores tracking lifecycle.
- Admin users: existing bcrypt-backed `admin_users` and JWT middleware remain the administrative boundary.

## New API boundary

`routes/store.js` exposes categories, shipping methods, and server-backed guest cart primitives under `/api/store`. The existing storefront continues using its current endpoints, so this foundation can be adopted incrementally without a visual or routing rewrite.
