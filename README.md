# Store Inventory API

This project is a Next.js application backed by Prisma and SQLite for managing store inventory data. It exposes RESTful endpoints for products, purchases, sales, stock levels, and summary reports with CSV export support.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create and migrate the database:

   ```bash
   npm run db:migrate
   ```

3. Seed the database with sample data:

   ```bash
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Database schema

The Prisma schema defines `Product`, `Purchase`, and `Sale` models with decimal prices, relational links, and a unique (case-insensitive) product `code`. See [`prisma/schema.prisma`](prisma/schema.prisma) for details.

## API endpoints

All endpoints live under `/api/*` and accept/return JSON unless noted otherwise.

### `GET /api/products`

List all products. Optional query params:

- `id`: Fetch a single product by numeric ID.
- `code`: Fetch a single product by product code (case-insensitive).

### `POST /api/products`

Create a product.

```json
{
  "code": "pen-blk",
  "name": "Black Ballpoint Pen",
  "description": "Smooth writing pen",
  "price": 1.5
}
```

### `PATCH /api/products`

Update an existing product by ID. Send any subset of writable fields plus the `id`.

### `DELETE /api/products?id=123`

Deletes a product that has no related purchases or sales. Returns `409` if movements exist.

---

### `GET /api/purchases`

List purchases. Optional query params:

- `productId`: Filter by product ID.
- `from` / `to`: ISO date filters for the purchase date.

### `POST /api/purchases`

Create a purchase.

```json
{
  "productId": 1,
  "quantity": 20,
  "unitCost": 0.65,
  "purchasedAt": "2024-04-01T00:00:00.000Z"
}
```

### `PATCH /api/purchases`

Update a purchase by `id`. You may change the product, quantity, unit cost, or timestamp.

### `DELETE /api/purchases?id=45`

Delete a purchase by ID.

---

### `GET /api/sales`

List sales with optional `productId`, `from`, and `to` query params.

### `POST /api/sales`

Create a sale. Stock availability is enforced prior to insertion and the request fails with `409` when inventory is insufficient.

```json
{
  "productId": 1,
  "quantity": 5,
  "unitPrice": 1.35,
  "soldAt": "2024-04-04T00:00:00.000Z"
}
```

### `PATCH /api/sales`

Update a sale by `id`. Stock checks are re-run when changing product or quantity.

### `DELETE /api/sales?id=12`

Delete a sale by ID.

---

### `GET /api/stock`

Returns current on-hand stock per product, along with quantity purchased, sold, and the product price.

### `GET /api/reports`

Returns a sales/purchases summary report per product. Query params:

- `start` / `end`: Optional ISO date range.
- `format`: `json` (default) or `csv`. When `csv`, the response is a downloadable file.

Example response (`format=json`):

```json
[
  {
    "productId": 1,
    "code": "pen-blk",
    "name": "Black Ballpoint Pen",
    "price": 1.5,
    "totalPurchased": 180,
    "totalPurchaseValue": 112.5,
    "totalSold": 95,
    "totalSalesValue": 128.25,
    "stock": 85,
    "stockValue": 127.5,
    "period": {
      "start": null,
      "end": null
    }
  }
]
```

When `format=csv`, a CSV export is generated using PapaParse with equivalent fields and additional `periodStart`/`periodEnd` columns.

## Seeding

[`prisma/seed.ts`](prisma/seed.ts) inserts six sample products with 20 purchases and 20 sales spread across recent months. The seed command can be rerun safely; it truncates existing data before inserting new rows.

## Scripts

- `npm run dev`: Start Next.js in development mode.
- `npm run build`: Build the production bundle.
- `npm run start`: Run the production server.
- `npm run db:migrate`: Run pending Prisma migrations.
- `npm run db:seed`: Seed the database using Prisma.

## License

MIT
